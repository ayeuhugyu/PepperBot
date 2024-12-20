import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import * as slashcommands from "../register_commands.js";
import fs from "fs";
import * as globals from "../lib/globals.js";

const config = globals.config;

const data = new CommandData();
data.setName("undeploycommands");
data.setDescription(
    "undeploys slash commands to all guilds (or the specified one)"
);
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(false);
;
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
        const msg = await action.reply(message, "deploying commands...");
        try {
            if (args.get("guild") === "global") {
                await slashcommands.refreshGlobalCommands(true);
            } else {
                await slashcommands.refreshGuildCommands(args.get("guild"), true);
            }
            action.editMessage(msg, "all commands removed successfully");
        } catch (err) {
            action.reply(message, "failed to deploy commands");
            action.reply(message, err.toString());
            action.editMessage(msg, "error occurred while removing commands");
        }
    }
);

export default command;
