import { Events, Message } from "discord.js";
import commands from "../lib/command_manager";
import { fetchGuildConfig } from "../lib/guild_config_manager";
import { CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { respond, GPTProcessor } from "../lib/gpt";

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

async function commandHandler(message: Message) {
    // Ignore bot messages.
    if (message.author.bot) {
        return;
    }

    const config = await fetchGuildConfig(message.guild?.id);
    const prefix = config.other.prefix;

    // Process only messages that start with the prefix.
    if (!message.content.startsWith(prefix)) {
        return;
    }

    // Split the message into segments using unescaped pipes as delimiters.
    const commandPipingList = message.content
        .split(/(?<!\\)\|/)
        .map((part) => part.replace(/\\\|/g, "|")) || [message.content];

    if (commandPipingList.length > 3) {
        await action.reply(message, "piping limit of 3 exceeded");
        return;
    }

    let lastOutput;
    let previousCommand;
    const commandsInPipingList = [];

    // Parse each command segment.
    for (const commandText of commandPipingList) {
        const trimmedText = commandText.trim();
        const firstWord = trimmedText.split(" ")[0].trim();
        // Remove the prefix if present.
        const commandName = trimmedText.startsWith(prefix)
            ? firstWord.slice(prefix.length)
            : firstWord;
        const cmd = commands.get(commandName);
        commandsInPipingList.push(cmd || commandName);
    }

    if (commandPipingList.length > 1 && config.command.disable_command_piping) {
        await action.reply(message, "command piping is disabled in this server");
        return;
    }

    // Execute each command in the piping list.
    let commandIndex = 0;
    for (const command of commandsInPipingList) {
        // If the command wasn't found, reply and exit.
        if (typeof command === "string") {
            await action.reply(message, `${prefix}${command} doesn't exist :/`);
            return;
        }

        // Ensure that piped commands are allowed.
        if (previousCommand && !previousCommand.pipable_to.includes(command.name)) {
            await action.reply(message, `${prefix}${previousCommand.name} is not pipable to ${prefix}${command.name}`);
            return;
        }

        // Prepare the command text for this segment.
        let currentCommandText = commandPipingList[commandIndex].trim();
        if (!currentCommandText.startsWith(prefix)) {
            currentCommandText = `${prefix}${currentCommandText.replaceAll("\\|", "|")}`;
        }
        // Optionally update message.content if needed for parsing.
        message.content = currentCommandText;

        const commandResponse = await command.execute({
            message,
            _response: lastOutput,
            will_be_piped: commandPipingList.length > 1 && commandIndex < commandPipingList.length - 1,
        });
        lastOutput = commandResponse || new CommandResponse({});
        lastOutput.from = command.name;
        previousCommand = command;
        commandIndex++;
    }
}

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        // Wait for all handlers to finish. 
        return await Promise.all([
            gptHandler(message), 
            commandHandler(message)
        ]);
    },
};
