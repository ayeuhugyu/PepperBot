import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

function thisWillThrow() {
    action.undefined();
    action.undefined();
    action.undefined();
    action.undefined();
    action.undefined();
    action.undefined();
    return action.undefined();
}

const data = new CommandData();
data.setName("test");
data.setDescription("generic testing command");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
const command = new Command(
    data,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args) {
        thisWillThrow();
        thisWillThrow();
        thisWillThrow();
        thisWillThrow();
        thisWillThrow();
        thisWillThrow();
        thisWillThrow();
    }
);

export default command;
