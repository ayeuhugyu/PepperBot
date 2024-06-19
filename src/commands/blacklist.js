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
import default_embed from "../lib/default_embed.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const viewdata = new SubCommandData();
viewdata.setName("view");
viewdata.setDescription("view the blacklist");
viewdata.setPermissions([]);
viewdata.setPermissionsReadable("");
viewdata.setWhitelist([]);
viewdata.setCanRunFromBot(true);
const view = new SubCommand(
    viewdata,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction) {
        let filestring = await fs.readFileSync(
            "resources/data/blacklist.json",
            "utf-8"
        );
        let blacklists = await JSON.parse(filestring);
        if (blacklists.length == 0 || blacklists == undefined) {
            action.reply(message, {
                content: "nobodys blacklisted (you are now LOL!!!!!/j)",
                ephemeral: true,
            });
            return;
        }

        let text = "";
        for (const user of blacklists) {
            text += `<@${user}> (${user})\n`;
        }

        const embed = default_embed()
            .setTitle("blacklisted users")
            .setDescription(text);
        action.reply(message, { embeds: [embed], ephemeral: true });
    }
);

const removedata = new CommandData();
removedata.setName("remove");
removedata.setDescription("remove a user from the blacklist");
removedata.setPermissions([]);
removedata.setPermissionsReadable("");
removedata.setWhitelist(["440163494529073152"]);
removedata.setCanRunFromBot(true);
removedata.addStringOption((option) =>
    option
        .setName("user")
        .setDescription("who to unblacklist")
        .setRequired(true)
);
const remove = new SubCommand(
    removedata,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "user",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (args.get("user")) {
            let filestring = await fs.readFileSync(
                "resources/data/blacklist.json"
            );
            let blacklists = await JSON.parse(filestring);
            if (blacklists.includes(args.get("user"))) {
                blacklists.splice(blacklists.indexOf(args.get("user")), 1);
                await fs.writeFileSync(
                    "resources/data/blacklist.json",
                    JSON.stringify(blacklists)
                );
                action.reply(message, {
                    content: `removed \`${args.get(
                        "user"
                    )}\` from the blacklist`,
                    ephemeral: true,
                });
            } else {
                action.reply(message, {
                    content: `user \`${args.get(
                        "user"
                    )}\` is not blacklisted, you baffoon!`,
                    ephemeral: true,
                });
            }
        } else {
            action.reply(message, {
                content: "provide a user to blacklist you baffoon!",
                ephemeral: true,
            });
        }
    }
);

const adddata = new CommandData();
adddata.setName("add");
adddata.setDescription("add to the blacklist");
adddata.setPermissions([]);
adddata.setPermissionsReadable("");
adddata.setWhitelist(["440163494529073152"]);
adddata.setCanRunFromBot(true);
adddata.addStringOption((option) =>
    option.setName("user").setDescription("who to blacklist").setRequired(true)
);
const add = new SubCommand(
    adddata,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        if (message.mentions.users.first()) {
            args.set("user", message.mentions.users.first().id);
        } else {
            args.set(
                "user",
                message.content
                    .slice(config.generic.prefix.length + commandLength)
                    .trim()
            );
        }

        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (args.get("user")) {
            let filestring = await fs.readFileSync(
                "resources/data/blacklist.json"
            );
            let blacklists = await JSON.parse(filestring);
            blacklists.push(args.get("user"));
            await fs.writeFileSync(
                "resources/data/blacklist.json",
                JSON.stringify(blacklists)
            );
            await action.reply(message, {
                content: `blacklisted \`${args.get("user")}\``,
                ephemeral: true,
            });
        } else {
            await action.reply(message, {
                content: "provide a user to blacklist you baffoon!",
                ephemeral: true,
            });
        }
    }
);

const data = new CommandData();
data.setName("blacklist");
data.setDescription("various blacklist related commands");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["bl"]);
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
        .setDescription("who to blacklist/unblacklist")
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
    async function execute(message, args, fromInteraction) {
        if (args.get("_SUBCOMMAND")) {
            action.reply(message, {
                content: "please provide a valid subcommand",
                ephemeral: true,
            });
            return;
        }
        view.execute(message, args, fromInteraction);
    },
    [add, remove, view] // subcommands
);

export default command;
