import * as action from "../lib/discord_action.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import fs from "fs";
import { Command, CommandData } from "../lib/types/commands.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const data = new CommandData();
data.setName("sendlog");
data.setDescription("returns the specified log file");
data.setPermissions([PermissionFlagsBits.Administrator]);
data.setPermissionsReadable("Administrator");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.addStringOption((option) =>
    option
        .setName("log")
        .setDescription(
            "which log to send, \noptions include: debug.log, info.log, warn.log, error.log, messages.log"
        )
        .setRequired(true)
        .setChoices(
            { name: "debug.log", value: "debug.log" },
            { name: "info.log", value: "info.log" },
            { name: "warn.log", value: "warn.log" },
            { name: "error.log", value: "error.log" },
            { name: "fatal.log", value: "fatal.log" },
            { name: "messages.log", value: "messages.log" }
        )
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        let content = message.content
            .slice(config.generic.prefix.length + commandLength)
            .replaceAll(" ", "");
        if (!content.endsWith(".log")) {
            content += ".log";
        }
        const args = new Collection();
        args.set("log", content);
        return args;
    },
    async function execute(message, args) {
        if (args.get("log")) {
            const logs = fs
                .readdirSync(`${config.paths.logs}`)
                .filter((file) => file.endsWith(".log"));
            if (!logs.includes(args.get("log"))) {
                action.reply(
                    message,
                    "There's no such thing! this could also mean there just haven't been any of that type of log since the last time i ran p/cleanup"
                );
                return;
            }
            action.reply(message, {
                files: [
                    {
                        attachment: `${config.paths.logs}/${args.get("log")}`,
                        name: args.get("log"),
                    },
                ],
            });
        } else {
            action.reply(message, {
                content: "provide a log to send you baffoon!",
                ephemeral: true,
            });
        }
    }
);

export default command;
