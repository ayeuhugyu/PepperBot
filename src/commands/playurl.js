import * as action from "../lib/discord_action.js";
import fs from "fs";
import fsextra from "fs-extra";
import * as voice from "../lib/voice.js";
import ytdl from "@distube/ytdl-core";
import * as log from "../lib/log.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import { google } from "googleapis";
const youtube = google.youtube("v3");
import * as globals from "../lib/globals.js";
import process from "node:process";
import * as files from "../lib/files.js";
import commonRegex from "../lib/commonRegex.js";

const config = globals.config;

function isValidYouTubeUrl(url) {
    const pattern = commonRegex.youtubeURL;
    return pattern.test(url);
}

async function isExistingVideo(url) {
    try {
        const videoId = await ytdl.getURLVideoID(url);
        const response = await youtube.videos.list({
            auth: process.env.YOUTUBE_API_KEY,
            part: "snippet",
            id: videoId,
        });

        let isExistingVideo;
        if (response) {
            isExistingVideo = true;
        }
        return isExistingVideo;
    } catch (error) {
        return false;
    }
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

const data = new CommandData();
data.setName("playurl");
data.setDescription("plays the specified url");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
;
data.setAliases(["play", "pu", "purl"]);
data.addStringOption((option) =>
    option
        .setName("sound")
        .setDescription(
            "url of the sound to play\ncurrently supports: youtube. more will be added soon."
        )
        .setRequired(true)
);
data.setDisabledContexts(["dm"])
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 2;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "sound",
            message.content
                .slice(prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, isInteraction, gconfig) {
        if (args.get("sound")) {
            let connection = await voice.getVoiceConnection(message.guild.id);
            if (!connection) {
                // join vc by default
                if (!message.member.voice.channel) {
                    action.reply(message, {
                        ephemeral: gconfig.useEphemeralReplies,
                        content:
                            "you're not in a voice channel, and im not already in one. baffoon.",
                    });
                    return;
                }
                connection = await voice.joinVoiceChannel(
                    message.member.voice.channel
                );
            }
            const audioPlayer = await voice.createAudioPlayer(message.guild.id);
            connection.subscribe(audioPlayer);
            if (args.get("sound").startsWith("file://")) {
                const filePath = args.get("sound").slice(7);
                const sounds = fs.readdirSync("resources/sounds")
                const sound = await autocorrect(filePath);
                let soundPath
                let soundName
                for (const value of Object.values(sound)) {
                    if (sounds.includes(value)) {
                        soundPath = `resources/sounds/${value}`
                        soundName = value
                        break;
                    }
                }
                if (fs.existsSync(soundPath)) {
                    action.reply(message, {
                        ephemeral: gconfig.useEphemeralReplies,
                        content: `playing \`${soundName}\``,
                    });
                } else {
                    return;
                }
                const resource = await voice.createAudioResource(
                    `resources/sounds/${soundName}`
                );
                audioPlayer.play(resource);
                return;
            }
            if (isValidYouTubeUrl(args.get("sound"))) {
                // youtube behavior
                try {
                    let sentMSG = await action.reply(message, {
                        content: "retrieving video data...",
                        ephemeral: gconfig.useEphemeralReplies,
                    });
                    if (!(await isExistingVideo(args.get("sound")))) {
                        action.editMessage(sentMSG, {
                            content:
                                "that video does not appear to exist, please give me an actual video",
                            ephemeral: gconfig.useEphemeralReplies,
                        });
                        return;
                    }
                    let info
                    try {
                        info = await ytdl
                        .getInfo(args.get("sound"))
                        .catch((err) => {
                            if (err.statusCode === 410) {
                                action.editMessage(sentMSG, {
                                    ephemeral: gconfig.useEphemeralReplies,
                                    content:
                                        'attempt to download returned status code "GONE", this is usually a result of the video being age restricted. due to current library-related limitations, its not* possible to download age restricted videos.',
                                });
                                return;
                            } else {
                                action.editMessage(sentMSG, {
                                    ephemeral: gconfig.useEphemeralReplies,
                                    content: {
                                        ephemeral: gconfig.useEphemeralReplies,
                                        content:
                                            "error while downloading url, see logs for more info",
                                    },
                                });
                                log.error(err);
                                return;
                            }
                        });
                    } catch (e) {
                        log.error(e);
                        action.editMessage(sentMSG, {
                            ephemeral: gconfig.useEphemeralReplies,
                            content:
                                "error while downloading url, see logs for more info",
                        });
                    }
                    if (!info) return;
                    const sounds = await fs.readdirSync("resources/ytdl_cache");
                    const correctedFileName = files.fixFileName(
                        info.videoDetails.title
                    );
                    let redownload = false;
                    if (sounds.includes(`${correctedFileName}.webm`)) {
                        const filePath = `resources/ytdl_cache/${correctedFileName}.webm`;
                        const stats = fs.statSync(filePath);
                        const fileSizeInBytes = stats.size;

                        if (fileSizeInBytes < 1) {
                            fs.unlinkSync(filePath);
                            redownload = true;
                        }
                        if (!redownload) {
                            action.editMessage(
                                sentMSG,
                                `playing \`${correctedFileName}.webm\``
                            );
                            const resource = await voice.createAudioResource(
                                `resources/ytdl_cache/${correctedFileName}.webm`
                            );
                            audioPlayer.play(resource);
                            return;
                        }
                    }
                    if (info.lengthSeconds > 60 * 120) {
                        action.editMessage(sentMSG, {
                            ephemeral: gconfig.useEphemeralReplies,
                            content:
                                "sound is too long, max length is 120 minutes. this is to prevent abuse.",
                        });
                        return;
                    }
                    if (redownload) {
                        await action.editMessage(sentMSG, {
                            ephemeral: gconfig.useEphemeralReplies,
                            content: `re-downloading improperly downloaded file \`${correctedFileName}.webm\`...`,
                        });
                    } else {
                        await action.editMessage(sentMSG, {
                            ephemeral: gconfig.useEphemeralReplies,
                            content: `downloading \`${correctedFileName}.webm\`...`,
                        });
                    }
                    fsextra.ensureFileSync(
                        `resources/ytdl_cache/${correctedFileName}.webm`
                    );
                    try {
                        await ytdl(args.get("sound"), { filter: "audioonly" })
                            .pipe(
                                fs.createWriteStream(
                                    `resources/ytdl_cache/${correctedFileName}.webm`
                                )
                            )
                            .on("finish", async () => {
                                action.editMessage(sentMSG, {
                                    ephemeral: gconfig.useEphemeralReplies,
                                    content: `playing \`${correctedFileName}.webm\``,
                                });
                                const resource = await voice.createAudioResource(
                                    `resources/ytdl_cache/${correctedFileName}.webm`
                                );
                                audioPlayer.play(resource);
                            });
                    } catch (err) {
                        action.editMessage(sentMSG, {
                            ephemeral: gconfig.useEphemeralReplies,
                            content: "error while downloading url, see logs for more info",
                        });
                        log.error(err);
                    }
                } catch (err) {
                    action.reply(message, {
                        ephemeral: gconfig.useEphemeralReplies,
                        content:
                            "error while downloading url, see logs for more info",
                    });
                    log.error(err);
                }
            } else {
                action.reply(message, {
                    ephemeral: gconfig.useEphemeralReplies,
                    content:
                        "url not supported, currently only youtube is supported. others are more complicated to implement, and will be added soon.",
                });
            }
        } else {
            action.reply(message, "provide a url to play you baffoon!");
        }
    }
);

export default command;
