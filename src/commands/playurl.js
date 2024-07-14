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

const config = globals.config;

function isValidYouTubeUrl(url) {
    const pattern = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/;
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

const data = new CommandData();
data.setName("playurl");
data.setDescription("plays the specified url");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["play", "pu", "purl"]);
data.addStringOption((option) =>
    option
        .setName("sound")
        .setDescription(
            "url of the sound to play\ncurrently supports: youtube. more will be added soon."
        )
        .setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 2;
        const args = new Collection();
        args.set(
            "sound",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args) {
        if (args.get("sound")) {
            let connection = await voice.getVoiceConnection(message.guild.id);
            if (!connection) {
                // join vc by default
                if (!message.member.voice.channel) {
                    action.reply(
                        message,
                        "you're not in a voice channel, and im not already in one. baffoon."
                    );
                }
                connection = await voice.joinVoiceChannel(
                    message.member.voice.channel
                );
            }
            const audioPlayer = await voice.createAudioPlayer(message.guild.id);
            connection.subscribe(audioPlayer);
            if (isValidYouTubeUrl(args.get("sound"))) {
                // youtube behavior
                try {
                    if (!(await isExistingVideo(args.get("sound")))) {
                        action.reply(message, {
                            content:
                                "that video does not appear to exist, please give me an actual video",
                            ephemeral: true,
                        });
                        return;
                    }
                    const info = await ytdl
                        .getInfo(args.get("sound"))
                        .catch((err) => {
                            if (err.statusCode === 410) {
                                action.reply(
                                    message,
                                    'attempt to download returned status code "GONE", this is usually a result of the video being age restricted. due to current library-related limitations, its not* possible to download age restricted videos.'
                                );
                                return;
                            } else {
                                action.reply(
                                    message,
                                    "error while downloading url, see logs for more info"
                                );
                                log.error(err);
                                return;
                            }
                        });
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
                            action.reply(
                                message,
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
                        action.reply(
                            "sound is too long, max length is 120 minutes. this is to prevent abuse."
                        );
                        return;
                    }
                    let msg;
                    if (redownload) {
                        msg = await action.reply(
                            message,
                            `re-downloading improperly downloaded file \`${correctedFileName}.webm\`...`
                        );
                    } else {
                        msg = await action.reply(
                            message,
                            `downloading \`${correctedFileName}.webm\`...`
                        );
                    }
                    fsextra.ensureFileSync(
                        `resources/ytdl_cache/${correctedFileName}.webm`
                    );
                    await ytdl(args.get("sound"), { filter: "audioonly" })
                        .pipe(
                            fs.createWriteStream(
                                `resources/ytdl_cache/${correctedFileName}.webm`
                            )
                        )
                        .on("finish", async () => {
                            action.editMessage(
                                msg,
                                `playing \`${correctedFileName}.webm\``
                            );
                            const resource = await voice.createAudioResource(
                                `resources/ytdl_cache/${correctedFileName}.webm`
                            );
                            audioPlayer.play(resource);
                        });
                } catch (err) {
                    action.reply(
                        message,
                        "error while downloading url, see logs for more info"
                    );
                    log.error(err);
                }
            } else {
                action.reply(
                    message,
                    "url not supported, currently only youtube is supported. others are more complicated to implement, and will be added soon."
                );
            }
        } else {
            action.reply(message, "provide a sound to play you baffoon!");
        }
    }
);

export default command;
