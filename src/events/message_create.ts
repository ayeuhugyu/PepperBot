import { Events, GuildChannelResolvable, Message, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import commands from "../lib/command_manager";
import { fetchGuildConfig, GuildConfig } from "../lib/guild_config_manager";
import { Command, CommandInput, CommandInvoker, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { respond } from "../lib/gpt/main";
import { CommandEntryType, CommandTag, InvokerType } from "../lib/classes/command_enums";
import { incrementPipedCommands } from "../lib/statistics";
import { handleDiabolicalEvent } from "../lib/diabolical_events_manager";
import * as log from "../lib/log";
import { getAlias, listAliases } from "../lib/alias_manager";
import { isMaintenanceModeActive, getMaintenanceEndTimestamp } from "../lib/maintenance_manager";
import { CommandAccessTemplates } from "../lib/templates";
import { getPermissionsFromMessage } from "../lib/permissions_utils";

async function gptHandler(message: Message<true>) {
    // Only process if the bot is mentioned.
    if (!message.mentions || !message.mentions.has(message.client.user?.id)) {
        return;
    }
    // verify bot has permissions to send messages
    const permissions = getPermissionsFromMessage(message);
    const requiredPermissions = [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessagesInThreads];
    if (!permissions || (!(permissions.has(PermissionFlagsBits.Administrator) || requiredPermissions.every(perm => permissions.has(perm))))) {
        log.warn(`could not complete gpt handler due to lack of permissions (${message.channel?.id})`);
        return;
    }

    // check maintenance mode
    if (await isMaintenanceModeActive()) {
        // check if user is in dev whitelist
        const isDevUser = CommandAccessTemplates.dev_only.whitelist.users.includes(message.author.id);

        if (!isDevUser) {
            const endTimestamp = getMaintenanceEndTimestamp();
            const endMessage = endTimestamp ?
                ` expected end time: <t:${endTimestamp}:t> (<t:${endTimestamp}:R>)` :
                "";

            await action.reply(message, {
                content: `bot is currently in maintenance mode, meaning you cannot use it.${endMessage}`,
            });
            return false;
        }
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

    log.info(`gpt handler invoked`);
    log.debug(`gpt handler invoked for ${message.author.username} in ${message.channel?.name} (${message.channel?.id}) with content "${message.content}"`);
    await respond(message);
}

interface QueuedCommand {
    command?: Command;
    provided_name: string;
    independent_execution?: boolean; // true for && executions, false for | executions
}

// validates if commands can be executed in the first place, there is no error reply if it is false
async function validateCommandExecution(message: Message<true>, config: GuildConfig): Promise<boolean> {
    // check if user is bot
    if (message.author.bot || (message.author.id === message.client.user?.id)) return false;

    // check if message starts with prefix
    const prefix = config.other.prefix;
    if (!message.content.startsWith(prefix)) return false;

    // check maintenance mode
    if (await isMaintenanceModeActive()) {
        // check if user is in dev whitelist
        const isDevUser = CommandAccessTemplates.dev_only.whitelist.users.includes(message.author.id);

        if (!isDevUser) {
            const endTimestamp = getMaintenanceEndTimestamp();
            const endMessage = endTimestamp ?
                ` expected end time: <t:${endTimestamp}:t> (<t:${endTimestamp}:R>)` :
                "";

            await action.reply(message, {
                content: `bot is currently in maintenance mode, meaning you cannot use it.${endMessage}`,
                ephemeral: config.other.use_ephemeral_replies
            });
            return false;
        }
    }

    // check config restrictions
    if (config.command.disable_all_commands) return false;
    if (config.command.blacklisted_channels.includes(message.channel.id)) return false;
    if (config.command.disabled_input_types.includes(InvokerType.Message)) return false;

    return true;
}

// alias resolution, replaces appropriate content if an alias is found
async function resolveCommandAlias(message: Message<true>, prefix: string): Promise<void> {
    const aliases = await listAliases(message.author.id);

    let prefixlessContent = message.content.trim();
    if (prefixlessContent.startsWith(prefix)) {
        prefixlessContent = prefixlessContent.slice(prefix.length).trim();
    }

    // find all valid aliases and score them
    const validAliases = aliases
        .filter(alias => prefixlessContent.startsWith(alias.alias))
        .sort((a, b) => b.alias.length - a.alias.length); // sort by longest alias first

    // use the most accurate alias (highest length)
    if (validAliases.length > 0) {
        const bestAlias = validAliases[0];
        log.debug(`found ${validAliases.length} valid aliases, using most accurate: ${bestAlias.alias} (length: ${bestAlias.alias.length}) for command ${prefixlessContent}, replacing with ${bestAlias.value}`);
        prefixlessContent = prefixlessContent.replace(bestAlias.alias, bestAlias.value);
        message.content = prefixlessContent.startsWith(prefix) ? prefixlessContent : `${prefix}${prefixlessContent}`;
    }
}

// parse message content into command segments for piping
function parseCommandSegments(content: string): string[] {
    const segments = content.split(/(?<!\\)\|/).map(part => part.replace(/\\\|/g, '|').trim()) || [content];
    log.debug(`split message into ${segments.length} segments: ${segments.map(s => `"${s}"`).join(", ")}`);
    return segments;
}

// piping constraints
async function validatePiping(message: Message<true>, segments: string[], config: GuildConfig): Promise<boolean> {
    const max_piped_commands = Math.min(config.command.max_piped_commands, 15);

    if (segments.length > max_piped_commands) {
        log.info(`returned early because too many piped commands: ${segments.length} > ${max_piped_commands}`);
        await action.reply(message, `you can't pipe more than ${max_piped_commands} commands at once`);
        return false;
    }

    if (segments.length > 1 && config.command.disable_command_piping) {
        await action.reply(message, "command piping is disabled in this server, you'll need to run each command individually.");
        return false;
    }

    return true;
}

// builds the command execution queue
function buildCommandQueue(segments: string[], prefix: string): QueuedCommand[] {
    const queue: QueuedCommand[] = [];

    for (const segment of segments) {
        const first_word = segment.trim().split(" ")[0].replace("\n", "");
        const provided_name = first_word.startsWith(prefix)
            ? first_word?.slice(prefix.length)
            : first_word;
        const command = commands.get(provided_name);

        queue.push({
            provided_name,
            command
        });
    }

    return queue;
}

// validates if a specific command can be executed
function validateCommand(command: Command | undefined, provided_name: string, config: GuildConfig): { valid: boolean; error?: string } {
    if (!command) {
        return { valid: false, error: `${config.other.prefix}${provided_name} isn't a valid command, run \`${config.other.prefix}help\` to see a list of valid commands` };
    }

    // check if command is blacklisted
    if (config.command.blacklisted_commands.includes(command.name)) {
        log.info(`command ${command.name} is blacklisted in this guild`);
        return { valid: false };
    }

    // check if any command tags are blacklisted
    if (command.tags && command.tags.some(tag => config.command.blacklisted_tags.includes(tag))) {
        log.info(`command ${command.name} has blacklisted category in this guild`);
        return { valid: false };
    }

    return { valid: true };
}

// prepares message content for command execution
function prepareMessageContent(message: Message<true>, segments: string[], commandIndex: number, command: Command, prefix: string): void {
    let content = segments[commandIndex]?.trim();
    const notPipable = command.not_pipable;

    if (notPipable) {
        content = segments.slice(commandIndex).join(" | ").trim();
    }

    message.content = content;
    if (!message.content.startsWith(prefix)) {
        message.content = `${prefix}${message.content.replaceAll("\\|", "|")}`;
    }
}

// execute a single command
async function executeCommand(
    message: Message<true>,
    command: Command,
    provided_name: string,
    previous_response: CommandResponse | undefined,
    segments: string[],
    commandIndex: number,
    queue: QueuedCommand[]
): Promise<CommandResponse> {
    const commandEntryType = commands.getEntryType(provided_name);
    let alias = undefined;

    if (commandEntryType === CommandEntryType.CommandAlias || commandEntryType === CommandEntryType.SubcommandRootAlias) {
        alias = provided_name;
    }

    const notPipable = command.not_pipable;
    const willBePiped = notPipable ? false : ((segments.length > 1) && (commandIndex < segments.length - 1));
    const pipingTo = notPipable ? undefined : queue[commandIndex + 1]?.command?.name;
    const nextPipeMessage = notPipable ? undefined : (segments[commandIndex + 1]?.trim());

    log.debug(`executing provided name ${provided_name} for command ${command.name}`);

    const input: CommandInput = await CommandInput.new(message, command, undefined!, {
        command_entry_type: commandEntryType,
        alias_used: alias,
        previous_response,
        will_be_piped: willBePiped,
        piping_to: pipingTo,
        next_pipe_message: nextPipeMessage
    }, commands);

    const response = await command.execute(input);
    const commandResponse = response ?? new CommandResponse({});
    commandResponse.from = command.name;

    return commandResponse;
}

// main command handler function
async function commandHandler(message: Message<true>) {
    const config = await fetchGuildConfig(message.guild?.id);
    const prefix = config.other.prefix;

    if (!(await validateCommandExecution(message, config))) return;

    log.debug(`command handler invoked for ${message.author.username} in ${message.channel?.name} (${message.channel?.id})`);

    await resolveCommandAlias(message, prefix);

    const segments = parseCommandSegments(message.content);
    if (!(await validatePiping(message, segments, config))) return;
    const queue = buildCommandQueue(segments, prefix);

    // execute commands
    let previous_response: CommandResponse | undefined = undefined;
    let commandIndex = 0;

    for (const { command, provided_name } of queue) {
        const validation = validateCommand(command, provided_name, config);
        if (!validation.valid) {
            if (validation.error) {
                log.info(`command ${provided_name} validation error`);
                log.debug(validation.error);
                await action.reply(message, validation.error);
            }
            return;
        }

        prepareMessageContent(message, segments, commandIndex, command!, prefix);

        const response = await executeCommand(
            message,
            command!,
            provided_name,
            previous_response,
            segments,
            commandIndex,
            queue
        );

        previous_response = response;

        if (response?.error) {
            // don't continue piping if the command errors
            return;
        }

        commandIndex++;

        // statistics
        if ((segments.length > 1) && !(command!.not_pipable && !(commandIndex > 1))) {
            await incrementPipedCommands();
        }

        // stop if command is not pipable (ex. p/alias)
        if (command!.not_pipable) {
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
