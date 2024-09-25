import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const data = new CommandData();
data.setName("cleanup");
data.setDescription("cleans up some useless files to save on storage space");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([config.generic.global_whitelist]);
data.setCanRunFromBot(true);
;
data.setAliases(["clean", "clear", "cu"]);
data.addStringOption((option) =>
    option.setName("what").setDescription("what to cleanup").setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "what",
            message.content
                .slice(prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, isInteraction, gconfig) {
        const sounds = await fs.readdirSync("resources/ytdl_cache");
        const gptdownloads = await fs.readdirSync("resources/gptdownloads");
        const logs = await fs.readdirSync("logs");
        let files = [];
        for (const sound of sounds) {
            files.push("resources/ytdl_cache/" + sound);
        }
        for (const file of gptdownloads) {
            files.push("resources/gptdownloads/" + file);
        }
        for (const log of logs) {
            if (log.endsWith(".log") && !(log == "messages.log")) {
                files.push("logs/" + log);
            } // avoids adding dirs because im too lazy to do allat rn
        }
        if (args.get("what") == "logs") {
            files = [];
            for (const log of logs) {
                if (log.endsWith(".log") && !(log == "messages.log")) {
                    files.push("logs/" + log);
                } // avoids adding dirs because im too lazy to do allat rn
            }
        }
        if (args.get("what") == "videos") {
            files = [];
            for (const sound of sounds) {
                files.push("resources/ytdl_cache/" + sound);
            }
        }
        if (args.get("what") == "gptdownloads") {
            files = [];
            for (const file of gptdownloads) {
                files.push("resources/gptdownloads/" + file);
            }
        }
        let filesize = 0;
        files.forEach((file) => {
            filesize += fs.statSync(file).size / (1024 * 1024);
            fs.unlinkSync(file);
        });
        action.reply(message, {
            content: `removed ${files.length} files, totaling ${Math.floor(
                filesize
            )} MB`,
            ephemeral: gconfig.useEphemeralReplies,
        });
    }
);

export default command;
