import { Events, Message } from "discord.js";
import commands from "../lib/command_manager";
import { fetchGuildConfig } from "../lib/guild_config_manager";
import { CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { respond, GPTProcessor } from "../lib/gpt";

async function gptHandler(message: Message) {
    if (!message.mentions || !message.mentions.has(message.client.user?.id)) return;

    const gconfig = await fetchGuildConfig(message.guild?.id)
    const prefix = gconfig.other.prefix;

    if (gconfig.AI.disable_responses) return;
    if (gconfig.AI.blacklisted_channels.includes(message.channel.id)) return;
    if (message.author.bot) return;
    if (message.content.startsWith(prefix)) return;

    const processor = new GPTProcessor();
    processor.repliedMessage = message;
    processor.sentMessage = await action.reply(message, { content: "processing...", ephemeral: true }) as Message;

    await respond(message, processor);
}

async function commandHandler(message: Message) {
    if (message.author.bot) return;
    const config = await fetchGuildConfig(message.guild?.id);

    const prefix = config.other.prefix;
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const commandPipingList = message.content.split(/(?<!\\)\|/).map(part => part.replace(/\\\|/g, '|')) || [message.content];
    if (commandPipingList.length > 3) {
        await action.reply(message, "piping limit of 3 exceeded");
        return;
    }
    let lastOutput = undefined;
    let previousCommand = undefined;
    let commandsInPipingList = [];
    
    for (const commandText of commandPipingList) {
        const splitText = (commandText?.trim().split(" ")[0]?.trim() || commandText)?.trim();
        const command = commandText?.trim()?.startsWith(prefix) 
            ? splitText?.slice(prefix.length) 
            : splitText;
        const cmd = commands.get(command);
        commandsInPipingList.push(cmd || command);
    }
    if (commandPipingList.length > 1 && config.command.disable_command_piping) {
        action.reply(message, "command piping is disabled in this server");
        return;
    }
    let commandIndex = 0;
    for (const command of commandsInPipingList) {
        if (typeof command === "string") {
            await action.reply(message, `${prefix}${command} doesnt exist :/`);
            return;
        }
        if (previousCommand && !previousCommand.pipable_to.includes(command.name)) {
            await action.reply(message, `${prefix}${previousCommand.name} is not pipable to ${prefix}${command.name}`);
            return;
        }
        message.content = commandPipingList[commandIndex]?.trim();
        if (!message.content.startsWith(prefix)) {
            message.content = `${prefix}${message.content.replaceAll("\\|", "|")}`;
        }
        const commandResponse = await command.execute({
            message,
            _response: lastOutput,
            will_be_piped: (commandPipingList.length > 1) && (commandIndex < commandPipingList.length - 1),
        });
        lastOutput = commandResponse;
        if (lastOutput === undefined) lastOutput = new CommandResponse({});
        lastOutput.from = command.name;
        previousCommand = command;
        commandIndex++;
    }
}

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        return await Promise.all([
            gptHandler(message),
            commandHandler(message),
        ])
    }
}