import default_embed from "../lib/default_embed.js";
import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { AdvancedPagedMenuBuilder } from "../lib/types/menuBuilders.js";
import { Collection } from "discord.js";
import fs from "fs";
import * as globals from "../lib/globals.js";

const config = globals.config;

const command_option_types = {
    1: "sub command",
    2: "sub command group",
    3: "string",
    4: "integer",
    5: "boolean",
    6: "user",
    7: "channel",
    8: "role",
    9: "mentionable",
    10: "number",
    11: "attachment",
};

async function listCommands(message) {
    const embed = default_embed();
    embed.setDescription("run p/help [command] for more info");
    let fieldsText = {
        [1]: "",
        [2]: "",
        [3]: "",
    };
    embed.setTitle("Commands");
    const commandFiles = fs
        .readdirSync("src/commands/")
        .filter((file) => file.endsWith(".js"));
    let currentField = 1;
    for (const file of commandFiles) {
        const command = await import(`./${file}`);
        const commandDefault = command.default;
        const commandData = commandDefault.data;

        if (commandData.permissions && commandData.permissions.length > 0) {
            let doNotAdd = false;
            commandData.permissions.forEach((permission) => {
                if (!message.member.permissions.has(permission)) {
                    doNotAdd = true;
                }
            });
            if (doNotAdd) {
                continue; // i do it like this because continue cannot cross the forEach
            }
        }

        if (commandData.whitelist && commandData.whitelist.length > 0) {
            if (!commandData.whitelist.includes(message.author.id)) {
                continue;
            }
        }
        fieldsText[currentField] += `p/${commandData.name}\n`;
        currentField = (currentField % 3) + 1;
    }
    embed.addFields(
        {
            name: "​",
            value: fieldsText[1],
            inline: true,
        },
        {
            name: "​",
            value: fieldsText[2],
            inline: true,
        },
        {
            name: "​",
            value: fieldsText[3],
            inline: true,
        }
    );
    action.reply(message, {
        embeds: [embed],
        ephemeral: true,
    });
    return;
}

function optionToText(option) {
    let optionText = `${option.description}
REQUIRED: ${option.required}
TYPE: ${command_option_types[option.type]}`;
    if (option.choices && option.choices.length > 0) {
        optionText += `\nCHOICES: ${option.choices
            .map((choice) => `${choice.value}`)
            .join(", ")}`;
    }
    return optionText;
}

async function infoAboutCommandWithOptions(
    message,
    command,
    currentEmbed,
    isSubCommand,
    parentCommandName
) {
    const menu = new AdvancedPagedMenuBuilder();
    menu.full.addPage(currentEmbed);
    for (const option of command.options) {
        let titleText = ``;
        if (isSubCommand) {
            titleText = `p/${parentCommandName} ${command.name}: ${option.name}`;
        } else {
            titleText = `p/${command.name}: ${option.name}`;
        }
        const optionEmbed = default_embed();
        optionEmbed.setTitle(titleText);
        optionEmbed.setDescription(optionToText(option));
        menu.full.addPage(optionEmbed);
    }
    const sentMessage = await action.reply(message, {
        embeds: [menu.pages[menu.currentPage]],
        components: [menu.actionRow],
        ephemeral: true,
    });
    if (!sentMessage) return;
    return menu.full.begin(sentMessage, 120_000, menu);
}

async function infoAboutCommand(
    message,
    command,
    isSubCommand,
    parentCommandName
) {
    const originalCommand = command;
    command = originalCommand.data;
    const commandPage = default_embed();
    let title = "";
    if (isSubCommand) {
        title = `p/${parentCommandName} ${command.name}`;
    } else {
        title = "p/" + command.name;
    }
    commandPage.setTitle(title);
    let text = `${command.description}\n`;
    if (command.aliases && command.aliases.length > 0) {
        text += `ALIASES: ${command.aliases.join(", ")}\n`;
    }
    if (command.permissions && command.permissions.length > 0) {
        text += `PERMISSIONS: ${command.permissionsReadable}\n`;
    }
    if (command.whitelist && command.whitelist.length > 0) {
        text += `WHITELIST: ${command.whitelist.toString()}\n`;
    }
    text += `CAN RUN FROM BOT: ${command.canRunFromBot}\n`;
    commandPage.setDescription(text);
    if (command.options && command.options.length > 0) {
        return await infoAboutCommandWithOptions(
            message,
            command,
            commandPage,
            isSubCommand,
            parentCommandName
        );
    } else {
        return action.reply(message, {
            embeds: [commandPage],
            ephemeral: true,
        });
    }
}

const data = new CommandData();
data.setName("help");
data.setDescription(
    "lists commands, if given a command name it will return info about that command"
);
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["commands"]);
data.addStringOption((option) =>
    option
        .setName("command")
        .setDescription("command to get info about")
        .setRequired(false)
);
data.addStringOption((option) =>
    option
        .setName("subcmd")
        .setDescription("subcommand to get info about")
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set("command", message.content.split(" ")[1]);
        if (args.get("command")) {
            args.set(
                "subcmd",
                message.content.slice(
                    config.generic.prefix.length +
                        commandLength +
                        message.content.split(" ")[1].length +
                        1
                )
            );
        }
        return args;
    },
    async function execute(message, args) {
        if (!args.get("command")) {
            return await listCommands(message);
        }
        const requestedCommand = args
            .get("command")
            .startsWith(config.generic.prefix)
            ? args.get("command").slice(config.generic.prefix.length)
            : args.get("command");
        const commands = await import("../lib/commands.js");
        const command = commands.default.commands.get(requestedCommand);
        if (!command) {
            action.reply(message, {
                content: `there's no command named ${requestedCommand}`,
                ephemeral: true,
            });
            return;
        }
        if (!args.get("subcmd")) {
            return await infoAboutCommand(message, command);
        }
        const requestedSubCommand = args.get("subcmd");
        const subCommands = command.subcommands; // subCommands is an array
        if (!subCommands || subCommands.length === 0) {
            action.reply(message, {
                content: `there's no subcommands for p/${command.data.name}`,
                ephemeral: true,
            });
            return;
        }
        const subCommand = subCommands.find(
            (subCommand) => subCommand.data.name === requestedSubCommand
        );
        if (!subCommand) {
            action.reply(message, {
                content: `there's no subcommand named  "${requestedSubCommand}" for p/${command.data.name}`,
                ephemeral: true,
            });
            return;
        }
        return await infoAboutCommand(
            message,
            subCommand,
            true,
            command.data.name
        );
    }
);

export default command;
