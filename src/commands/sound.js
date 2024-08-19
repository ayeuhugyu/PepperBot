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
import * as voice from "../lib/voice.js";
import * as textfiles from "../lib/files.js";
import fsExtra from "fs-extra";
import stream from "stream";

const config = globals.config;

async function download(url, filename) {
    return new Promise((resolve, reject) => {
        const fixedFileName = textfiles.fixFileName(filename);
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
function autocorrect(message) {
    message.toLowerCase();
    let corrections = {
        regular: message,
        spaced: message.replaceAll(" ", "_"),
        spacedmp3: message.replaceAll(" ", "_") + ".mp3",
        mp3: message + ".mp3",
        spacedogg: message.replaceAll(" ", "_") + ".ogg",
        ogg: message + ".ogg",
        spacedwav: message.replaceAll(" ", "_") + ".wav",
        wav: message + ".wav",
        spacedwebm: message.replaceAll(" ", "_") + ".webm",
        webm: message + ".webm",
        spacedm4a: message.replaceAll(" ", "_") + ".m4a",
        m4a: message + ".m4a",
        spacedmp4: message.replaceAll(" ", "_") + ".mp4",
        mp4: message + ".mp4",
        spacedflac: message.replaceAll(" ", "_") + ".flac",
        flac: message + ".flac",
    };
    return corrections;
}

const retrievedata = new SubCommandData();
retrievedata.setName("get");
retrievedata.setDescription("returns a sound");
retrievedata.setPermissions([]);
retrievedata.setPermissionsReadable("");
retrievedata.setWhitelist([]);
retrievedata.setCanRunFromBot(true);
retrievedata.setNormalAliases(["retrievesound"]);
retrievedata.setAliases(["getsound", "retrieve", "rs", "gs"]);
retrievedata.addStringOption((option) =>
    option
        .setName("sound")
        .setDescription("what sound to return")
        .setRequired(true)
);
const retrieve = new SubCommand(
    retrievedata,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix;
        args.set(
            "sound",
            message.content.slice(prefix.length + commandLength).trim()
        );
        return args;
    },
    async function execute(message, args) {
        if (args.get("sound")) {
            const sounds = await fs.readdirSync("resources/sounds");
            const sound = await autocorrect(args.get("sound"));
            let file;
            for (const value of Object.values(sound)) {
                if (sounds.includes(value)) {
                    file = value;
                }
            }
            if (file) {
                let msg = await action.reply(
                    message,
                    "uploading your sound, please wait"
                );
                action.editMessage(msg, {
                    content: "here ya go",
                    files: [`resources/sounds/${file}`],
                    ephemeral: true,
                });
            } else {
                action.reply(message, {
                    content: `there's no such thing as \`${args.get(
                        "sound"
                    )}\``,
                });
            }
        } else {
            action.reply(message, {
                content: "provide a sound to return you baffoon!",
                ephemeral: true,
            });
        }
    }
);

const adddata = new SubCommandData();
adddata.setName("add");
adddata.setDescription("add a sound to the soundboard");
adddata.setPermissions([]);
adddata.setPermissionsReadable("");
adddata.setWhitelist([]);
adddata.setCanRunFromBot(true);
adddata.setAliases(["addsounds"]);
adddata.setNormalAliases(["addsound"]);
adddata.addAttachmentOption((option) =>
    option.setName("sound").setDescription("the sound to add").setRequired(true)
);
const add = new SubCommand(
    adddata,
    async function getArguments(message, gconfig) {
        const args = new Collection();
        args.set("sound", message.attachments.first());

        return args;
    },
    async function execute(message, args) {
        if (args.get("sound")) {
            const attachments = message.attachments || [args.get("sound")];
            attachments.forEach(async (attachment) => {
                const filename = attachment.name;
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
                    const fileCorrected = textfiles.fixFileName(filename);
                    if (allsounds.includes(fileCorrected)) {
                        action.reply(message, "sound already exists");
                        return;
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
                            "invalid format, only `mp3`, `wav`, `ogg`, `webm`, `m4a`, `mp4`, and `flac` are supported",
                        ephemeral: true,
                    });
                    return;
                }
            });
        } else {
            action.reply(message, {
                content: "provide a sound to add you baffoon!",
                ephemeral: true,
            });
        }
    }
);

async function listSounds(message) {
    let sounds = await textfiles.generateLSText("resources/sounds");
    let soundLsFile = await textfiles.textToFile(sounds, "sounds");
    action.reply(message, { files: [soundLsFile] });
}

const playdata = new SubCommandData();
playdata.setName("play");
playdata.setDescription("plays the specified sound");
playdata.setPermissions([]);
playdata.setPermissionsReadable("");
playdata.setWhitelist([]);
playdata.setCanRunFromBot(true);
playdata.setAliases([]);
playdata.setDisabledContexts(["dm"]);
playdata.setNormalAliases(["soundboard"]);
playdata.addStringOption((option) =>
    option
        .setName("sound")
        .setDescription(
            "what to play\nput `ls` to list sounds or `stop` to stop playing"
        )
        .setRequired(true)
);
const play = new SubCommand(
    playdata,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix;
        args.set(
            "sound",
            message.content.slice(prefix.length + commandLength).trim()
        );
        return args;
    },
    async function execute(message, args) {
        if (args.get("sound")) {
            // special cases
            if (args.get("sound") == "ls") {
                listSounds(message);
                return;
            }
            let connection = await voice.getVoiceConnection(message.guild.id);
            if (!connection) {
                // join vc by default
                connection = await voice.joinVoiceChannel(
                    message.member.voice.channel
                );
                if (!connection) {
                    // if they aren't in a vc
                    action.reply(message, {
                        content:
                            "you're not in a voice channel, and im not already in one. baffoon.",
                        ephemeral: true,
                    });
                    return;
                }
                action.reply(message, {
                    content: `joined <#${message.member.voice.channel.id}>`,
                    ephemeral: true,
                });
            }
            if (!connection) {
                // if they aren't in a vc
                action.reply(message, {
                    content:
                        "you're not in a voice channel, and im not already in one. baffoon.",
                    ephemeral: true,
                });
                return;
            }
            const audioPlayer = await voice.createAudioPlayer(message.guild.id);
            connection.subscribe(audioPlayer);
            if (args.get("sound") == "stop") {
                // do all of the special cases after checking that there even can be an audio player
                voice.stopAudioPlayer(audioPlayer);
                action.reply(message, "stopped");
                return;
            }
            const sounds = await fs.readdirSync("resources/sounds");
            const sound = await autocorrect(args.get("sound"));
            let hasPlayed = false;
            for (const value of Object.values(sound)) {
                if (sounds.includes(value) && !hasPlayed) {
                    hasPlayed = true;
                    const resource = await voice.createAudioResource(
                        `resources/sounds/${value}`
                    );
                    voice.playResource(resource, audioPlayer);
                    action.reply(message, {
                        content: `playing \`${value}\``,
                        ephemeral: true,
                    });
                    break;
                }
            }
            if (!hasPlayed) {
                action.reply(message, {
                    content: "sound not found",
                    ephemeral: true,
                });
            }
        } else {
            action.reply(message, {
                content: "provide a sound to play you baffoon!",
                ephemeral: true,
            });
        }
    }
);

const listdata = new SubCommandData();
listdata.setName("list");
listdata.setDescription("plays the specified sound");
listdata.setPermissions([]);
listdata.setPermissionsReadable("");
listdata.setWhitelist([]);
listdata.setCanRunFromBot(true);
listdata.setAliases(["ls"]);
const list = new SubCommand(
    listdata,
    async function getArguments(message, gconfig) {
        const args = new Collection();
        return args;
    },
    async function execute(message, args) {
        listSounds(message);
    }
);

const data = new CommandData();
data.setName("sound");
data.setDescription("various sound related commands");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["sounds"]);
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("subcommand to run")
        .setRequired(true)
        .addChoices(
            { name: "list", value: "list" },
            { name: "play", value: "play" },
            { name: "get", value: "get" },
            { name: "add", value: "add" }
        )
);
data.addStringOption((option) =>
    option
        .setName("sound")
        .setDescription(
            "what to play/get. put `ls` to list sounds or `stop` to stop playing"
        )
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const args = new Collection();
        args.set("_SUBCOMMAND", message.content.split(" ")[1]);
        return args;
    },
    async function execute(message, args, fromInteraction, guildConfig) {
        if (args.get("_SUBCOMMAND")) {
            action.reply(message, {
                content: "invalid subcommand: " + args.get("_SUBCOMMAND"),
                ephemeral: true,
            });
            return;
        }
        action.reply(message, {
            content:
                "this command does nothing if you don't supply a subcommand",
            ephemeral: true,
        });
    },
    [list, play, add, retrieve] // subcommands
);

export default command;
