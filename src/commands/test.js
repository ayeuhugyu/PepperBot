import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
} from "../lib/types/commands.js";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

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
        action.reply(message, "refresh test")
        //action.reply(message, "REFRESH TEST")
    }
);

export default command;
