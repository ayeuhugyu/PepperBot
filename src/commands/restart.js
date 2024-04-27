import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import fs from "fs";

const configNonDefault = await import("../../config.json", { assert: { type: 'json' }});
const config = configNonDefault.default

const data = new CommandData();
data.setName("restart");
data.setDescription("process.exit(0)");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "ARGUMENT",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args) {
        await action.reply(message, "Bye Bye! 🌶");
        process.exit(0);
    }
);
export default command;
