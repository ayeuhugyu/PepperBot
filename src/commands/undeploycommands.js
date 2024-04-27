import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import * as slashcommands from "../register_commands.js";
import fs from "fs";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

const data = new CommandData();
data.setName("undeploycommands");
data.setDescription(
    "undeploys slash commands to all guilds (or the specified one)"
);
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(false);
data.setDMPermission(true);
data.setAliases(["undeploy"]);
data.addStringOption((option) =>
    option
        .setName("guild")
        .setDescription(
            "the guild id to undeploy commands from (global for all guilds)"
        )
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message) {
        let args = new Collection();
        args.set("guild", message.content.split(" ")[1]);
        return args;
    },
    async function execute(message, args) {
        try {
            const msg = await action.reply(message, "undeploying commands...");
            await slashcommands.unregister(args.get("guild"));
            action.editMessage(msg, "all commands undeployed successfully");
        } catch (err) {
            action.reply(message, "failed to deploy commands");
            action.reply(message, err.toString());
        }
    }
);

export default command;
