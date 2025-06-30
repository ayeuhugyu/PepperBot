import { Events, Message } from "discord.js";
import commands from "../lib/command_manager";
import { fetchGuildConfig } from "../lib/guild_config_manager";
import { Command, CommandInput, CommandInvoker, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { respond } from "../lib/gpt/main";
import { CommandEntryType, CommandTag, InvokerType } from "../lib/classes/command_enums";
import { incrementPipedCommands } from "../lib/statistics";
import { handleDiabolicalEvent } from "../lib/diabolical_events_manager";
import * as log from "../lib/log";
import { getAlias } from "../lib/alias_manager";

async function gptHandler(message: Message<true>) {
    // Only process if the bot is mentioned.
    if (!message.mentions || !message.mentions.has(message.client.user?.id)) {
        return;
    }

    const gconfig = await fetchGuildConfig(message.guild?.id);
    const prefix = gconfig.other.prefix;

    // Skip if AI responses are disabled, the channel is blacklisted,
    // the author is a bot, or the message starts with the command prefix.
    if (
        gconfig.AI.disable_responses ||
        gconfig.AI.blacklisted_channels.includes(message.channel.id) ||
        message.author.bot ||
        message.content.startsWith(prefix) ||
        message.author.id === message.client.user?.id
    ) {
        return;
    }

    log.debug(`gpt handler invoked for ${message.author.username} in ${message.channel?.name} (${message.channel?.id}) with content "${message.content}"`);
    await respond(message);
}

async function commandHandler(message: Message<true>) {
    if (message.author.bot || message.author.id === message.client.user?.id) {
        return;
    };
    const config = await fetchGuildConfig(message.guild?.id);
    // TODO: add more checks for config stuff, turns out i just straight up forgot to implement config.command.disable_all_commands and config.command.blacklisted_commands and all that. literally the only thing in there thats implemented is config.command.disable_command_piping

    const prefix = config.other.prefix;
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    let firstWord = message.content.trim().split(" ")[0];
    if (firstWord.startsWith(prefix)) {
        firstWord = firstWord.slice(prefix.length);
    }
    const alias = await getAlias(message.author.id, firstWord);
    if (alias) {
        log.debug(`found alias ${alias.alias} for command ${firstWord}, replacing with ${alias.value}`);
        message.content = message.content.replace(firstWord, alias.value);
    } else {
        log.debug(`no alias found for command ${firstWord}`);
    }
    log.debug(`command handler invoked for ${message.author.username} in ${message.channel?.name} (${message.channel?.id})`);
    const segments = message.content.split(/(?<!\\)\|/).map(part => part.replace(/\\\|/g, '|').trim()) || [message.content];
    // TODO: allow multiple commands executing using && as well as |
    log.debug(`split message into ${segments.length} segments: ${segments.map(s => `"${s}"`).join(", ")}`);
    if (segments.length > 3) { // TODO: put this limit in like config.command.max_piped_commands or something, though set a second limit on that one so that it can't be more than like 20 or something so we dont end up with a bug where someone pipes like 100 commands and it takes forever to process
        await action.reply(message, `you can't pipe more than 3 commands at once, this is to prevent spam.`);
        return;
    }

    interface Queued {
        command?: Command,
        provided_name: string
    }

    let previous_response = undefined;
    let previous_command = undefined;
    let queue: Queued[] = [];

    for (const segment of segments) {
        const first_word = segment.trim().split(" ")[0];
        const provided_name = first_word.startsWith(prefix)
            ? first_word?.slice(prefix.length)
            : first_word;
        const command = commands.get(provided_name);
        queue.push({
            provided_name,
            command
        });
    }
    if (segments.length > 1 && config.command.disable_command_piping) {
        action.reply(message, "command piping is disabled in this server, you'll need to run each command individually.");
        return;
    }
    let commandIndex = 0;
    for (const { command, provided_name } of queue) {
        if (!command) {
            log.info(`command ${provided_name} not found`);
            await action.reply(message, `${prefix}${provided_name} isn't a valid command, run \`${prefix}help\` to see a list of valid commands`);
            return;
        }
        let content = segments[commandIndex]?.trim();
        const notPipable = command.not_pipable
        if (notPipable) {
            content = segments.slice(commandIndex).join(" | ").trim();
        }
        message.content = content;
        if (!message.content.startsWith(prefix)) {
            message.content = `${prefix}${message.content.replaceAll("\\|", "|")}`;
        }
        const commandEntryType = commands.getEntryType(provided_name);
        let alias = undefined;
        if (commandEntryType === CommandEntryType.CommandAlias || commandEntryType === CommandEntryType.SubcommandRootAlias) {
            alias = provided_name;
        }
        log.debug(`executing provided name ${provided_name} for command ${command.name}`);
        const input: CommandInput = await CommandInput.new(message, command, undefined!, {
            command_entry_type: commandEntryType,
            alias_used: alias,
            previous_response,
            will_be_piped: notPipable ? false : ((segments.length > 1) && (commandIndex < segments.length - 1)),
            piping_to: notPipable ? undefined : queue[commandIndex + 1]?.command?.name,
            next_pipe_message: notPipable ? undefined : (segments[commandIndex + 1]?.trim())
        }, commands);

        const response = await command.execute(input);
        previous_response = response ?? new CommandResponse({});
        previous_response.from = command.name;
        previous_command = command;
        if (response?.error) {
            // don't continue piping if the command errors
            return;
        }
        commandIndex++;
        if ((segments.length > 1) && !(notPipable && !(commandIndex > 1))) {
            await incrementPipedCommands();
        }
        if (notPipable) {
            // do not continue piping if the command is not pipable
            return;
        }
    }
}

export default {
    name: Events.MessageCreate,
    async execute(message: Message<true>) {
        // Wait for all handlers to finish
        return Promise.all([
            gptHandler(message),
            commandHandler(message),
            handleDiabolicalEvent(message)
        ]);
    },
};
