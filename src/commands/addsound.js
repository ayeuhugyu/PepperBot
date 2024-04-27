import request from "request"; // yes i know this is deprecated i will fix it later (no i won't)
import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

async function download(url, filename) {
    return new Promise((resolve, reject) => {
        const fixedFileName = filename
            .toLowerCase()
            .replaceAll(" ", "_")
            .replaceAll("-", "_")
            .replaceAll("/", "_")
            .replaceAll("\\", "_");
        request
            .get(url)
            .on("error", (err) => {
                log.error(err);
                reject(err);
            })
            .pipe(
                fs
                    .createWriteStream(
                        `${config.paths.soundboard}/${fixedFileName}`
                    )
                    .on("finish", () => {
                        resolve(true);
                    })
                    .on("error", (err) => {
                        reject(err);
                    })
            );
    });
}

function fixName(name) {
    const namenoextention = name.split(".")[0];
    if (namenoextention == "ls" || namenoextention == "stop") {
        return namenoextention + "_sound";
    }
    return name
        .toLowerCase()
        .replaceAll(" ", "_")
        .replaceAll("-", "_")
        .replaceAll("/", "_")
        .replaceAll("\\", "_");
}

const data = new CommandData();
data.setName("addsound");
data.setDescription("add a sound to the soundboard");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["add"]);
data.addAttachmentOption((option) =>
    option.setName("sound").setDescription("the sound to add").setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const args = new Collection();
        args.set("sound", message.attachments.first());

        return args;
    },
    async function execute(message, args) {
        if (args.get("sound")) {
            const filename = args.get("sound").name;
            if (
                filename.endsWith(".mp3") ||
                filename.endsWith(".wav") ||
                filename.endsWith(".ogg") ||
                filename.endsWith(".webm") ||
                filename.endsWith(".m4a") ||
                filename.endsWith(".mp4") ||
                filename.endsWith(".flac")
            ) {
                const files = fs.readdirSync(config.paths.soundboard);
                const fileCorrected = fixName(filename);
                if (files.includes(fileCorrected)) {
                    action.reply(message, "sound already exists");
                    return;
                }
                let msg = await action.reply(
                    message,
                    `downloading \`${fileCorrected}\`...`
                );
                await download(args.get("sound").url, fileCorrected);
                msg.edit(`downloaded \`${fileCorrected}\``);
            } else {
                action.reply(message, {
                    content:
                        "invalid format, only `mp3`, `wav`, `ogg`, `webm`, `m4a`, `mp4`, and `flac` are supported",
                    ephemeral: true,
                });
                return;
            }
        } else {
            action.reply(message, {
                content: "provide a sound to add you baffoon!",
                ephemeral: true,
            });
        }
    }
);

export default command;
