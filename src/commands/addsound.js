import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";
import fsExtra from "fs-extra";
import stream from "stream";
import * as globals from "../lib/globals.js";
import * as files from "../lib/files.js";

async function download(url, filename) {
    return new Promise((resolve, reject) => {
        const fixedFileName = files.fixFileName(filename);
        fsExtra.ensureFileSync(`resources/sounds/${fixedFileName}`);
        fetch(url).then((res) => {
            const ws = fs.createWriteStream(
                `resources/sounds/${fixedFileName}`
            );
            stream.Readable.fromWeb(res.body).pipe(ws);
            ws.on("finish", () => resolve(true));
            ws.on("error", (err) => reject(err));
        });
    });
}

const data = new CommandData();
data.setName("addsound");
data.setDescription("add a sound to the soundboard");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["add", "as"]);
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
                const allsounds = fs.readdirSync("resources/sounds");
                const fileCorrected = files.fixFileName(filename);
                if (allsounds.includes(fileCorrected)) {
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
