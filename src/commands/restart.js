import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import * as globals from "../lib/globals.js";
import process from "node:process"

const config = globals.config;

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
        return null;
    },
    async function execute(message, args) {
        await action.reply(message, "Bye Bye! 🌶");
        process.exit(0);
    }
);
export default command;
