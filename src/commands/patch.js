import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";
import * as globals from "../lib/globals.js";
import update from "./update.js";

const config = globals.config;

const data = new CommandData();
data.setName("patch");
data.setDescription(
    "perform all the actions i gotta do for updates in one command"
);
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.addStringOption((option) =>
    option.setName("message").setDescription("what to say").setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "message",
            message.content
                .slice(prefix.length + commandLength)
                .trim()
        );
        args.set("patch", true);
        return args;
    },
    async function execute(message, args, isInteraction) {
        if (args.get("message")) {
            update.execute(message, args, isInteraction);
        } else {
            action.reply(message, "provide an update log you baffoon!");
        }
    }
);

export default command;
