import * as log from "../log";
import { config } from "dotenv";
import { Guild, GuildMember, VoiceStateManager } from "discord.js";
import { GuildVoiceManager } from "../voice";
import fs from "fs";
import path from "path";
import { fixFileName } from "../attachment_manager";
import { execFile } from "child_process";
import EventEmitter from "events";
import * as voice from "../voice";
import { CustomSound, getSoundNoAutocorrect } from "../custom_sound_manager";
import { AudioPlayer, AudioPlayerState, AudioPlayerStatus, AudioResource } from "@discordjs/voice";
import { re } from "mathjs";
import { CommandInvoker } from "./command";
import { GuildConfig } from "../guild_config_manager";
import database from "../data_manager";

config();

export interface ShellResponse {
    code: number;
    stdout: string;
    stderr: string;
}

export interface VideoError {
    message: string;
    full_error: string;
}

export enum ResponseType {
    Success,
    Error
}
export interface Response<E extends boolean, T> {
    type: E extends true ? ResponseType.Error : ResponseType.Success;
    data: T;
}

function sanitizeUrl(url: string): string {
    // remove any characters that aren't a-z, A-Z, 0-9, :, /, ., ?, &, =, +, -, or _.
    return url.replace(/[^a-zA-Z0-9:\/*?&=+_.-]/g, '');
}

const error_messages: Record<string, string> = {
    "Unsupported URL": "unsupported url",
    "Use --cookies-from-browser or --cookies for the authentication. See  https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp  for how to manually pass cookies. Also see  https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies  for tips on effectively exporting YouTube cookies": "internal error: yt-dlp has not been passed required cookies. ",
    "Requested format is not available. Use --list-formats for a list of available formats": "this website does not provide an audio only format",
    "Error 403: rate limit exceeded": "rate limit exceeded",
    "Error 429: Too Many Requests": "rate limit exceeded",
    "Error 404: Not Found": "video not found",
    "Error 410: Gone": "video has been removed",
}

function getErrorFromStderr(stderr: string, fallback: string): string {
    for (const key in error_messages) {
        if (stderr.includes(key)) {
            return error_messages[key];
        }
    }
    return fallback;
}

export function parseLength(length: string): number {
    return parseInt(length);
}

export async function getInfo(url: string, no_playlist: boolean = false): Promise<Response<false, (Video | Playlist)> | Response<true, VideoError>> {
    return new Promise((resolve, reject) => {
        const command = `yt-dlp`;
        const args = [
            '--simulate',
            '--get-title',
            '--get-duration',
            '--get-id',
            '--get-url',
            no_playlist ? '--no-playlist' : '--flat-playlist',
            process.env.PATH_TO_COOKIES ? '--cookies' : '', process.env.PATH_TO_COOKIES ? process.env.PATH_TO_COOKIES : '',
            sanitizeUrl(url),
        ]

        execFile(command, args, (error, stdout, stderr) => {
            if (error) {
                reject({
                    type: ResponseType.Error,
                    data: {
                        message: getErrorFromStderr(stderr, "failed to get video info"),
                        full_error: stderr.replaceAll('\n', "")
                    }
                });
                return;
            }

            const lines = stdout.split('\n').filter((line) => line !== "");

            if (lines.length < 8) { // for some odd reason, some websites return multiple urls from --get-url? this probably isn't a catch all solution but i have zero fuckin clue what else to do
                const title = lines[0];
                const id = lines[1];
                const length = lines[lines.length - 1];
                if (!title || !id || !length || !url) {
                    reject({
                        type: ResponseType.Error,
                        data: {
                            message: "failed to get video info",
                            full_error: "stdout.split('\\n') returned an array with less than 3 elements"
                        }
                    });
                    return;
                }
                const video = new Video(url);
                video.title = title;
                video.length = parseLength(length);
                video.id = id;
                resolve({
                    type: ResponseType.Success,
                    data: video
                })
                return;
            }

            const segments = lines.map((_, i) => lines.slice(i, i + 4)).filter((_, i) => i % 4 === 0);

            if (segments.length > 1) {
                const playlist = new Playlist(url);
                segments.forEach(([title, id, url, length]) => {
                    if (!title || !id || !url || !length) {
                        if (playlist.videos.length === 0) {
                            reject({
                                type: ResponseType.Error,
                                data: {
                                    message: "failed to get video info",
                                    full_error: "stdout.split('\\n') returned an array with less than 4 elements"
                                }
                            });
                            return;
                        } else {
                            return;
                        }
                    }
                    const video = new Video(url);
                    video.title = title;
                    video.length = parseLength(length);
                    video.id = id;
                    playlist.videos.push(video);
                });
                resolve({
                    type: ResponseType.Success,
                    data: playlist
                });
            }
            reject({
                type: ResponseType.Error,
                data: {
                    message: "failed to get video info",
                    full_error: "stdout.split('\\n') returned an empty array"
                }
            });
        });
    });
}

export class Video {
    url: string = "";
    title: string = "";
    length: number = 0; // seconds
    id: string = "";
    toFile(): Promise<Response<true, VideoError> | Response<false, string>> {
        return new Promise ((resolve, reject) => {
            if (!this.url) {
                log.error("attempt to convert video to file with no url");
                reject({
                    type: ResponseType.Error,
                    data: {
                        message: "missing video url",
                        full_error: "attempt to convert video to file with no url"
                    }
                });
                return;
            }
            //let stream: internal.Readable;
            try {
                const cacheDir = path.resolve(__dirname, "../../../cache/ytdl");
                if (!fs.existsSync(cacheDir)) {
                    fs.mkdirSync(cacheDir, { recursive: true });
                }

                const filePath = path.join(cacheDir, `${fixFileName(sanitizeUrl(this.title + "_" + this.id))}.mp3`);
                const archivePath = path.join(cacheDir, 'archive.txt');
                const command = `yt-dlp`;
                const args = [
                    '-f', 'bestaudio/best',
                    '--extract-audio',
                    '--audio-format', 'mp3',
                    '--no-playlist',
                    '--download-archive', archivePath,
                    '--limit-rate', '250k',
                    '-o', filePath,
                    process.env.PATH_TO_COOKIES ? '--cookies' : '', process.env.PATH_TO_COOKIES ? process.env.PATH_TO_COOKIES : '',
                    sanitizeUrl(this.url)
                ];

                execFile(command, args, (error, stdout, stderr) => {
                    if (error) {
                        reject({
                            type: ResponseType.Error,
                            data: {
                                message: getErrorFromStderr(stderr, "failed to convert video to file"),
                                full_error: stderr.replaceAll('\n', "")
                            }
                        });
                        return;
                    }

                    resolve({
                        type: ResponseType.Success,
                        data: filePath
                    });
                });
            } catch (err) {
                log.error("failed to convert video to file: ", err);
                reject({
                    type: ResponseType.Error,
                    data: {
                        message: "failed to convert video to file",
                        full_error: err
                    }
                });
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
    Downloading = "Downloading",
    Skipped = "Skipped",
    Shuffle = "Shuffle"
}

export enum QueueState {
    Playing,
    Idle,
}

function audioPlayerStateChange(_oldState: AudioPlayerState, newState: AudioPlayerState, self: Queue) {
    if (newState.status === AudioPlayerStatus.Idle && self.state !== QueueState.Idle) {
        self.currently_playing = null;
        self.currently_playing_resource = null;
        self.next();
    }
}

export enum dbQueueDataType {
    Video = "video",
    CustomSound = "custom_sound",
    QueueData = "queue_data"
}

export type dbQueue<T extends dbQueueDataType> = {
    guild: string;
    type: T;

    index: T extends dbQueueDataType.Video ? number : T extends dbQueueDataType.CustomSound ? number : undefined;

    url: T extends dbQueueDataType.Video ? string : undefined;
    title: T extends dbQueueDataType.Video ? string : undefined;
    length: T extends dbQueueDataType.Video ? number : undefined;
    videoId: T extends dbQueueDataType.Video ? string : undefined;

    name: T extends dbQueueDataType.CustomSound ? string : undefined;

    key: T extends dbQueueDataType.QueueData ? string : undefined;
    value: T extends dbQueueDataType.QueueData ? string : undefined;
}

export class Queue {
    guild_id?: string;
    items: (Video | CustomSound)[] = []; // there's no verify function ran in here, so its assuming that all videos will be valid (i mean theres a little bit of error handling but not much)
    voice_manager: GuildVoiceManager | undefined;
    emitter: EventEmitter = new EventEmitter();
    current_index: number = 0;
    state: QueueState = QueueState.Idle;
    currently_playing: Video | CustomSound | null = null;
    currently_playing_resource: AudioResource | null = null;
    constructor(guild: string | undefined, voice_manager?: GuildVoiceManager) {
        this.guild_id = guild;

        if (voice_manager) this.setVoiceManager(voice_manager);

        this.emitter.on(QueueEventType.Play, () => {
            this.voice_manager?.channel?.send(`> playing \`${this.currently_playing instanceof Video ? this.currently_playing.title : this.currently_playing instanceof CustomSound ? this.currently_playing.name : "unknown"}\``);
        });
        this.emitter.on(QueueEventType.Stop, (skipped: boolean) => {
            if (skipped) return;
            this.voice_manager?.channel?.send(`> queue stopped`);
        });
        this.emitter.on(QueueEventType.Error, (error: string) => {
            this.voice_manager?.channel?.send(`> error: ${error}`);
        });
        this.emitter.on(QueueEventType.Downloading, (item: Video) => {
            this.voice_manager?.channel?.send(`> downloading \`${item.title}\``);
        });
        this.emitter.on(QueueEventType.Add, (item: Video | Playlist | CustomSound) => {
            if (item instanceof Playlist) {
                this.voice_manager?.channel?.send(`> added ${item.videos.length} items from playlist`);
                return;
            }
            this.voice_manager?.channel?.send(`> added \`${item instanceof Video ? item.title : item instanceof CustomSound ? item.name : "unknown"}\``);
        });
        this.emitter.on(QueueEventType.Remove, (index: number) => {
            this.voice_manager?.channel?.send(`> removed item at index \`${index}\``);
        });
        this.emitter.on(QueueEventType.Clear, () => {
            this.voice_manager?.channel?.send(`> cleared queue`);
        });
        this.emitter.on(QueueEventType.Skipped, (item: Video | CustomSound) => {
            this.voice_manager?.channel?.send(`> skipped \`${item instanceof Video ? item.title : item instanceof CustomSound ? item.name : "unknown"}\``);
        });
        this.emitter.on(QueueEventType.Shuffle, () => {
            this.voice_manager?.channel?.send(`> shuffled queue; now at index \`${this.current_index + 1}\``);
        });
    }
    on = this.emitter.on;
    once = this.emitter.once;
    off = this.emitter.off;
    removeAllListeners = this.emitter.removeAllListeners;
    emit = this.emitter.emit;

    static fromDatabase(dbQueue: dbQueue<dbQueueDataType>[]) {
        const queueData: dbQueue<dbQueueDataType.QueueData>[] = dbQueue.filter((data): data is dbQueue<dbQueueDataType.QueueData> => data.type === "queue_data");
        const items = dbQueue.filter((data): data is dbQueue<dbQueueDataType.Video> | dbQueue<dbQueueDataType.CustomSound> => data.type === "video" || data.type === "custom_sound");

        const queue = new Queue(queueData[0]?.guild);

        queueData.forEach((data) => { // will use this more later possibly if i add saving them with different names but idk
            switch (data.key) {
                case "current_index":
                    queue.current_index = parseInt(data.value);
                    break;
                default: break;
            }
        });

        items.forEach(async (data) => {
            switch (data.type) {
                case "video":
                    const video = new Video(data.url as string);
                    video.title = data.title as string;
                    video.length = data.length as number;
                    video.id = data.videoId as string;
                    queue.items.splice(data.index, 0, video);
                    break;
                case "custom_sound":
                    const sound = await getSoundNoAutocorrect(data.name);
                    if (sound) {
                        queue.items.splice(data.index, 0, sound);
                    }
                    break;
                default: break;
            }
        });

        return queue;
    }

    async write(): Promise<dbQueue<dbQueueDataType>[]> {
        const queueData: dbQueue<dbQueueDataType>[] = [];
        this.items.forEach((item, index) => {
            if (item instanceof Video) {
                queueData.push({
                    guild: this.guild_id || "",
                    type: dbQueueDataType.Video,
                    index: index,
                    url: item.url,
                    title: item.title,
                    length: item.length,
                    videoId: item.id,
                    name: undefined,
                    key: undefined,
                    value: undefined
                });
            } else if (item instanceof CustomSound) {
                queueData.push({
                    guild: this.guild_id || "",
                    type: dbQueueDataType.CustomSound,
                    index: index,
                    url: undefined,
                    title: undefined,
                    length: undefined,
                    videoId: undefined,
                    name: item.name,
                    key: undefined,
                    value: undefined
                });
            }
        });
        queueData.push({
            guild: this.guild_id || "",
            type: dbQueueDataType.QueueData,
            index: undefined,
            url: undefined,
            title: undefined,
            length: undefined,
            videoId: undefined,
            name: undefined,
            key: "current_index",
            value: this.current_index.toString()
        });
        await database("queues").where({ guild: this.guild_id }).delete();
        await database("queues").insert(queueData);
        return queueData;
    }

    setVoiceManager(manager: GuildVoiceManager) {
        this.voice_manager = manager;
        let eventConnection: undefined | AudioPlayer = this.voice_manager?.audio_player.on("stateChange", (oldState, newState) => {
            audioPlayerStateChange(oldState, newState, this);
        });
        this.voice_manager?.connection?.on("stateChange", (oldState, newState) => {
            if (newState.status === "destroyed") {
                this.stop();
                this.voice_manager?.audio_player?.off("stateChange", audioPlayerStateChange);
                this.voice_manager = undefined;
                eventConnection = undefined;
            }
        });
    }

    async add(item: Video | Playlist | CustomSound) {
        if (item instanceof Video || item instanceof CustomSound) {
            this.items.push(item);
            this.emitter.emit(QueueEventType.Add, item);
        } else if (item instanceof Playlist) {
            const playlistItem = item as Playlist;
            playlistItem.videos.forEach((video) => {
                if (video instanceof Video) {
                    this.items.push(video);
                }
            });
            this.emitter.emit(QueueEventType.Add, item);
        }
        await this.write();
    }
    async remove(index: number) {
        this.items.splice(index, 1);
        this.emitter.emit(QueueEventType.Remove, index);
        await this.write();
    }
    async clear() {
        this.items = [];
        this.emitter.emit(QueueEventType.Clear);
        await this.write();
    }
    async play(index?: number) {
        if (this.items.length === 0) {
            this.emitter.emit(QueueEventType.Error, "queue is empty");
            return;
        }
        if (index) {
            this.current_index = index;
        }
        const item = this.items[this.current_index];
        if (!item) {
            this.emitter.emit(QueueEventType.Error, "item at index " + this.current_index + " is undefined");
            return;
        }
        let filePath: string | undefined;
        if (item instanceof Video) {
            this.emitter.emit(QueueEventType.Downloading, item);
            const response = await item.toFile().catch((error: Response<true, VideoError>) => { return error });
            if (!response) {
                log.error("failed to convert video to file");
                this.emitter.emit(QueueEventType.Error, "failed to convert video to file");
                this.remove(this.current_index);
                this.next();
                return;
            }
            if (response.type === ResponseType.Error) {
                const error = response.data;
                log.error("failed to convert video to file: " + error);
                this.emitter.emit(QueueEventType.Error, error.message + "\n-# \`" + error.full_error + "`");
                if (error.message === "rate limit exceeded") {
                    this.stop();
                    return;
                }
                this.remove(this.current_index);
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
            this.emitter.emit(QueueEventType.Error, "failed to get file path");
            this.remove(this.current_index);
            this.next();
            return;
        }
        let errored = false;
        const resource = await voice.createAudioResource(filePath).catch((error) => {
            log.error("failed to create audio resource from video file: " + error);
            this.emitter.emit(QueueEventType.Error, error);
            errored = true;
            this.remove(this.current_index);
            this.next();
            return;
        });
        if (errored) return;
        if (!resource) {
            log.error("failed to create audio resource from file");
            this.emitter.emit(QueueEventType.Error, "failed to create audio resource from file");
            this.remove(this.current_index);
            this.next();
            return;
        }
        this.state = QueueState.Playing;
        this.currently_playing = item;
        this.currently_playing_resource = resource;
        this.emitter.emit(QueueEventType.Play);
        this.voice_manager?.play(resource);
    }
    async next(skipped?: boolean) {
        const item = this.items[this.current_index];
        this.current_index++;
        if (this.current_index >= this.items.length) {
            this.current_index = 0;
        }
        this.emitter.emit(QueueEventType.Next, this.current_index);
        if (skipped) {
            this.stop(true);
            this.emitter.emit(QueueEventType.Skipped, item);
        }
        this.play(this.current_index);
        await this.write();
    }
    async previous() {
        this.current_index--;
        if (this.current_index < 0) {
            this.current_index = this.items.length - 1;
        }
        this.play(this.current_index);
        this.emitter.emit(QueueEventType.Previous, this.current_index);
        await this.write();
    }
    stop(skipped: boolean = false) {
        this.voice_manager?.stop();
        this.state = QueueState.Idle;
        this.currently_playing = null;
        this.currently_playing_resource = null;
        this.emitter.emit(QueueEventType.Stop, skipped);
    }
    async shuffle() {
        const currentItem = this.items[this.current_index];
        this.items = this.items.sort(() => Math.random() - 0.5);
        this.current_index = this.items.indexOf(currentItem as Video | CustomSound) || 0
        this.emitter.emit(QueueEventType.Shuffle);
        await this.write();
    }
}

/*
const testQueue = new Queue("1112819622505365556", undefined);
const response: Response<false, Playlist> = await getInfo("https://www.youtube.com/watch?v=Te_cA3UeFQg&list=PLGPnvYCC8I1Wlpx11Nr3LsmW9sjBH7Jew") as Response<false, Playlist>;
testQueue.add(response.data);
testQueue.currently_playing = response.data.videos[6] as any;
*/

export async function getQueueById(guildId: string): Promise<Queue | undefined> {
    let queue
    const dbItems = await database("queues").where({ guild: guildId })
    if (dbItems.length > 0) {
        queue = Queue.fromDatabase(dbItems);
    }
    return queue;
}

export async function getQueue(invoker: CommandInvoker, guild_config: GuildConfig): Promise<Response<false, Queue> | Response<true, string>> {
    let queue
    const dbItems = await database("queues").where({ guild: invoker.guildId })
    if (dbItems.length > 0) {
        queue = Queue.fromDatabase(dbItems);
    }
    if (queue) {
        let connectionManager = await voice.getVoiceManager(invoker.guildId || "");
        if (!connectionManager && (invoker.member instanceof GuildMember) && invoker.member?.voice.channel) {
            connectionManager = await voice.joinVoiceChannel((invoker.member.voice.channel));
        }
        if (connectionManager) {
            queue.setVoiceManager(connectionManager);
        }
    }
    if (!invoker.guildId) {
        return { type: ResponseType.Error, data: "you must be in a guild to use this command" };
    }
    if (!queue) {
        let connectionManager = await voice.getVoiceManager(invoker.guildId || "");
        if (!connectionManager && (invoker.member instanceof GuildMember) && invoker.member?.voice.channel) {
            connectionManager = await voice.joinVoiceChannel((invoker.member.voice.channel));
        }
        if (!connectionManager) {
            return { type: ResponseType.Error, data: `neither of us are in a voice channel, use ${guild_config.other.prefix}vc join to make me join one` };
        }
        queue = new Queue(invoker.guildId, connectionManager);
    }
    return { type: ResponseType.Success, data: queue };
}