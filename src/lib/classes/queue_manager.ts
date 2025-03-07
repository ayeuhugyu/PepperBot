import * as log from "../log";
import { config } from "dotenv";
import { Guild } from "discord.js";
import { GuildVoiceManager } from "../voice";
import fs from "fs";
import path from "path";
import { fixFileName } from "../attachment_manager";
import { execFile } from "child_process";
import EventEmitter from "events";
import * as voice from "../voice";
import { CustomSound } from "../custom_sound_manager";
import { AudioPlayerStatus, AudioResource } from "@discordjs/voice";
import { re } from "mathjs";

config();

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
        const command = `yt-dlp`;
        const args = ['--update', '--simulate', sanitizeUrl(url), '--no-playlist'];
        execFile(command, args, (error, stdout, stderr) => {
            resolve({ supported: !error, stdout, stderr });
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
                log.error("attempt to convert video to file with no url");
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
                const command = `yt-dlp`;
                const args = [
                    '--update',
                    '-f', 'bestaudio',
                    '--extract-audio',
                    '--audio-format', 'mp3',
                    '--no-playlist',
                    '-o', filePath,
                    sanitizeUrl(this.url)
                ];

                execFile(command, args, (error, stdout, stderr) => {
                    if (error) {
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
                log.error("failed to convert video to file: ", err);
                reject({
                    type: ToFileResponseType.Error,
                    data: "failed to convert video to file"
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
                const command = `yt-dlp`;
                const args = [
                    '--update',
                    '--get-title',
                    '--get-duration',
                    sanitizeUrl(this.url),
                    '--no-playlist'
                ];
                execFile(command, args, (error, stdout, stderr) => {
                    if (error) {
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
                log.error("failed to get info of video: " + sanitizeUrl(this.url) + " (error: " + error + ")");
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
    url: string = "";
    videos: (Video | VideoError)[] = [];
    constructor(url: string) {
        this.url = url;
    }
    async getVideos(): Promise<void | VideoError> {
        log.warn("getVideos not implemented");
        return;
    }
}

export enum QueueEventType {
    Add = "Add",
    Remove = "Remove",
    Clear = "Clear",
    Play = "Play",
    Stop = "Stop",
    Next = "Next",
    Previous = "Previous",
    Error = "Error",
    Downloading = "Downloading"
}

export enum QueueState {
    Playing,
    Idle
}

export class Queue {
    guild?: Guild;
    items: (Video | CustomSound)[] = []; // there's no verify function ran in here, so its assuming that all videos will be valid (i mean theres a little bit of error handling but not much)
    voice_manager: GuildVoiceManager;
    emitter: EventEmitter = new EventEmitter();
    current_index: number = 0;
    state: QueueState = QueueState.Idle;
    currently_playing: Video | CustomSound | null = null;
    currently_playing_resource: AudioResource | null = null;
    constructor(guild: Guild | undefined, voice_manager: GuildVoiceManager) {
        this.guild = guild;
        this.voice_manager = voice_manager;

        this.voice_manager.audio_player.on("stateChange", (oldState, newState) => {
            this.currently_playing = null;
            this.currently_playing_resource = null;
            if (newState.status === AudioPlayerStatus.Idle && this.state !== QueueState.Idle) {
                this.next();
            }
        });
    }
    on = this.emitter.on;
    once = this.emitter.once;
    off = this.emitter.off;
    removeAllListeners = this.emitter.removeAllListeners;
    emit = this.emitter.emit;

    add(item: Video | Playlist | CustomSound) {
        if (item instanceof Video || item instanceof CustomSound) {
            this.items.push(item);
            this.emit(QueueEventType.Add, item);
        } else if (item instanceof Playlist) {
            const playlistItem = item as Playlist;
            playlistItem.videos.forEach((video) => {
                if (video instanceof Video) {
                    this.items.push(video);
                }
            });
            this.emit(QueueEventType.Add, item);
        }
    }
    remove(index: number) {
        this.items.splice(index, 1);
        this.emit(QueueEventType.Remove, index);
    }
    clear() {
        this.items = [];
        this.emit(QueueEventType.Clear);
    }
    async play(index?: number) {
        if (index) {
            this.current_index = index;
        }
        this.emit(QueueEventType.Play);
        const item = this.items[this.current_index];
        let filePath: string | undefined;
        if (item instanceof Video) {
            this.emit(QueueEventType.Downloading, item);
            let errored = false;
            const response = await item.toFile().catch((error) => {
                log.error("failed to convert video to file: " + error);
                this.emit(QueueEventType.Error, error);
                this.next();
                errored = true;
                return;
            });
            if (errored) return;
            if (!response) {
                log.error("failed to convert video to file");
                this.emit(QueueEventType.Error, "failed to convert video to file");
                this.next();
                return;
            }
            if (response.type === ToFileResponseType.Error) {
                log.error("failed to convert video to file: " + response.data);
                this.emit(QueueEventType.Error, response.data);
                this.next();
                return;
            }
            filePath = response.data;
        }
        if (item instanceof CustomSound) {
            filePath = item.path;
        }
        if (!filePath) {
            log.error("failed to get file path");
            this.emit(QueueEventType.Error, "failed to get file path");
            this.next();
            return;
        }
        let errored = false;
        const resource = await voice.createAudioResource(filePath).catch((error) => {
            log.error("failed to create audio resource from video file: " + error);
            this.emit(QueueEventType.Error, error);
            errored = true;
            this.next();
            return;
        });
        if (errored) return;
        if (!resource) {
            log.error("failed to create audio resource from file");
            this.emit(QueueEventType.Error, "failed to create audio resource from file");
            this.next();
            return;
        }
        this.emit(QueueEventType.Play, this.current_index);
        this.state = QueueState.Playing;
        this.currently_playing = item;
        this.currently_playing_resource = resource;
        this.voice_manager.play(resource);
    }
    next() {
        this.current_index++;
        if (this.current_index >= this.items.length) {
            this.current_index = 0;
            this.play(this.current_index);
            return;
        }
        this.play(this.current_index);
        this.emit(QueueEventType.Next, this.current_index);
    }
    previous() {
        this.current_index--;
        if (this.current_index < 0) {
            this.current_index = this.items.length - 1;
        }
        this.play(this.current_index);
        this.emit(QueueEventType.Previous, this.current_index);
    }
    stop() {
        this.voice_manager.stop();
        this.state = QueueState.Idle;
        this.currently_playing = null;
        this.currently_playing_resource = null;
        this.emit(QueueEventType.Stop);
    }
}

// test-url: https://www.youtube.com/watch?v=Iy2Etqoylew&list=PLZPK9tzp-98d-T4YFtbuvaF8W6IgkuwW4