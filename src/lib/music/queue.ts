import { Guild, Message, VoiceBasedChannel } from "discord.js";
import { GuildVoiceManager, VoiceEventListener, VoiceManagerEvent, getVoiceManager } from "../classes/voice";
import { Playlist, Video } from "./media";
import { downloadMedia } from "../downloaders";
import * as action from "../discord_action";
import { DownloadedVideo } from "../downloaders/base";
import { createAudioResource } from "@discordjs/voice";
import { CustomSound } from "../custom_sound_manager";

enum QueueState {
    Playing = "playing",
    Idle = "idle",
}

function shuffleArray<T>(array: T[]): T[] {
    return array
        .map((item) => ({ item, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ item }) => item);
}

type QueueItem = Video | Playlist | CustomSound;

let queues = new Map<string, QueueManager>();

export function getQueue(guild: Guild): QueueManager {
    const queue = queues.get(guild.id);
    if (!queue) {
        const voiceManager = getVoiceManager(guild);
        return new QueueManager(voiceManager);
    }
    return queue;
}

export class QueueManager implements VoiceEventListener {
    items: QueueItem[] = [];
    currentIndex: number = 0;
    currentPlaylistIndex: number | undefined = undefined;
    voiceManager: GuildVoiceManager | undefined = undefined;
    state: QueueState = QueueState.Idle;
    channel: VoiceBasedChannel | undefined = undefined;
    lastSentLog: Message<true> | undefined = undefined;
    guild: GuildVoiceManager["guild"];

    constructor(voiceManager: GuildVoiceManager) {
        this.voiceManager = voiceManager;
        this.channel = voiceManager.channel;
        this.guild = voiceManager.guild;
        this.voiceManager.addListener(this);
        this.voiceManager.on(VoiceManagerEvent.Disconnect, () => {
            this.state = QueueState.Idle;
        });
        queues.set(voiceManager.guild.id, this);
    }

    onVoiceStop() {
        // Only auto-advance if not suppressed (handled by voice manager)
        this.next();
    }

    async outputLog(message: string) {
        if (!this.channel) {
            throw new Error("Channel is not set");
        }
        this.lastSentLog = (await action.send(this.channel, `> ${message}`)) as Message<true>;
    }

    async editLastLog(message: string) {
        if (!this.lastSentLog) {
            throw new Error("No message to edit");
        }
        await action.edit(this.lastSentLog, `> ${message}`);
    }

    async playVideo(inputVideo: Video) {
        if (!this.voiceManager) {
            throw new Error("Voice manager is not set");
        }
        if (!this.voiceManager.connection) {
            throw new Error("Voice connection is not established");
        }
        let downloadedVideo: DownloadedVideo
        if (!inputVideo.filePath) {
            this.outputLog(`downloading ${inputVideo.title} video...`);
            const output = await downloadMedia(inputVideo, this.outputLog, this.editLastLog)
            if (!output) {
                throw new Error("Failed to download video");
            }
            this.lastSentLog = undefined;
            downloadedVideo = output;
        } else {
            downloadedVideo = inputVideo as DownloadedVideo;
        }
        const video = downloadedVideo as DownloadedVideo

        if (!video) {
            throw new Error("Video is null");
        }

        const audioResource = createAudioResource(video.filePath)
        this.outputLog(`playing ${video.title}...`);
        this.voiceManager.play(audioResource);
        this.state = QueueState.Playing;
    }

    async playCustomSound(sound: CustomSound) {
        if (!this.voiceManager) {
            throw new Error("Voice manager is not set");
        }
        if (!this.voiceManager.connection) {
            throw new Error("Voice connection is not established");
        }
        const audioResource = createAudioResource(sound.path);
        this.outputLog(`playing ${sound.name}...`);
        this.voiceManager.play(audioResource);
        this.state = QueueState.Playing;
    }

    async playPlaylist(playlist: Playlist, index: number) {
        const item = playlist.videos[index];
        if (!item) {
            throw new Error("Item not found in playlist");
        }
        this.currentPlaylistIndex = index;
        return await this.playVideo(item);
    }

    async play(index?: number) {
        const currentItem = this.items[index ?? this.currentIndex];
        if (!currentItem) {
            throw new Error("Item not found in queue");
        }
        const title = (currentItem instanceof CustomSound) ? currentItem.name : (currentItem as Video | Playlist).title || `index ${index}`;
        if (currentItem instanceof Video) {
            return await this.playVideo(currentItem);
        }
        if (currentItem instanceof Playlist) {
            if (this.currentPlaylistIndex === undefined) {
                this.currentPlaylistIndex = 0;
            }
            return await this.playPlaylist(currentItem, this.currentPlaylistIndex);
        }
        if (currentItem instanceof CustomSound) {
            return await this.playCustomSound(currentItem);
        }
        throw new Error("Item is not a video, playlist, or custom sound");
    }

    private updateIndices(direction: 1 | -1) {
        if (this.currentPlaylistIndex !== undefined) {
            this.currentPlaylistIndex += direction;
            const currentItem = this.items[this.currentIndex];
            if (currentItem instanceof Playlist) {
                if (this.currentPlaylistIndex >= currentItem.videos.length) {
                    this.currentPlaylistIndex = undefined;
                    this.currentIndex += direction;
                } else if (this.currentPlaylistIndex < 0) {
                    this.currentPlaylistIndex = undefined;
                    this.currentIndex += direction;
                }
            }
        } else {
            this.currentIndex += direction;
        }

        if (this.currentIndex >= this.items.length) {
            this.currentIndex = 0;
            this.currentPlaylistIndex = undefined;
        } else if (this.currentIndex < 0) {
            this.currentIndex = this.items.length - 1;
            this.currentPlaylistIndex = undefined;
        }
    }

    async next() {
        this.updateIndices(1);
        return await this.play(this.currentIndex);
    }

    async previous() {
        this.updateIndices(-1);
        return await this.play(this.currentIndex);
    }

    addItem(item: QueueItem, index?: number) {
        if (index !== undefined) {
            this.items.splice(index, 0, item);
        } else {
            this.items.push(item);
        }
        const title = (item instanceof CustomSound) ? item.name : (item as Video | Playlist).title || `index ${this.items.length - 1}`;
        this.outputLog(`added "${title}" to queue`);
    }

    removeItem(index: number) {
        if (index < 0 || index >= this.items.length) {
            throw new Error("Index out of bounds");
        }
        const item = this.items[index];
        this.items.splice(index, 1);
        const title = (item instanceof CustomSound) ? item.name : (item as Video | Playlist).title || `index ${index}`;
        this.outputLog(`removed "${title}" from queue`);
    }

    clear() {
        this.items = [];
        this.currentIndex = 0;
        this.currentPlaylistIndex = undefined;
        this.state = QueueState.Idle;
        this.outputLog("queue cleared");
    }

    stop() {
        if (this.voiceManager) {
            this.voiceManager.stop();
        }
        this.state = QueueState.Idle;
        this.outputLog("queue stopped");
    }

    shuffle(excludePlaylists: boolean = false) {
        this.items = shuffleArray(this.items);

        if (!excludePlaylists) {
            for (const item of this.items) {
                if (item instanceof Playlist) {
                    item.videos = shuffleArray(item.videos);
                }
            }
        }
        this.currentIndex = 0;
        this.outputLog("queue shuffled");
    }

    swap(indexA: number, indexB: number) {
        if (indexA < 0 || indexB < 0 || indexA >= this.items.length || indexB >= this.items.length) {
            throw new Error("Index out of bounds");
        }
        const temp = this.items[indexA];
        this.items[indexA] = this.items[indexB];
        this.items[indexB] = temp;
        const titleA = (this.items[indexA] instanceof CustomSound) ? this.items[indexA].name : (this.items[indexA] as Video | Playlist).title || `index ${indexA}`;
        const titleB = (this.items[indexB] instanceof CustomSound) ? this.items[indexB].name : (this.items[indexB] as Video | Playlist).title || `index ${indexB}`;
        this.outputLog(`swapped "${titleA}" with "${titleB}"`);
    }
}