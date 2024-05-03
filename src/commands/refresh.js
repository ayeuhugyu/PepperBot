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

const data = new CommandData();
data.setName("refresh");
data.setDescription("refreshes a command");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases();
data.addStringOption((option) =>
    option
        .setName("command")
        .setDescription("command to refresh")
        .setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "command",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {
        const commandsObject = await import("../lib/commands.js"); // i need to import it in here to avoid circular dependencies
        if (!args.get("command")) {
            action.reply(message, {
                content: "supply a command to refresh, baffoon!",
                ephemeral: true,
            });
            return;
        }
        const sent = await action.reply(
            message,
            `refreshing \`p/${args.get("command")}\``
        );
        await commandsObject.default.refresh(args.get("command"));
        action.editMessage(sent, `refreshed \`p/${args.get("command")}\``);
    }
);

export default command;
