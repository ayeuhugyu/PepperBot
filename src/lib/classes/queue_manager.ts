import * as log from "../log";
import { google, youtube_v3 } from "googleapis";
import { config } from "dotenv";
import internal, { Readable } from "stream";
import { Guild } from "discord.js";
import { GuildVoiceManager } from "../voice";
import shell from "shelljs";
import fs from "fs";
import path from "path";
import { fixFileName } from "../attachment_manager";

config();
const youtube = google.youtube({
    version: "v3",
    auth: process.env.GOOGLE_API_KEY
});

export interface ShellResponse {
    code: number;
    stdout: string;
    stderr: string;
}

export interface VideoSupportedResponse {
    supported: boolean;
    stdout: string;
    stderr: string;
}


function sanitizeUrl(url: string): string {
    // remove any characters that aren't a-z, A-Z, 0-9, :, /, ., ?, &, =, +, -, or _.
    return url.replace(/[^a-zA-Z0-9:\/*?&=+_.-]/g, '');
}

export function isSupportedUrl(url: string): Promise<VideoSupportedResponse> {
    return new Promise((resolve) => {
        const command = `yt-dlp --simulate "${sanitizeUrl(url)}" --no-playlist`;
        shell.exec(command, { silent: true }, (code, stdout, stderr) => {
            resolve({ supported: (code === 0), stdout, stderr});
        });
    });
}

export enum ToFileResponseType {
    Success,
    Error
}
export type VideoError = string;
export interface ToFileResponse {
    type: ToFileResponseType;
    data: string | VideoError;
}

export class Video {
    url: string = "";
    title: string = "";
    length?: number; // seconds
    toFile(): Promise<ToFileResponse> {
        return new Promise ((resolve, reject) => {
            if (!this.url) {
                log.error("attempt to convert video to buffer with no url");
                reject({
                    type: ToFileResponseType.Error,
                    data: "missing video url"
                });
                return;
            }
            //let stream: internal.Readable;
            try {
                const cacheDir = path.resolve(__dirname, "../../../cache/ytdl");
                if (!fs.existsSync(cacheDir)) {
                    fs.mkdirSync(cacheDir, { recursive: true });
                }

                const filePath = path.join(cacheDir, `${fixFileName(sanitizeUrl(this.title))}.mp3`);
                const command = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --no-playlist -o "${filePath}" "${this.url}"`;

                shell.exec(command, { silent: true }, (code, stdout, stderr) => {
                    if (code !== 0) {
                        reject({
                            type: ToFileResponseType.Error,
                            data: stderr
                        });
                        return;
                    }

                    resolve({
                        type: ToFileResponseType.Success,
                        data: filePath
                    });
                });
            } catch (err) {
                log.error("failed to convert video to buffer: ", err);
                reject({
                    type: ToFileResponseType.Error,
                    data: "failed to convert video to buffer"
                });
                return;
            }
        });
    }
    async getInfo(): Promise<void | VideoError> {
        return new Promise((resolve, reject) => {
            try {
                if (!this.url) {
                    log.error("attempt to get info of a video with no url");
                    reject("missing video url");
                    return;
                }
                const command = `yt-dlp --get-title --get-duration "${sanitizeUrl(this.url)}" --no-playlist`;
                shell.exec(command, { silent: true }, (code, stdout, stderr) => {
                    if (code !== 0) {
                        reject(stderr);
                        return;
                    }
                    const [title, length] = stdout.split('\n');
                    if (!title) {
                        reject("unable to fetch video title");
                        return;
                    }
                    this.title = title;
                    this.length = parseInt(length);
                    resolve();
                });
            } catch (error) {
                log.error("failed to get info of video: " + this.url + " (error: " + error + ")");
                reject("failed to get video info (error: " + error + ")");
                return;
            }
        });
    }
    constructor(url: string) {
        this.url = sanitizeUrl(url);
        return this;
    }
}

export class Playlist {
    id: string = "";
    title: string = "";
    videos: (Video | VideoError)[] = [];
    async getInfo(): Promise<any | VideoError> {
        if (!this.id) {
            log.error("attempt to get info of a playlist with no id");
            return "missing playlist id";
        }
        const response = await youtube.playlistItems.list({
            part: ["id,snippet"],
            id: [this.id],
        });
        if (!response) {
            log.error("failed to get info of playlist: " + this.id + " (response is undefined)");
            return "failed to get playlist info (response is undefined)";
        }
        const playlistItems = response.data.items;
        if (!playlistItems) {
            log.error("failed to get info of playlist: " + this.id + " (playlistItems is undefined)");
            return "failed to get playlist info (playlistItems is undefined)";
        }
        if (playlistItems.length === 0) {
            log.error("failed to get info of playlist: " + this.id + " (playlistItems is empty)");
            return "failed to get playlist info (playlistItems is empty)";
        }
        playlistItems.forEach((item: youtube_v3.Schema$PlaylistItem) => {
            const video = new Video(`https://www.youtube.com/watch?v=${item.snippet?.resourceId?.videoId}`);
            if (!item.snippet) {
                this.videos.push("missing snippet");
                return;
            }
            if (!item.snippet.title) {
                this.videos.push("missing title");
                return;
            }
            if (!item.snippet.thumbnails) {
                this.videos.push("missing thumbnails");
                return;
            }

            video.title = item.snippet?.title;
            this.videos.push(video);
        });

        return response;
    }
}

// UNFINISHED queue stuff

export enum QueueItemType {
    Video,
    Playlist,
    Error
}

export interface QueueItemMap {
    [QueueItemType.Video]: Video;
    [QueueItemType.Playlist]: Playlist;
    [QueueItemType.Error]: VideoError;
}

export interface QueueItem<T extends QueueItemType> {
    type: T;
    item: QueueItemMap[T];
}

export class Queue {
    guild?: Guild;
    items: QueueItem<QueueItemType>[] = [];
    voice_manager?: GuildVoiceManager;
    constructor(guild?: Guild) {
        this.guild = guild;
    }
}