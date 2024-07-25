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
        spacedmp3: message.replaceAll(" ", "_") + ".png",
        mp3: message + ".png",
        spacedogg: message.replaceAll(" ", "_") + ".jpg",
        ogg: message + ".jpg",
        spacedwav: message.replaceAll(" ", "_") + ".jpeg",
        wav: message + ".jpeg",
        spacedwebm: message.replaceAll(" ", "_") + ".gif",
        webm: message + ".gif",
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
        action.reply(message, {
            files: [`resources/images/jaks/${randomJak}`],
        });
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
getData.addAttachmentOption((option) =>
    option.setName("jak").setDescription("the jak to get").setRequired(true)
);

const get = new SubCommand(
    getData,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "jak",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );

        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (args.get("jak")) {
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
            action.reply(message, {
                files: [`resources/images/jaks/${jak}`],
            });
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
addData.setWhitelist(["440163494529073152", "726861364848492596"]);
addData.setCanRunFromBot(true);
addData.addAttachmentOption((option) =>
    option.setName("jak").setDescription("the jak to add").setRequired(true)
);

const add = new SubCommand(
    addData,
    async function getArguments(message) {
        const args = new Collection();
        args.set("jak", message.attachments.first());

        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (args.get("jak")) {
            const filename = args.get("jak").name;
            if (
                filename.endsWith(".png") ||
                filename.endsWith(".jpg") ||
                filename.endsWith(".jpeg") ||
                filename.endsWith(".gif")
            ) {
                const alljaks = fs.readdirSync("resources/images/jaks");
                const fileCorrected = files.fixFileName(filename);
                if (alljaks.includes(fileCorrected)) {
                    action.reply(message, "jak with this name already exists");
                    return;
                }
                let msg = await action.reply(
                    message,
                    `downloading \`${fileCorrected}\`...`
                );
                await download(args.get("jak").url, fileCorrected);
                msg.edit(`downloaded \`${fileCorrected}\``);
            } else {
                action.reply(message, {
                    content:
                        "invalid format, only `png`, `jpg`, `jpeg`, and `gif` are supported",
                    ephemeral: true,
                });
                return;
            }
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
