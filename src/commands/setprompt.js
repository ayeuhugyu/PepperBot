import * as gpt from "../lib/gpt.js";
import * as action from "../lib/discord_action.js";
import { Collection } from "discord.js";
import fs from "fs";
import { Command, CommandData } from "../lib/types/commands.js";
import * as stream from "stream";
import fsExtra from "fs-extra";
import * as globals from "../lib/globals.js";

const config = globals.config;

async function download(url, filename) {
    return new Promise((resolve, reject) => {
        const fixedFileName = filename
            .toLowerCase()
            .replaceAll(" ", "_")
            .replaceAll("-", "_")
            .replaceAll("/", "_")
            .replaceAll("\\", "_");
        fsExtra.ensureFileSync(`resources/gptdownloads/${fixedFileName}`);
        fetch(url).then((res) => {
            const ws = fs.createWriteStream(
                `resources/gptdownloads/${fixedFileName}`
            );
            stream.Readable.fromWeb(res.body).pipe(ws);
            ws.on("finish", () => resolve(true));
            ws.on("error", (err) => reject(err));
        });
    });
}

const allowedFileNames = [
    ".txt",
    ".md",
    ".html",
    ".css",
    ".js",
    ".ts",
    ".py",
    ".c",
    ".cpp",
    ".php",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".cfg",
    ".conf",
    ".json5",
    ".jsonc",
    ".json",
    ".xml",
    ".log",
    ".msg",
    ".rs",
];

function isTextFile(filename) {
    for (const allowedFileName of allowedFileNames) {
        if (filename.endsWith(allowedFileName)) {
            return true;
        }
    }
    return false;
}

async function fixIncomingMessage(message) {
    let attachedMessage = "\n\n";
    if (message.attachments) {
        if (message.attachments.size > 0) {
            for (let attachment of message.attachments.values()) {
                if (await isTextFile(attachment.name)) {
                    if (attachment.size <= config.gpt.max_file_size) {
                        await download(
                            attachment.url,
                            attachment.id + "_" + attachment.name
                        );
                        const file = `./resources/gptdownloads/${
                            attachment.id +
                            "_" +
                            attachment.name
                                .toLowerCase()
                                .replaceAll(" ", "_")
                                .replaceAll("-", "_")
                                .replaceAll("/", "_")
                                .replaceAll("\\", "_")
                        }`;
                        attachedMessage += await fs.readFileSync(file, "utf-8");
                    } else {
                        attachedMessage +=
                            "The user you are speaking with attached a file that exceeded the maximum file size of 25 megabytes. This message is not created by the user.";
                    }
                } else {
                    attachedMessage +=
                        "The user you are speaking with attached a file that is not considered a text file, and so cannot be read. If they ask what file formats are supported, please inform them that the following file formats are supported: .txt, .md, .html, .css, .js, .ts, .py, .c, .cpp, .php, .yaml, .yml, .toml, .ini, .cfg, .conf, .json5, .jsonc, .json, .xml, .log, .msg, .rs. This message is not created by the user.";
                }
            }
        }
    }
    return attachedMessage;
}

const data = new CommandData();
data.setName("setprompt");
data.setDescription("force the next conversation to use a specific prompt");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(false);
data.setDMPermission(true);
data.addStringOption((option) =>
    option.setName("prompt").setDescription("what to prompt").setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "prompt",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim() + (await fixIncomingMessage(message))
        );
        return args;
    },
    async function execute(message, args) {
        if (args.get("prompt")) {
            gpt.generateConversationData(message.author.id, args.get("prompt"));
            action.reply(
                message,
                `the next conversation you have with pepperbot will be influenced by your prompt: \`\`\`${args.get(
                    "prompt"
                )}\`\`\`rather than the default. however, pinging him will still use the default prompt. instead, reply to this message.`
            );
        } else {
            action.reply(message, "provide a prompt to use you baffoon!");
        }
    }
);

export default command;
