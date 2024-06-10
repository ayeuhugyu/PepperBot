import * as log from "../log.js";
import * as voice from "../voice.js";
import ytdl from "ytdl-core";
import fs from "node:fs";
import Events from "node:events";
import * as action from "../discord_action.js";
import { google } from "googleapis";
import fsextra from "fs-extra";
const youtube = google.youtube("v3");
import * as globals from "../globals.js";
import process from "node:process";
import * as files from "../files.js";

const config = globals.config;

export const queueStates = {
    idle: "idle",
    paused: "paused",
    playing: "playing",
    downloading: "downloading",
};

function fetchTitleFromURL(url) {
    return new Promise(async (resolve, reject) => {
        let videoId;
        try {
            videoId = await ytdl.getURLVideoID(url);
        } catch (err) {
            log.error(err);
            reject("error while fetching video title");
            return;
        }
        const info = await youtube.videos.list({
            auth: process.env.YOUTUBE_API_KEY,
            part: "snippet",
            id: videoId,
        });
        try {
            resolve(info.data.items[0].snippet.title);
        } catch (err) {
            log.error(err);
            reject("error while fetching video title");
        }
    });
}

async function download(url, queueManager) {
    try {
        return new Promise(async (resolve, reject) => {
            const title = await fetchTitleFromURL(url).catch((err) => {
                if (err.statusCode === 410) {
                    action.sendMessage(
                        queueManager.messageChannel,
                        'attempt to download returned status code "GONE", this is usually a result of the video being age restricted. due to current library-related limitations, its not* possible to download age restricted videos.'
                    );
                    return;
                } else {
                    action.sendMessage(
                        queueManager.messageChannel,
                        "error while downloading url, see logs for more info"
                    );
                    log.error(err);
                    return;
                }
            });
            if (!title) {
                log.error("error while fetching video title");
                reject();
                return;
            }
            const sounds = fs.readdirSync("resources/ytdl_cache");
            const correctedFileName = files.fixFileName(title);

            let msg = await action.sendMessage(
                queueManager.messageChannel,
                `checking for existence of \`${correctedFileName}.webm\`...`
            );
            if (sounds.includes(`${correctedFileName}.webm`)) {
                await action.editMessage(
                    msg,
                    `playing \`${correctedFileName}.webm\``
                );
                resolve(`resources/ytdl_cache/${correctedFileName}.webm`);
            } else {
                await action.editMessage(
                    msg,
                    `downloading \`${correctedFileName}.webm\`...`
                );
                fsextra.ensureFileSync(
                    `${config.paths.ytdl_cache}/${correctedFileName}.webm`
                );
                await ytdl(url, { filter: "audioonly" })
                    .pipe(
                        fs.createWriteStream(
                            `${config.paths.ytdl_cache}/${correctedFileName}.webm`
                        )
                    )
                    .on("finish", async () => {
                        action.editMessage(
                            msg,
                            `playing \`${correctedFileName}.webm\``
                        );
                        resolve(
                            `${config.paths.ytdl_cache}/${correctedFileName}.webm`
                        );
                    })
                    .on("error", (err) => {
                        log.error(err);
                        if (err.statusCode === 410) {
                            action.sendMessage(
                                queueManager.messageChannel,
                                'attempt to download returned status code "GONE", this is usually a result of the video being age restricted. due to current library-related limitations, its not* possible to download age restricted videos.'
                            );
                        }
                        fs.unlinkSync(
                            `${config.paths.ytdl_cache}/${correctedFileName}.webm`
                        );
                        reject();
                    });
            }
        });
    } catch (err) {
        log.error(err);
    }
}

async function playlist(url, queue) {
    let playlistID = url.split("&list=")[1];
    if (playlistID.includes("&index=")) {
        playlistID = playlistID.split("&index=")[0];
    }
    const results = await youtube.playlistItems.list({
        auth: process.env.YOUTUBE_API_KEY,
        part: "id,snippet",
        maxResults: 150,
        playlistId: playlistID,
    });
    if (results.data.error) {
        log.error(results.data.error.message);
        return results.data.error.message;
    }
    const playlist = results.data.items;
    return playlist;
}

export class AudioPlayerQueueManager {
    state = queueStates.idle;
    queues = [];
    readableQueue = [];
    currentIndex = 0;
    player = null;
    voiceConnection = null;
    messageChannel = null;
    emitter = new Events.EventEmitter();
    on = this.emitter.on;
    emit = this.emitter.emit;

    async play(index) {
        if (!index) index = this.currentIndex;
        if (this.queues[index]) {
            this.currentIndex = index;
            this.state = queueStates.downloading;
            const resourceLocation = await download(this.queues[index], this);
            if (!resourceLocation) {
                log.error("error while downloading resource, skipping");
                action.sendMessage(
                    this.messageChannel,
                    "error while downloading resource, skipping"
                );
                this.next();
            }
            const resource = await voice.createAudioResource(resourceLocation);
            this.player.play(resource);
            this.state = queueStates.playing;
            this.emitter.emit("update", this.readableQueue);
        } else {
            log.warn("invalid index in queue");
        }
    }
    next() {
        this.currentIndex++;
        if (this.currentIndex >= this.queues.length) {
            this.currentIndex = 0;
            this.play(this.currentIndex);
            return;
        }
        this.play(this.currentIndex);
        this.emitter.emit("update", this.readableQueue);
    }
    previous() {
        this.currentIndex--;
        this.play(this.currentIndex);
        if (this.currentIndex < 0) {
            this.currentIndex = this.queues.length - 1;
        }
        this.emitter.emit("update", this.readableQueue);
    }
    async add(queue) {
        if (queue.includes("&list=")) {
            const queues = await playlist(queue, this);
            if (typeof queues == "string") {
                log.error(queues);
                return;
            }
            queues.forEach((queue) => {
                try {
                    this.readableQueue.push(
                        `[${queue.snippet.title}](https://www.youtube.com/watch?v=${queue.snippet.resourceId.videoId})`
                    );
                    this.queues.push(
                        `https://www.youtube.com/watch?v=${queue.snippet.resourceId.videoId}`
                    );
                } catch (e) {
                    log.error(e);
                    return;
                }
            });
        } else {
            try {
                this.readableQueue.push(
                    `[${await fetchTitleFromURL(queue)}](${queue})`
                );
                this.queues.push(queue);
            } catch (e) {
                log.error(e);
                return;
            }
        }
        this.emitter.emit("update", this.readableQueue);
    }
    remove(index) {
        if (!index && index !== 0) {
            log.warn("attempt to remove null from queue");
            return false;
        }
        if (this.queues[index]) {
            this.queues.splice(index, 1);
            this.readableQueue.splice(index, 1);
            if (index > this.currentIndex) {
                this.currentIndex++;
            }
            this.emitter.emit("update", this.readableQueue);
            return true;
        } else {
            log.warn("attempt to remove invalid index");
            return false;
        }
    }
    clear() {
        this.queues = [];
        this.readableQueue = [];
        this.currentIndex = 0;
        this.emitter.emit("update", this.readableQueue);
    }
    stop() {
        this.state = queueStates.idle;
        this.player.stop();
        this.emitter.emit("update", this.readableQueue);
    }
    save(name) {
        const saveObject = {
            queues: this.queues,
            readableQueue: this.readableQueue,
            currentIndex: this.currentIndex,
        };
        fsextra.ensureFileSync(`resources/data/queues/${name}.json`);
        fs.writeFileSync(
            `resources/data/queues/${name}.json`,
            JSON.stringify(saveObject, null, 2)
        );
        return `resources/data/queues/${name}.json`;
    }
    load(name) {
        if (name.includes(".json")) name = name.replace(".json", "");
        const saveObject = JSON.parse(
            fs.readFileSync(`resources/data/queues/${name}.json`)
        );
        this.queues = saveObject.queues;
        this.readableQueue = saveObject.readableQueue;
        this.currentIndex = saveObject.currentIndex;
        this.emitter.emit("update", this.readableQueue);
    }
    shuffle() {
        let arr1 = this.queues;
        let arr2 = this.readableQueue;
        const oldIndex = this.currentIndex;
        if (arr1.length !== arr2.length) {
            throw new Error('Arrays must be of the same length');
        }
        let n = arr1.length;
        for (let i = n - 1; i > 0; i--) {
            // Generate a random index between 0 and i
            let j = Math.floor(Math.random() * (i + 1));
            // Swap elements in both arrays at indices i and j
            [arr1[i], arr1[j]] = [arr1[j], arr1[i]];
            [arr2[i], arr2[j]] = [arr2[j], arr2[i]];
        }
        this.currentIndex = arr1.indexOf(this.queues[oldIndex]);
        this.queues = arr1;
        this.readableQueue = arr2;
        this.emitter.emit("update", this.readableQueue);
        return this.readableQueue;
    }
    onDisconect = () => {
        if (this.player) this.player.stop();
        this.stop();
        this.connection = undefined;
    };
    constructor({ voiceConnection, player, messageChannel }) {
        this.voiceConnection = voiceConnection;
        this.player = player;
        this.messageChannel = messageChannel;

        if (!this.player) {
            this.player = voice.createAudioPlayer();
        }
        this.player.on("stateChange", (oldState, newState) => {
            if (
                newState.status == "idle" &&
                this.state !== (queueStates.idle || queueStates.paused)
            ) {
                this.next();
            }
        });
        this.player.on("error", (error) => {
            log.error(error);
            // auto skips due to player state changing to idle
        });
        if (!this.connection) return;
        this.connection.on("disconnect", this.onDisconect);
        this.connection.on("destroyed", this.onDisconect);
    }
}
