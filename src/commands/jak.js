import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { AdvancedPagedMenuBuilder } from "../lib/types/menuBuilders.js";
import default_embed from "../lib/default_embed.js";
import { Collection } from "discord.js";
import fs from "fs";
import fsExtra from "fs-extra";
import stream from "stream";
import * as globals from "../lib/globals.js";
import * as files from "../lib/files.js";

const config = globals.config;

async function download(url, filename) {
    return new Promise((resolve, reject) => {
        const fixedFileName = files.fixFileName(filename);
        fsExtra.ensureFileSync(`resources/images/jaks/${fixedFileName}`);
        fetch(url).then((res) => {
            const ws = fs.createWriteStream(
                `resources/images/jaks/${fixedFileName}`
            );
            stream.Readable.fromWeb(res.body).pipe(ws);
            ws.on("finish", () => resolve(true));
            ws.on("error", (err) => reject(err));
        });
    });
}

function autocorrect(message) {
    message.toLowerCase();
    let corrections = {
        regular: message,
        spaced: message.replaceAll(" ", "_"),
        spacedpng: message.replaceAll(" ", "_") + ".png",
        png: message + ".png",
        spacedjpg: message.replaceAll(" ", "_") + ".jpg",
        jpg: message + ".jpg",
        spacedjpeg: message.replaceAll(" ", "_") + ".jpeg",
        jpeg: message + ".jpeg",
        spacedgif: message.replaceAll(" ", "_") + ".gif",
        gif: message + ".gif",
        spacedmp4: message.replaceAll(" ", "_") + ".mp4",
        mp4: message + ".mp4",
        spacedwebm: message.replaceAll(" ", "_") + ".webm",
        webm: message + ".webm",
        spacedmov: message.replaceAll(" ", "_") + ".mov",
        mov: message + ".mov",
    };
    return corrections;
}

const randomData = new SubCommandData();
randomData.setName("random");
randomData.setDescription("get a random jak");
randomData.setPermissions([]);
randomData.setPermissionsReadable("");
randomData.setWhitelist([]);
randomData.setCanRunFromBot(true);
randomData.setAliases(["rand"]);

const random = new SubCommand(
    randomData,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction) {
        const alljaks = fs.readdirSync("resources/images/jaks");
        if (alljaks.length === 0) {
            action.reply(
                message,
                "there are currently no jaks, please wait for there to be some"
            );
            return;
        }
        const randomJak = alljaks[Math.floor(Math.random() * alljaks.length)];
        const processing = await action.reply(message, { content: "processing..." });
        action.editMessage(processing, { content: "here's your jak!", files: [`resources/images/jaks/${randomJak}`] });
    }
);

const listData = new SubCommandData();
listData.setName("list");
listData.setDescription("list available jaks");
listData.setPermissions([]);
listData.setPermissionsReadable("");
listData.setWhitelist([]);
listData.setCanRunFromBot(true);
listData.setAliases(["ls"]);

const list = new SubCommand(
    listData,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction) {
        const alljaks = fs.readdirSync("resources/images/jaks");
        if (alljaks.length === 0) {
            action.reply(
                message,
                "there are currently no jaks, please wait for there to be some"
            );
            return;
        }
        const text = await files.generateLSText("resources/images/jaks", true);
        const file = await files.textToFile(text, "jaks");
        action.reply(message, {
            files: [file],
        });
    }
);

const getData = new SubCommandData();
getData.setName("get");
getData.setDescription("get a jak");
getData.setPermissions([]);
getData.setPermissionsReadable("");
getData.setWhitelist([]);
getData.setCanRunFromBot(true);
getData.addStringOption((option) =>
    option.setName("jak").setDescription("the jak to get").setRequired(true)
);

const get = new SubCommand(
    getData,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;0
        const prefix = gconfig.prefix || config.generic.prefix
        const args = new Collection();
        args.set(
            "jak",
            message.content
                .slice(prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (args.get("jak")) {
            if (args.get("jak") === "ls") {
                list.execute(message, null, fromInteraction);
                return;
            }
            const filename = files.fixFileName(args.get("jak"));
            const alljaks = fs.readdirSync("resources/images/jaks");
            if (alljaks.length === 0) {
                action.reply(
                    message,
                    "there are currently no jaks, please wait for there to be some"
                );
                return;
            }
            const corrections = await autocorrect(filename);
            let jak;
            for (const value of Object.values(corrections)) {
                if (alljaks.includes(value)) {
                    jak = value;
                }
            }
            if (!jak) {
                action.reply(message, "jak not found");
                return;
            }
            const processing = await action.reply(message, { content: "processing..." });
            action.editMessage(processing, { content: "here's your jak!", files: [`resources/images/jaks/${jak}`] });
        } else {
            action.reply(message, {
                content: "provide a jak to get you baffoon!",
                ephemeral: true,
            });
        }
    }
);

const addData = new SubCommandData();
addData.setName("add");
addData.setDescription("add a jak");
addData.setPermissions([]);
addData.setPermissionsReadable("");
addData.setWhitelist([
    "440163494529073152",
    "726861364848492596",
    "436321340304392222",
]);
addData.setNormalAliases(["jakadd", "addjak"])
addData.setCanRunFromBot(true);
addData.addAttachmentOption((option) =>
    option.setName("jakfile").setDescription("the jak to add").setRequired(true)
);

const add = new SubCommand(
    addData,
    async function getArguments(message) {
        const args = new Collection();
        args.set("jakfile", message.attachments.first());

        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (args.get("jakfile")) {
            const attachments = message.attachments || [args.get("jakfile")];
            attachments.forEach(async (attachment) => {
                const filename = attachment.name;
                if (
                    filename.endsWith(".png") ||
                    filename.endsWith(".jpg") ||
                    filename.endsWith(".jpeg") ||
                    filename.endsWith(".gif") ||
                    filename.endsWith(".mp4") ||
                    filename.endsWith(".webm") ||
                    filename.endsWith(".mov")
                ) {
                    const alljaks = fs.readdirSync("resources/images/jaks");
                    const fileCorrected = files.fixFileName(filename);
                    if (alljaks.includes(fileCorrected)) {
                        action.reply(
                            message,
                            "jak with this name already exists"
                        );
                        return;
                    }

                    const extensionIndex = fileCorrected.lastIndexOf(".");
                    if (extensionIndex !== -1) {
                        let fileNameNoExtension = fileCorrected.substring(
                            0,
                            extensionIndex
                        );
                        if (fileNameNoExtension === "ls") {
                            action.reply(message, "`ls` is a reserved name.");
                            return;
                        }
                    }
                    let msg = await action.reply(
                        message,
                        `downloading \`${fileCorrected}\`...`
                    );
                    await download(attachment.url, fileCorrected);
                    msg.edit(`downloaded \`${fileCorrected}\``);
                } else {
                    action.reply(message, {
                        content:
                            "invalid format, only `png`, `jpg`, `jpeg`, `gif`, `mp4`, `webm`, and `mov` are supported",
                        ephemeral: true,
                    });
                    return;
                }
            });
        } else {
            action.reply(message, {
                content: "provide a jak to add you baffoon!",
                ephemeral: true,
            });
        }
    }
);
const data = new CommandData();
data.setName("jak");
data.setDescription("various jak related commands");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["jaks"]);
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("the subcommand to run")
        .setRequired(false)
        .addChoices(
            { name: "add", value: "add" },
            { name: "get", value: "get" },
            { name: "list", value: "list" },
            { name: "random", value: "random" }
        )
);
data.addStringOption((option) =>
    option
        .setName("jak")
        .setDescription("the jak to get (exclusive to get subcommand)")
        .setRequired(false)
);
data.addAttachmentOption((option) =>
    option
        .setName("jakfile")
        .setDescription("the jak to add (exclusive to add subcommand)")
        .setRequired(false)
);

const command = new Command(
    data,
    async function getArguments(message) {
        const args = new Collection();
        args.set("_SUBCOMMAND", message.content.split(" ")[1]);
        return args;
    },
    async function execute(message, args) {
        if (!args.get("_SUBCOMMAND")) {
            action.reply(message, "provide a subcommand you baffoon!");
            return;
        }
        if (args.get("_SUBCOMMAND")) {
            action.reply(message, "invalid subcommand you baffoon!");
            return;
        }
    },
    [add, get, list, random]
);

export default command;
