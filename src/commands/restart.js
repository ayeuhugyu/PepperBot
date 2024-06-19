import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import * as globals from "../lib/globals.js";
import { Collection } from "discord.js";
import process from "node:process";

const config = globals.config;

const data = new CommandData();
data.setName("restart");
data.setDescription("process.exit(0)");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.addStringOption((option) =>
    option
        .setName("hostprocess")
        .setDescription("whether or not to restart the host process")
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        let argument = message.content.slice(
            config.generic.prefix.length + commandLength
        );
        if (argument) {
            argument.trim();
        } // this is necessary because if there are no arguments supplied argument will be equal to undefined and trim() will not be a function and thus will error
        args.set("hostProcess", argument);
        return args;
    },
    async function execute(message, args) {
        if (args.get("hostProcess")) {
            await action.reply(message, "restarting host process");
            process.send("fullrestart");
            return;
        }
        await action.reply(message, "Bye Bye! 🌶");
        process.exit(0);
    }
);
export default command;
