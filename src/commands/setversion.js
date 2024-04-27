import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";

const configNonDefault = await import("../../config.json", { assert: { type: 'json' }});
const config = configNonDefault.default

const data = new CommandData();
data.setName("setversion");
data.setDescription("change bot version");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.addStringOption((option) =>
    option
        .setName("version")
        .setDescription("what to set version to")
        .setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "version",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args) {
        if (args.get("version")) {
            let persistent_data = JSON.parse(
                fs.readFileSync(config.paths.persistent_data_file, "utf-8")
            );
            persistent_data.version = args.get("version");
            await fs.writeFileSync(
                config.paths.persistent_data_file,
                JSON.stringify(persistent_data, null, 2)
            );
            action.reply(
                message,
                `wrote version as \`${args.get("version")}\``
            );
        } else {
            action.reply(message, "provide a version you baffoon!");
        }
    }
);

export default command;
