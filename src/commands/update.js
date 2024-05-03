import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";
import * as globals from "../lib/globals.js";
import pepperupdate from "./pepperupdate.js";
import setversion from "./setversion.js";
import deploycommands from "./deploycommands.js";

const config = globals.config;

const data = new CommandData();
data.setName("update");
data.setDescription("perform all the actions i gotta do for updates in one command");
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
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "message",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, isInteraction) {
        if (args.get("message")) {
            const persistent_data = await JSON.parse(
                fs.readFileSync("resources/data/persistent_data.json")
            );
            const version = persistent_data.version;
            const setversionArgs = new Collection();
            setversionArgs.set("version", version + 1);
            const deployCommandsArgs = new Collection();
            deployCommandsArgs.set("guild", "global");
            await setversion.execute(message, setversionArgs, isInteraction);
            await deploycommands.execute(message, deployCommandsArgs, isInteraction);
            await pepperupdate.execute(message, args, isInteraction);
        } else {
            action.reply(message, "provide an update log you baffoon!");
        }
    }
);

export default command;
