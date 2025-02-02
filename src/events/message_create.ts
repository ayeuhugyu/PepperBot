import { Events, Message } from "discord.js";
import commands from "../lib/command_manager";
import { fetchGuildConfig } from "../lib/guild_config_manager";
import { CommandResponse } from "../lib/classes/command";

async function commandHandler(message: Message) {
    if (message.author.bot) return;
    const config = await fetchGuildConfig(message.guild?.id);

    const prefix = config.other.prefix;
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const commandPipingList = message.content.split("|") || [message.content];
    if (commandPipingList.length > 3) {
        message.reply("piping limit of 3 exceeded");
        return;
    }
    let lastOutput = undefined;
    let previousCommand = undefined;
    let commandsInPipingList = [];
    
    for (const commandText of commandPipingList) {
        const command = (commandText.split(" ")[0] || commandText)?.trim().slice(prefix.length);
        const cmd = commands.get(command);
        commandsInPipingList.push(cmd || command);
    }
    if (commandPipingList.length > 1 && config.command.disable_command_piping) {
        message.reply("command piping is disabled in this server");
        return;
    }
    let commandIndex = 0;
    for (const command of commandsInPipingList) {
        if (typeof command === "string") {
            message.reply(`${prefix}${command} doesnt exist :/`);
            return;
        }
        if (previousCommand && !previousCommand.pipable_to.includes(command.name)) {
            message.reply(`${prefix}${previousCommand.name} is not pipable to ${prefix}${command.name}`);
            return;
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
            commandHandler(message),
        ])
    }
}