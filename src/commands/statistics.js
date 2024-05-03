import statistics from "../lib/statistics.js";
import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const data = new CommandData();
data.setName("statistics");
data.setDescription("shows some statistics about bot usage");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["stats"]);
const command = new Command(
    data,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args) {
        const stats = await statistics.toEmbed();
        action.reply(message, { embeds: [stats], ephemeral: true });
    }
);

export default command;
