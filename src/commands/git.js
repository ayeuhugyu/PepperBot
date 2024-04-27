import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

const data = new CommandData();
data.setName("git");
data.setDescription("returns the github repo for this bot");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setAliases(["github", "openpepper", "repo"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
const command = new Command(
    data,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction) {
        action.reply(message, {
            content:
                "the public repo for this bot can be found [here](https://github.com/ayeuhugyu/PepperBot/)",
            ephemeral: true,
        });
    }
);

export default command;
