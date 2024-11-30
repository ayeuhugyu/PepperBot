import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";
import * as theme from "../lib/theme.js";
import * as globals from "../lib/globals.js";
import fsExtra from "fs-extra";

const config = globals.config;

function ensureTruebanList(guildID) {
    if (!fs.existsSync(`resources/data/truebans/${guildID}.json`)) {
        fsExtra.ensureFileSync(`resources/data/truebans/${guildID}.json`);
        fs.writeFileSync(`resources/data/truebans/${guildID}.json`, "[]");
    }
}

function addTrueban(id, guildID) {
    ensureTruebanList(guildID)
    const truebanList = fs.readFileSync(`resources/data/truebans/${guildID}.json`);
    let truebanListParsed = JSON.parse(truebanList);
    truebanListParsed.push(id);
    fs.writeFileSync(`resources/data/truebans/${guildID}.json`, JSON.stringify(truebanListParsed, null, 2));
}

function removeTrueban(id, guildID) {
    ensureTruebanList(guildID)
    const truebanList = fs.readFileSync(`resources/data/truebans/${guildID}.json`);
    let truebanListParsed = JSON.parse(truebanList);
    truebanListParsed.splice(truebanListParsed.indexOf(id), 1);
    fs.writeFileSync(`resources/data/truebans/${guildID}.json`, JSON.stringify(truebanListParsed, null, 2));
}

function getTruebanList(guildID) {
    ensureTruebanList(guildID)
    const truebanList = fs.readFileSync(`resources/data/truebans/${guildID}.json`);
    if (truebanList == "") {
        return [];
    }
    return JSON.parse(truebanList);
}

const viewdata = new SubCommandData();
viewdata.setName("view");
viewdata.setDescription("view the trueban list for this server");
viewdata.setPermissions([]);
viewdata.setPermissionsReadable("");
viewdata.setWhitelist([]);
viewdata.setAliases(["list"]);
viewdata.setCanRunFromBot(true);
const view = new SubCommand(
    viewdata,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        const truebanList = getTruebanList(message.guild.id);
        if (truebanList.length == 0 || truebanList == undefined) {
            action.reply(message, {
                content: "nobodys truebanned",
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }

        let text = "";
        for (const user of truebanList) {
            text += `<@${user}> (${user})\n`;
        }

        const embed = theme.createThemeEmbed(theme.themes[gconfig.theme] || theme.themes.CURRENT)
            .setTitle("truebanned users")
            .setDescription(text);
        action.reply(message, { embeds: [embed], ephemeral: gconfig.useEphemeralReplies });
    }
);

const removedata = new SubCommandData();
removedata.setName("remove");
removedata.setDescription("remove a user from the trueban list");
removedata.setPermissions([]);
removedata.setPermissionsReadable("");
removedata.setWhitelist([]);
removedata.setCanRunFromBot(true);
removedata.addStringOption((option) =>
    option
        .setName("user")
        .setDescription("who to remove from the trueban list")
        .setRequired(true)
);
const remove = new SubCommand(
    removedata,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "user",
            message.content
                .slice(prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (message.author.id !== message.guild.ownerId) {
            await action.reply(message, {
                content: "only the server owner can add or remove users from the trueban list",
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        const truebanList = getTruebanList(message.guild.id);
        if (args.get("user")) {
            if (truebanList.includes(args.get("user"))) {
                removeTrueban(args.get("user"), message.guild.id);
                action.reply(message, {
                    content: `removed \`${args.get("user")}\` from the trueban list. you will still have to manually unban and reinvite them though!`,
                    ephemeral: gconfig.useEphemeralReplies,
                });
            } else {
                action.reply(message, {
                    content: `user \`${args.get("user")}\` is not truebanned, you baffoon!`,
                    ephemeral: gconfig.useEphemeralReplies,
                });
            }
        } else {
            action.reply(message, {
                content: "provide a user to trueban you baffoon!",
                ephemeral: gconfig.useEphemeralReplies,
            });
        }
    }
);

const adddata = new SubCommandData();
adddata.setName("add");
adddata.setDescription("add to the trueban list");
adddata.setPermissions([]);
adddata.setPermissionsReadable("");
adddata.setWhitelist([]);
adddata.setCanRunFromBot(true);
adddata.addStringOption((option) =>
    option.setName("user").setDescription("who to trueban").setRequired(true)
);
const add = new SubCommand(
    adddata,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        if (message.mentions.users.first()) {
            args.set("user", message.mentions.users.first().id);
        } else {
            args.set(
                "user",
                message.content
                    .slice(prefix.length + commandLength)
                    .trim()
            );
        }

        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (message.author.id !== message.guild.ownerId) {
            await action.reply(message, {
                content: "only the server owner can add or remove users from the trueban list",
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        if (args.get("user")) {
            if (args.get("user") == message.author.id) {
                await action.reply(message, {
                    content: "you cannot trueban yourself, you baffoon!",
                    ephemeral: gconfig.useEphemeralReplies,
                });
                return;
            }
            addTrueban(args.get("user"), message.guild.id);
            try {
                await message.guild.members.ban(args.get("user"));
                await action.reply(message, {
                    content: `truebanned \`${args.get("user")}\``,
                    ephemeral: gconfig.useEphemeralReplies,
                });
            } catch (e) {
                await action.reply(message, {
                    content: `could not ban \`${args.get("user")}\`, added to trueban list regardless.`,
                    ephemeral: gconfig.useEphemeralReplies,
                });
            }
        } else {
            await action.reply(message, {
                content: "provide a user to trueban you baffoon!",
                ephemeral: gconfig.useEphemeralReplies,
            });
        }
    }
);

const data = new CommandData();
data.setName("trueban");
data.setDescription("bans a user, and makes it impossible to unban them");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setAliases([]);
data.setDoNotDeploy(true)
data.setPrimarySubcommand(view)
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("subcommand to run")
        .setRequired(true)
        .addChoices(
            { name: "add", value: "add" },
            { name: "remove", value: "remove" },
            { name: "view", value: "view" }
        )
);
data.addStringOption((option) =>
    option
        .setName("user")
        .setDescription("who to trueban/untrueban")
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set("_SUBCOMMAND", message.content.split(" ")[1]);
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (args.get("_SUBCOMMAND")) {
            action.reply(message, {
                content: "please provide a valid subcommand",
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
    },
    [add, remove, view] // subcommands
);

export default command;
