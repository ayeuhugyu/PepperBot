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
import * as gpt from "../lib/gpt.js";
import * as stream from "stream";
import fsExtra from "fs-extra";
import * as files from "../lib/files.js";
import * as util from "util"

const config = globals.config;

async function download(url, filename) {
    return new Promise((resolve, reject) => {
        const fixedFileName = files.fixFileName(filename);
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
    let attachedMessage = "";
    if (message.attachments) {
        if (message.attachments.size > 0) {
            for (let attachment of message.attachments.values()) {
                if (await isTextFile(attachment.name)) {
                    if (attachment.size <= 25000000) {
                        // 25 megabytes
                        await download(
                            attachment.url,
                            attachment.id +
                                "_" +
                                files.fixFileName(attachment.name)
                        );
                        const file = `./resources/gptdownloads/${
                            attachment.id +
                            "_" +
                            files.fixFileName(attachment.name)
                        }`;
                        attachedMessage += `\n\n${await fs.readFileSync(
                            file,
                            "utf-8"
                        )}`;
                    } else {
                        attachedMessage +=
                            "\n\nThe user you are speaking with attached a file that exceeded the maximum file size of 25 megabytes. This message is not created by the user.";
                    }
                } else {
                    attachedMessage +=
                        "\n\nThe user you are speaking with attached a file that is not considered a text file, and so cannot be read. If they ask what file formats are supported, please inform them that the following file formats are supported: .txt, .md, .html, .css, .js, .ts, .py, .c, .cpp, .php, .yaml, .yml, .toml, .ini, .cfg, .conf, .json5, .jsonc, .json, .xml, .log, .msg, .rs. This message is not created by the user.";
                }
            }
        }
    }
    return attachedMessage;
}

const getconversationdata = new SubCommandData();
getconversationdata.setName("getconversation");
getconversationdata.setDescription("returns the JSON for your current conversation; mostly used for debugging");
getconversationdata.setPermissions([]);
getconversationdata.setPermissionsReadable("");
getconversationdata.setWhitelist([]);
getconversationdata.setCanRunFromBot(true);
getconversationdata.setAliases(["get", "conversation"]);
getconversationdata.setDisabledContexts()
const getconversation = new SubCommand(
    getconversationdata,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        const conversation = await gpt.getConversation(message);
        action.reply(message, {
            content: "```json\n" + await util.inspect(conversation, { depth: Infinity }) + "\n```",
            ephemeral: gconfig.useEphemeralReplies
        });
    }
);

const setpromptdata = new SubCommandData();
setpromptdata.setName("setprompt");
setpromptdata.setDescription("adjusts the prompt for the next conversation");
setpromptdata.setPermissions([]);
setpromptdata.setPermissionsReadable("");
setpromptdata.setWhitelist([]);
setpromptdata.setCanRunFromBot(true);
setpromptdata.setAliases(["prompt", "gptprompt", "sp"]);
setpromptdata.setNormalAliases(["setprompt", "prompt", "gptprompt", "sp"]);
setpromptdata.setDisabledContexts()
setpromptdata.addStringOption((option) =>
    option
        .setName("prompt")
        .setDescription("the prompt to use")
        .setRequired(false)
);
const setprompt = new SubCommand(
    setpromptdata,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "prompt",
            message.content
                .slice(prefix.length + commandLength)
                .trim() + (await fixIncomingMessage(message))
        );
        return args;
    },
    async function execute(message, args) {
        if (args.get("prompt")) {
            gpt.generateConversationData(message.author.id, args.get("prompt"), true);
            action.reply(
                message,
                `the next conversation you have with pepperbot will be influenced by your prompt: \`\`\`${args.get(
                    "prompt"
                )}\`\`\`rather than the default. pinging him twice will reset the prompt.`
            );
        } else {
            action.reply(message, "provide a prompt to use you baffoon!");
        }
    }
);

const olddata = new SubCommandData();
olddata.setName("old");
olddata.setDescription("forces your next conversation to use 3.5-turbo instead of 4o-mini");
olddata.setPermissions([]);
olddata.setPermissionsReadable("");
olddata.setWhitelist([]);
olddata.setCanRunFromBot(true);
olddata.setAliases(["useold", "oldprompt", "oldgpt"]);
olddata.setDisabledContexts()
const old = new SubCommand(
    olddata,
    async function getArguments(message, gconfig) {
        return new Collection();
    },
    async function execute(message, args, fromInteraction, gconfig) {
        gpt.generateConversationData(message.author.id, undefined, false, true);
        action.reply(
            message,
            { content: "your next conversation with pepperbot will use the old 3.5-turbo model rather than the new 4o-mini model. pinging him twice will reset this.", ephemeral: gconfig.useEphemeralReplies }
        );
    }
);

const data = new CommandData();
data.setName("gpt");
data.setDescription("gpt related commands");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setAliases(["ai"]);
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("subcommand to run")
        .setRequired(true)
        .addChoices(
            { name: "old", value: "old" },
            { name: "setprompt", value: "setprompt" },
            { name: "getconversation", value: "getconversation" }
        )
);
data.addStringOption((option) =>
    option
        .setName("prompt")
        .setDescription("the prompt to use")
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const args = new Collection();
        args.set("_SUBCOMMAND", message.content.split(" ")[1]);
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (args.get("_SUBCOMMAND")) {
            action.reply(message, {
                content: "invalid subcommand: " + args.get("_SUBCOMMAND"),
                ephemeral: gconfig.useEphemeralReplies
            })
            return;
        }
        action.reply(message, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: gconfig.useEphemeralReplies
        })
    },
    [old, setprompt, getconversation] // subcommands
);

export default command;
