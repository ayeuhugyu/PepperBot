import { Events, Message } from "discord.js";
import commands from "../lib/command_manager";
import { fetchGuildConfig } from "../lib/guild_config_manager";
import { Command, CommandInput, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { respond, GPTProcessor } from "../lib/gpt";
import { CommandEntryType } from "../lib/classes/command_enums";

async function gptHandler(message: Message) {
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
        message.content.startsWith(prefix)
    ) {
        return;
    }

    const processor = new GPTProcessor();
    processor.repliedMessage = message;
    processor.sentMessage = (await action.reply(message, { content: "processing...", ephemeral: true })) as Message;

    await respond(message, processor);
}

async function commandHandler(message: Message<true>) {
    if (message.author.bot) return;
    const config = await fetchGuildConfig(message.guild?.id);

    const prefix = config.other.prefix;
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const segments = message.content.split(/(?<!\\)\|/).map(part => part.replace(/\\\|/g, '|')) || [message.content];
    if (segments.length > 3) {
        await action.reply(message, "piping limit of 3 exceeded");
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
        action.reply(message, "command piping is disabled in this server");
        return;
    }
    let commandIndex = 0;
    for (const { command, provided_name } of queue) {
        if (!command) {
            await action.reply(message, `${prefix}${provided_name} doesn't exist :/`);
            return;
        }
        /*
        if (previous_command && !previous_command.pipable_to.includes(command.name)) {
            await action.reply(message, `${prefix}${command.name} is not pipable to ${prefix}${provided_name}`);
            return;
        }
        */ // should be checking for subcommand pipability, but im ngl im just too lazy to do allat rn and it doesn't really matter if this doesn't happen, some arguments will just be possibly undefined
        message.content = segments[commandIndex]?.trim();
        if (!message.content.startsWith(prefix)) {
            message.content = `${prefix}${message.content.replaceAll("\\|", "|")}`;
        }
        const commandEntryType = commands.getEntryType(provided_name);
        let alias = undefined;
        if (commandEntryType === CommandEntryType.CommandAlias || commandEntryType === CommandEntryType.SubcommandRootAlias) {
            alias = provided_name;
        }
        const input: CommandInput = await CommandInput.new(message, command, undefined!, {
            command_entry_type: commandEntryType,
            alias_used: alias,
            previous_response,
            will_be_piped: (segments.length > 1) && (commandIndex < segments.length - 1),
            piping_to: queue[commandIndex + 1]?.command?.name,
            next_pipe_message: segments[commandIndex + 1]?.trim()
        });

        const response = await command.execute(input);
        previous_response = response ?? new CommandResponse({});
        previous_response.from = command.name;
        previous_command = command;
        commandIndex++;
    }
}

export default {
    name: Events.MessageCreate,
    async execute(message: Message<true>) {
        // Wait for all handlers to finish.
        return await Promise.all([
            gptHandler(message),
            commandHandler(message)
        ]);
    },
};
