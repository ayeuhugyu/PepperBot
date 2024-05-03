import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const removedata = new SubCommandData();
removedata.setName("remove");
removedata.setDescription("removes a reaction role by message id");
removedata.setPermissions([PermissionFlagsBits.ManageRoles]);
removedata.setPermissionsReadable("Manage Roles");
removedata.setWhitelist([]);
removedata.setCanRunFromBot(true);
removedata.addStringOption((option) =>
    option
        .setName("messageid")
        .setDescription(
            "the message id of the reaction role you want to remove"
        )
        .setRequired(true)
);
const remove = new SubCommand(
    removedata,
    async function getArguments(message) {
        const args = new Collection();

        const messageId = message.content.split(" ")[1];
        args.set(
            "messageid",
            await message.channel.messages.fetch(messageId).catch((err) => {})
        );
        if (!messageId) {
            args.set("messageid", undefined);
        }

        return args;
    },
    async function execute(message, args) {
        if (typeof args.get("messageid") === "string") {
            args._hoistedOptions.push({
                name: "channel",
                type: 7,
                value: await message.channel.messages.fetch(
                    args.get("messageid")
                ),
                channel: await message.channel.messages.fetch(
                    args.get("messageid")
                ),
            });
            return;
        }
        if (!args.get("messageid") || args.get("messageid") === undefined) {
            action.reply(message, "message does not exist in this channel");
            return;
        }

        let reaction_roles = JSON.parse(
            fs.readFileSync(config.paths.reaction_roles_file)
        );
        delete reaction_roles[args.get("messageid").id];
        action.deleteMessage(args.get("messageid"));
        fs.writeFileSync(
            config.paths.reaction_roles_file,
            JSON.stringify(reaction_roles, null, 2)
        );
        action.reply(
            message,
            "ceased collection of reactions of message `" +
                args.get("messageid").id +
                "`"
        );
    }
);

const createdata = new SubCommandData();
createdata.setName("create");
createdata.setDescription("creates a reaction role");
removedata.setPermissions([PermissionFlagsBits.ManageRoles]);
removedata.setPermissionsReadable("Manage Roles");
createdata.setWhitelist([]);
createdata.setCanRunFromBot(true);
createdata.addStringOption((option) =>
    option.setName("emoji").setDescription("the emoji to use").setRequired(true)
);
createdata.addRoleOption((option) =>
    option
        .setName("role")
        .setDescription(
            "the role to use (either mention the role or put it's id)"
        )
        .setRequired(true)
);
createdata.addStringOption((option) =>
    option
        .setName("text")
        .setDescription("the text to use in the message")
        .setRequired(true)
);
const create = new SubCommand(
    createdata,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "emoji",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .split(" ")[0]
                .trim()
        );
        args.set("role", message.mentions.roles.first());
        if (!args.get("role")) {
            try {
                args.set(
                    "role",
                    await message.guild.roles.fetch(
                        message.content
                            .slice(
                                config.generic.prefix.length +
                                    commandLength +
                                    args.get("emoji").length +
                                    1
                            )
                            .split(" ")[0]
                            .trim()
                    )
                );
                args.set(
                    "text",
                    message.content
                        .slice(
                            config.generic.prefix.length +
                                commandLength +
                                args.get("emoji").length +
                                1 +
                                args.get("role").id.length +
                                1
                        )
                        .trim()
                );
            } catch (err) {
                args.set("role", false);
            }
        } else {
            args.set(
                "text",
                message.content
                    .slice(
                        config.generic.prefix.length +
                            commandLength +
                            args.get("emoji").length +
                            1 +
                            args.get("role").toString().length +
                            1
                    )
                    .trim()
            );
        }
        return args;
    },
    async function execute(message, args) {
        if (!args.get("emoji")) {
            action.reply(message, "specify an emoji, baffoon!");
            return;
        }
        if (!args.get("role")) {
            action.reply(message, "specify a role, baffoon!");
            return;
        }
        if (!args.get("text")) {
            action.reply(message, "specify text, baffoon!");
            return;
        }
        const rrMessage = await action.sendMessage(
            message.channel,
            args.get("text")
        );
        await rrMessage.react(args.get("emoji"));

        const collectorFilter = (reaction) => {
            if (reaction.emoji.name === args.get("emoji")) {
                return true;
            } else if (
                `<:${reaction.emoji.name}:${reaction.emoji.id}>` ===
                args.get("emoji")
            ) {
                return true;
            } else {
                return false;
            }
        };

        const collector = await rrMessage.createReactionCollector({
            filter: collectorFilter,
            dispose: true,
        });
        collector.on("collect", (reaction, user) => {
            try {
                const member = rrMessage.guild.members.cache.get(user.id);
                member.roles.add(args.get("role"));
            } catch (error) {
                log.error(error);
            }
        });
        collector.on("remove", (reaction, user) => {
            try {
                const member = rrMessage.guild.members.cache.get(user.id);
                if (
                    member.roles.cache.find(
                        (role) => role.id == args.get("role").id
                    )
                )
                    member.roles.remove(args.get("role"));
            } catch (error) {
                log.error(error);
            }
        });
        let reaction_roles = JSON.parse(
            fs.readFileSync(config.paths.reaction_roles_file)
        );
        reaction_roles[rrMessage.id] = {
            role: args.get("role").id,
            emoji: args.get("emoji"),
        };
        fs.writeFileSync(
            config.paths.reaction_roles_file,
            JSON.stringify(reaction_roles, null, 2)
        );
    }
);

const data = new CommandData();
data.setName("reactionrole");
data.setDescription("create or remove reaction roles");
data.setPermissions([PermissionFlagsBits.ManageRoles]);
data.setPermissionsReadable("Manage Roles");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["rr"]);
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("subcommand to run")
        .setRequired(true)
        .addChoices(
            { name: "add", value: "add" },
            { name: "remove", value: "remove" }
        )
);
data.addStringOption((option) =>
    option
        .setName("emoji")
        .setDescription("the emoji to use")
        .setRequired(false)
);
data.addRoleOption((option) =>
    option
        .setName("role")
        .setDescription(
            "the role to use (either mention the role or put it's id)"
        )
        .setRequired(false)
);
data.addStringOption((option) =>
    option
        .setName("text")
        .setDescription("the text to use in the message")
        .setRequired(false)
);
data.addStringOption((option) =>
    option
        .setName("messageid")
        .setDescription(
            "the message id of the reaction role you want to remove"
        )
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message) {
        let args = new Collection();
        args.set("_SUBCOMMAND", message.content.split(" ")[1].trim());
        return args;
    },
    async function execute(message, args) {
        action.reply(message, `invalid subcommand, ${args.get("_SUBCOMMAND")}`);
    },
    [create, remove]
);

export default command;
