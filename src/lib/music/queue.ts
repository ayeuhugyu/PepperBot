import { AnyComponent, Guild, Message, MessageFlags, VoiceBasedChannel } from "discord.js";
import { GuildVoiceManager, VoiceEventListener, VoiceManagerEvent, getVoiceManager } from "../classes/voice";
import { Playlist, Video } from "./media";
import { downloadMedia } from "../downloaders";
import * as action from "../discord_action";
import { DownloadedVideo } from "../downloaders/base";
import { createAudioResource } from "@discordjs/voice";
import { CustomSound } from "../custom_sound_manager";
import { Container, ContainerComponent, TextDisplay } from "../classes/components";
import { embedVideoOrSound } from "./embed";
import * as log from "../log";
import fs from "fs";
import EventEmitter from "events";

export enum QueueState {
    Playing = "playing",
    Waiting = "waiting",
    Downloading = "downloading",
    StartingPlayer = "starting_player",
    Idle = "idle",
}

function shuffleArray<T>(array: T[]): T[] {
    log.debug("Shuffling array", array);
    return array
        .map((item) => ({ item, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ item }) => item);
}

// Only Video or CustomSound now
type QueueItem = Video | CustomSound;

let queues = new Map<string, QueueManager>();

export function getQueue(guild: Guild): QueueManager {
    log.debug("getQueue called for guild", guild.id);
    const queue = queues.get(guild.id);
    if (!queue) {
        log.debug("No queue found, creating new QueueManager");
        const voiceManager = getVoiceManager(guild);
        return new QueueManager(voiceManager);
    }
    log.debug("Returning existing queue");
    return queue;
}

function textComponentify(text: string) {
    log.debug("textComponentify called with text:", text);
    return new TextDisplay({
        content: text,
    });
}

function wrapInContainer(components: ContainerComponent) {
    log.debug("wrapInContainer called");
    return new Container({
        components: [components],
    })
}

export class QueueManager implements VoiceEventListener {
    items: QueueItem[] = [];
    currentIndex: number = 0;
    voiceManager: GuildVoiceManager | undefined = undefined;
    state: QueueState = QueueState.Idle;
    channel: VoiceBasedChannel | undefined = undefined;
    silent: boolean = false;
    lastSentLog: Message<true> | undefined = undefined;
    guild: GuildVoiceManager["guild"];
    emitter: EventEmitter = new EventEmitter();

    constructor(voiceManager: GuildVoiceManager) {
        log.debug("QueueManager constructor called", voiceManager.guild.id);
        this.voiceManager = voiceManager;
        this.channel = voiceManager.channel;
        this.guild = voiceManager.guild;
        this.voiceManager.addListener(this);
        this.voiceManager.on(VoiceManagerEvent.Disconnect, () => {
            log.debug("VoiceManagerEvent.Disconnect triggered");
            this.state = QueueState.Idle;
            this.stop();
            this.outputLog("disconnected from voice channel");
            this.channel = undefined;
        });
        queues.set(voiceManager.guild.id, this);
    }

    async onVoiceStop() {
        log.debug("onVoiceStop called, state:", this.state);
        if (this.state === QueueState.Playing) {
            this.state = QueueState.Waiting; // this weird thing avoids rapidfire of next() calls
            // there is probably a better way to do this but i dont fucking care anymore this issue is fucking awful and annoying to debug
            await new Promise(resolve => setTimeout(resolve, 500));
            if (this.state === QueueState.Waiting) {
                this.state = QueueState.Idle;
                this.next();
            }
        }
    }

    async outputError(message: string) {
        log.debug("outputError called:", message);
        if (!this.channel) {
            log.error(`attempt to use outputError while channel is not set; log: ${message}`);
            return;
        }
        log.error(message);
        (await action.send(this.channel, `> **[ERROR]:** ${message}`)) as Message<true>;
        // dont set lastSentLog since this is an error message, dont want that being overwritten with something else
    }

    async outputLog(message: string) {
        log.debug("outputLog called:", message, "silent:", this.silent, "channel:", !!this.channel);
        if (this.silent) {
            return;
        }
        if (!this.channel) {
            log.error(`attempt to use outputLog while channel is not set; log: ${message}`);
            return;
        }
        this.lastSentLog = (await action.send(this.channel, `> ${message}`)) as Message<true>;
    }

    async outputComponentsLog(components: (action.ApiMessageComponents | action.TopLevelComponent)[]) {
        log.debug("outputComponentsLog called", components, "silent:", this.silent, "channel:", !!this.channel);
        if (this.silent) {
            return;
        }
        if (!this.channel) {
            log.error(`attempt to use outputComponentsLog while channel is not set; log: ${components}`);
            return;
        }
        return (await action.send(this.channel, { components, flags: MessageFlags.IsComponentsV2 })) as Message<true>;
        // do not set lastSentLog to this since editLastLog will break, discord errors if you try to edit content of a message with components_v2
    }

    async editLastLog(message: string) {
        log.debug("editLastLog called:", message, "silent:", this.silent, "lastSentLog:", !!this.lastSentLog);
        if (this.silent) {
            return;
        }
        if (!this.lastSentLog) {
            log.error(`attempt to use editLastLog while lastSentLog is undefined; log: ${message}`);
            return;
        }
        await action.edit(this.lastSentLog, `> ${message}`);
    }

    async playVideo(inputVideo: Video) {
        log.debug("playVideo called", inputVideo, "state:", this.state);
        if (!this.voiceManager) {
            this.outputError("attempt to play a video while voice manager is not set");
            return;
        }
        if (!this.voiceManager.connection) {
            this.outputError("attempt to play a video while voice connection is not established");
            return;
        }
        // Ensure player is stopped before playing new resource
        if (this.voiceManager.player && typeof this.voiceManager.player.stop === 'function') {
            log.debug("Stopping audio player before playing new resource");
            this.voiceManager.player.stop();
        }
        let downloadedVideo: DownloadedVideo
        if (!inputVideo.filePath && !(this.state === QueueState.Downloading)) {
            log.debug("Downloading video", inputVideo.title);
            this.state = QueueState.Downloading;
            this.outputLog(`downloading \`${inputVideo.title}\`...`);
            const logFunc = this.outputLog.bind(this);
            const editLatest = this.editLastLog.bind(this);
            const output = await downloadMedia(inputVideo, logFunc, editLatest)
            if (!output) {
                log.debug("Failed to download video", inputVideo.title);
                this.outputError("failed to download video, skipping...");
                this.next();
                return;
            }
            this.lastSentLog = undefined;
            downloadedVideo = output;
            this.items[this.currentIndex] = downloadedVideo as Video;
        } else if (!(this.state === QueueState.Downloading)) {
            log.debug("Video already downloaded or not downloading", inputVideo.title);
            downloadedVideo = inputVideo as DownloadedVideo;
        } else {
            log.debug("Already downloading, aborting playVideo");
            this.outputError("attempt to play a video while already downloading");
            return;
        }
        const video = downloadedVideo as DownloadedVideo

        if (!video) {
            log.debug("Downloaded video is undefined/null", inputVideo.title);
            this.outputError("failed to download video, skipping...");
            this.next();
            return;
        }

        const audioResource = createAudioResource(video.filePath)
        this.outputComponentsLog([textComponentify(`> playing \`${video.title}\`...`), wrapInContainer(embedVideoOrSound(video, true, this.currentIndex))]);
        this.voiceManager.play(audioResource);
        this.state = QueueState.Playing;
        this.emitter.emit("refresh");
    }

    async playCustomSound(sound: CustomSound) {
        log.debug("playCustomSound called", sound, "state:", this.state);
        if (!this.voiceManager) {
            this.outputError("attempt to play a custom sound while voice manager is not set");
            return;
        }
        if (!this.voiceManager.connection) {
            this.outputError("attempt to play a custom sound while voice connection is not established");
            return;
        }
        // Debug: check file path existence
        try {
            const fs = require('fs');
            log.debug("Creating audio resource for custom sound", sound.path, "exists:", fs.existsSync(sound.path));
        } catch (e) {
            log.debug("fs.existsSync failed", e);
        }
        const audioResource = createAudioResource(sound.path);
        this.outputComponentsLog([textComponentify(`> playing \`${sound.name}\`...`), wrapInContainer(embedVideoOrSound(sound, true, this.currentIndex))]);
        this.voiceManager.play(audioResource);
        this.state = QueueState.Playing;
        this.emitter.emit("refresh");
    }

    async play(index?: number) {
        log.debug("play called", "index:", index, "state:", this.state, "currentIndex:", this.currentIndex, "items.length:", this.items.length);
        if (this.state !== QueueState.Playing && this.state !== QueueState.Idle) {
            this.outputError("attempt to play an item while queue is not idle or playing");
            return;
        }
        this.state = QueueState.StartingPlayer;
        const currentItem = this.items[index ?? this.currentIndex];
        log.debug("Current item to play:", currentItem);
        if (!currentItem) {
            this.outputError("attempt to play an item which does not exist");
            return;
        }
        if (currentItem instanceof CustomSound) {
            log.debug("Current item is CustomSound");
            return await this.playCustomSound(currentItem as CustomSound);
        } else {
            log.debug("Current item is Video");
            return await this.playVideo(currentItem as Video);
        }
    }

    private async updateIndices(direction: number) {
        log.debug("updateIndices called", "direction:", direction, "currentIndex before:", this.currentIndex, "items.length:", this.items.length);
        this.currentIndex += direction;
        if (this.currentIndex >= this.items.length) {
            this.currentIndex = 0;
            this.outputLog("reached end of queue");
            return;
        } else if (this.currentIndex < 0) {
            this.currentIndex = this.items.length - 1;
            this.outputLog("reached start of queue");
            return;
        }
        log.debug("Current index after update:", this.currentIndex);
    }

    async next(amount: number = 1, isSkipping: boolean = false) {
        log.debug("next called", "amount:", amount);
        this.updateIndices(amount);
        return await this.play(this.currentIndex);
    }

    async previous(amount: number = 1) {
        log.debug("previous called", "amount:", amount);
        this.updateIndices(-amount);
        return await this.play(this.currentIndex);
    }

    addItem(item: QueueItem | Playlist, index?: number) {
        log.debug("addItem called", item, "index:", index);
        if ((item instanceof CustomSound) || (item instanceof Video)) {
            if (index !== undefined) {
                log.debug("Inserting item at index", index);
                this.items.splice(index, 0, item as QueueItem);
            } else {
                log.debug("Pushing item to end of queue");
                this.items.push(item as QueueItem);
            }
            const title = (item instanceof CustomSound) ? item.name : (item as Video).title || `index ${this.items.length - 1}`;
            this.outputComponentsLog([textComponentify(`> added \`${title}\` to queue`), wrapInContainer(embedVideoOrSound(item, false, index ?? this.items.length - 1))]);
        } else if (item instanceof Playlist) {
            log.debug("Adding playlist to queue", item.title, "videos:", item.videos.length, "index:", index);
            const playlist = item as Playlist;
            const insertAt = index ?? this.items.length;
            this.items.splice(insertAt, 0, ...playlist.videos);
            this.outputComponentsLog([textComponentify(`> added playlist \`${playlist.title}\` (${playlist.videos.length} items) to queue`), wrapInContainer(embedVideoOrSound(playlist, true, insertAt))]);
        } else {
            log.debug("Invalid item type in addItem", item);
            this.outputError("attempt to add an item with an invalid item type");
            return;
        }
        this.emitter.emit("refresh");
    }

    removeItem(index: number, endIndex?: number) {
        log.debug("removeItem called", "index:", index, "endIndex:", endIndex, "items.length:", this.items.length);
        if (index < 0 || index >= this.items.length) {
            this.outputError("attempt to remove item using index which is out of bounds");
            return;
        }

        if (endIndex !== undefined) {
            // Remove a range of items
            if (endIndex < index || endIndex >= this.items.length) {
                this.outputError("attempt to remove items using invalid endIndex");
                return;
            }
            const count = endIndex - index + 1;
            const removedItems = this.items.splice(index, count);
            // Helper to format removed item titles with "and" for the last item
            function formatTitles(items: QueueItem[], startIndex: number) {
                if (items.length === 1) {
                    return `\`${(items[0] instanceof CustomSound) ? items[0].name : (items[0] as Video).title || `index ${startIndex}`}\``;
                } else if (items.length === 2) {
                    const first = (items[0] instanceof CustomSound) ? items[0].name : (items[0] as Video).title || `index ${startIndex}`;
                    const second = (items[1] instanceof CustomSound) ? items[1].name : (items[1] as Video).title || `index ${startIndex + 1}`;
                    return `\`${first}\` and \`${second}\``;
                } else {
                    const names = items.map((item, i) =>
                        (item instanceof CustomSound) ? item.name : (item as Video).title || `index ${startIndex + i}`
                    );
                    const last = names.pop();
                    return `\`${names.join("`, `")}\`, and \`${last}\``;
                }
            }

            if (count > 15) {
                // Show only the count of removed items.
                this.outputLog(`removed ${count} items from queue`);
            } else if (count > 3) {
                // Show the titles of each removed item, but not the summary
                const titles = formatTitles(removedItems, index);
                this.outputLog(`removed ${count} items from queue: ${titles}`);
            } else {
                // Show summary and then each removed item in its own container
                const titles = formatTitles(removedItems, index);
                const components: (action.ApiMessageComponents | action.TopLevelComponent)[] = [
                    textComponentify(`> removed ${titles} from queue`),
                    ...removedItems.map((item, i) =>
                        wrapInContainer(embedVideoOrSound(item, true, index + i))
                    )
                ];
                this.outputComponentsLog(components);
            }
        } else {
            // Remove a single item
            const item = this.items[index];
            this.items.splice(index, 1);
            const title = (item instanceof CustomSound) ? item.name : (item as Video).title || `index ${index}`;
            this.outputComponentsLog([
                textComponentify(`> removed ${title} from queue`),
                wrapInContainer(embedVideoOrSound(item, true, index))
            ]);
        }
        this.emitter.emit("refresh");
    }

    clear() {
        log.debug("clear called", "items.length before:", this.items.length);
        const itemCount = this.items.length;
        this.items = [];
        this.currentIndex = 0;
        this.state = QueueState.Idle;
        this.outputLog("queue cleared, removed " + itemCount + " items");
        log.debug("Queue after clear:", this.items);
        this.emitter.emit("refresh");
    }

    stop() {
        log.debug("stop called");
        if (this.voiceManager) {
            this.voiceManager.stop();
        }
        this.state = QueueState.Idle;
        this.outputLog("queue stopped");
        this.emitter.emit("refresh");
    }

    shuffle() {
        log.debug("shuffle called", "items before:", this.items);
        this.items = shuffleArray(this.items);
        this.currentIndex = 0;
        this.outputLog("queue shuffled");
        log.debug("items after shuffle:", this.items);
        this.emitter.emit("refresh");
    }

    swap(indexA: number, indexB: number) {
        log.debug("swap called", "indexA:", indexA, "indexB:", indexB, "items.length:", this.items.length);
        if (indexA < 0 || indexB < 0 || indexA >= this.items.length || indexB >= this.items.length) {
            this.outputError("attempt to swap items using index which is out of bounds");
            return;
        }
        const temp = this.items[indexA];
        this.items[indexA] = this.items[indexB];
        this.items[indexB] = temp;
        const titleA = (this.items[indexA] instanceof CustomSound) ? this.items[indexA].name : (this.items[indexA] as Video).title || `index ${indexA}`;
        const titleB = (this.items[indexB] instanceof CustomSound) ? this.items[indexB].name : (this.items[indexB] as Video).title || `index ${indexB}`;
        this.outputComponentsLog([
            textComponentify(`> swapped \`${titleA}\` and \`${titleB}\``),
            wrapInContainer(embedVideoOrSound(this.items[indexA], true, indexA)),
            wrapInContainer(embedVideoOrSound(this.items[indexB], true, indexB)),
        ]);
        log.debug("Queue after swap:", this.items);
        this.emitter.emit("refresh");
    }

    silence() {
        log.debug("silence called", "silent before:", this.silent);
        if (!this.silent) {
            this.outputLog("silent queue enabled, no more logs will be sent");
        }
        this.silent = !this.silent;
        if (!this.silent) {
            this.outputLog("silent queue disabled, logs will be sent again");
        }
        log.debug("silent after:", this.silent);
    }
}
