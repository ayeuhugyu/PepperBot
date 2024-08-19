import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";
import * as files from "../lib/files.js";
import process from "node:process";
import * as voice from "../lib/voice.js";
import * as gpt from "../lib/gpt.js";
import * as adobe from "../lib/adobe.js";
import shell from "shelljs";
import util from "node:util";
import guildConfigs from "../lib/guildConfigs.js";

const config = globals.config;

const data = new CommandData();
data.setName("eval");
data.setDescription("evaluates the provided code");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases();
data.addStringOption((option) =>
    option.setName("code").setDescription("what to evaluate").setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "code",
            message.content
                .slice(prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (!args.get("code")) {
            action.reply(message, "tf u want me to eval");
            return;
        }
        try {
            const commandsObject = await import("../lib/commands.js");
            const result = await (async function () {
                return await eval(args.get("code"));
            })();
            if (result) {
                action.reply(message, `result: \`\`\`${result}\`\`\``);
                return result;
            }
            action.reply(message, "no error generated, no result returned.");
            return;
        } catch (e) {
            action.reply(message, `\`\`\`${e}\`\`\``);
            return e;
        }
    },
    [] // subcommands
);

export default command;
