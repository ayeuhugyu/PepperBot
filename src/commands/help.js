import default_embed from "../lib/default_embed.js";
import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { AdvancedPagedMenuBuilder } from "../lib/types/menuBuilders.js";
import { Collection } from "discord.js";
import fs from "fs";
import * as globals from "../lib/globals.js";

const config = globals.config;

async function getCommands() {
    const commandFiles = fs
        .readdirSync(config.paths.commands)
        .filter((file) => file.endsWith(".js"));
    let commands = {};
    for (const file of commandFiles) {
        if (file !== "help.js") {
            const filePath = `./${file}`;
            const command = await import(filePath);
            if (
                command.default.data.aliases &&
                command.default.data.aliases.length > 0
            ) {
                command.default.data.aliases.forEach((alias) => {
                    commands[alias] = command.default.data;
                });
            }
            commands[command.default.data.name] = command.default.data;
        }
    }
    return commands;
}

//todo: convert this to the new commandsObject

const commands = await getCommands();

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
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        let command = message.content
            .slice(config.generic.prefix.length + commandLength)
            .trim();
        if (command.startsWith(config.generic.prefix)) {
            command = command.slice(config.generic.prefix.length);
        }
        args.set("command", command);
        return args;
    },
    async function execute(message, args) {
        let embed = default_embed();
        if (args.get("command")) {
            // reply with command info
            let commandString = args.get("command");
            if (commandString.startsWith(config.generic.prefix)) {
                args.set(
                    "command",
                    commandString.slice(config.generic.prefix.length)
                ).catch((err) => {
                    args._hoistedOptions.push({
                        name: "command",
                        type: 3,
                        value: commandString.slice(
                            config.generic.prefix.length
                        ),
                    });
                });
                commandString = args.get("command");
            }

            if (args.get("command") in commands) {
                const command = commands[args.get("command")];
                const menu = new AdvancedPagedMenuBuilder();
                const commandPage = default_embed();
                commandPage.setTitle(command.name);
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
                    menu.full.addPage(commandPage);
                    command.options.forEach((option) => {
                        const optionPage = default_embed();
                        optionPage.setTitle(option.name);
                        let optionText = `
${option.description}
REQUIRED: ${option.required}
TYPE: ${command_option_types[option.type]}`;
                        if (option.choices && option.choices.length > 0) {
                            optionText += `\nCHOICES: ${option.choices
                                .map((choice) => `${choice.value}`)
                                .join(", ")}`;
                        }
                        optionPage.setDescription(optionText);
                        menu.full.addPage(optionPage);
                    });
                    const sentMessage = await action.reply(message, {
                        embeds: [menu.pages[menu.currentPage]],
                        components: [menu.actionRow],
                        ephemeral: true,
                    });
                    menu.full.begin(sentMessage, 120_000, menu);
                } else {
                    action.reply(message, {
                        embeds: [commandPage],
                        ephemeral: true,
                    });
                    return;
                }
            } else {
                action.reply(message, {
                    content: "There's no such thing!",
                    ephemeral: true,
                });
                return;
            }
        } else {
            // reply with command list
            let text = "run p/help [command] for more info\n\n";
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
                let doNotAdd = false;
                if (
                    command.default.data.permissions &&
                    command.default.data.permissions.length > 0
                ) {
                    command.default.data.permissions.forEach((permission) => {
                        if (!message.member.permissions.has(permission)) {
                            doNotAdd = true;
                        }
                    });
                }
                if (
                    command.default.data.whitelist &&
                    command.default.data.whitelist.length > 0
                ) {
                    if (
                        !command.default.data.whitelist.includes(
                            message.author.id
                        )
                    ) {
                        doNotAdd = true;
                    }
                }
                if (!doNotAdd) {
                    //text += `p/${command.default.data.name}​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​`; // there's a zero width space between each space here so that discord oesn't reduce the space between them
                    fieldsText[
                        currentField
                    ] += `p/${command.default.data.name}\n`;
                    if (currentField >= 3) {
                        currentField = 0;
                    }
                    currentField++;
                }
            }
            embed.setDescription(text);
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
            //embed.setDescription(text);
        }
    }
);

export default command;
