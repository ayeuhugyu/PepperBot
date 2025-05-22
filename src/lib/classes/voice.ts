import { AudioPlayer, AudioResource, VoiceConnection, VoiceConnectionStatus, joinVoiceChannel } from "@discordjs/voice";
import * as log from "../log";
import { Client, Guild, GuildMember, VoiceBasedChannel } from "discord.js";
import { EventEmitter } from "node:events";

export const VoiceManagers = new Map<string, GuildVoiceManager>();

export class VoiceManagerResponse {
    success: boolean;
    message?: string;

    constructor(success: boolean, message?: string) {
        this.success = success;
        this.message = message;
    }
}

export enum VoiceManagerState {
    Idle = "idle",
    Disconnecting = "disconnecting",
    Disconnected = "disconnected",
    Connecting = "connecting",
    Playing = "playing"
}

export enum VoiceManagerEvent {
    Disconnect = "disconnect",
    Connect = "connect",
    Play = "play",
    Stop = "stop",
    Pause = "pause",
    Unpause = "unpause"
}

export class GuildVoiceManager {
    guild: Guild;
    connected: boolean = false;
    channel: VoiceBasedChannel | undefined = undefined;
    connection: VoiceConnection | undefined = undefined;
    player: AudioPlayer = new AudioPlayer();
    client: Client
    state: VoiceManagerState = VoiceManagerState.Disconnected
    emitter: EventEmitter = new EventEmitter()

    constructor(guild: Guild) {
        this.guild = guild;
        this.client = guild.client;
        VoiceManagers.set(guild.id, this);

        this.player.on('error', (error) => {
            log.error(`audio player error: `, error);
            if (this.channel) {
                this.channel.send(`DISCONNECTING; audio player error: ${error.message}`);
            }
            if (this.connected) {
                this.disconnect();
            }
        });

        log.debug(`created GuildVoiceManager for ${guild.name} (${guild.id})`);
    }

    emit = this.emitter.emit;
    on = this.emitter.on;
    once = this.emitter.once;
    removeAllListeners = this.emitter.removeAllListeners;

    play = (resource: AudioResource) => {
        log.debug(`playing audio in ${this.channel?.name} (${this.channel?.id}) in guild ${this.guild.name} (${this.guild.id})`)
        this.emit(VoiceManagerEvent.Play, resource)
        this.state = VoiceManagerState.Playing
        return this.player.play(resource);
    };
    stop = () => {
        this.emit(VoiceManagerEvent.Stop)
        this.state = VoiceManagerState.Idle
        return this.player.stop();
    }
    pause = () => {
        this.emit(VoiceManagerEvent.Pause)
        this.state = VoiceManagerState.Idle
        return this.player.pause();
    }
    unpause = () => {
        this.emit(VoiceManagerEvent.Unpause)
        const unpaused = this.player.unpause()
        if (unpaused) {
            this.state = VoiceManagerState.Playing
        }
        return unpaused
    }

    linkEvents = () => {
        if (!this.connected) {
            log.debug(`attempt to link events for a voice manager which was not already connected`);
            return new VoiceManagerResponse(false, `attempt to link events for a voice manager which was not already connected`);
        }

        this.connection?.on('stateChange', (oldState, newState) => {
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                log.debug(`voice connection disconnected by context menu for ${this.guild.name} (${this.guild.id}); removing connections`)
                this.disconnect(); // this prevents a mismatch between the guild voice manager and the actual connection if people manually disconnect it using discord's context menu
            }
        });
    }

    disconnect() { // set state to disconnecting, pause audio player, destroy voice connection, emit disconnect and then set state to disconnected
        try {
            if (!this.connected) {
                log.debug(`attempt to disconnect a connection for a voice manager which was not already connected`);
                return new VoiceManagerResponse(false, `attempt to disconnect a voice manager which was not already connected`);
            }
            this.state = VoiceManagerState.Disconnecting
            log.debug(`disconnecting voice connection for a voice manager in ${this.channel?.name} (${this.channel?.id}) in guild ${this.guild.name} (${this.guild.id})`)
            this.connected = false;
            this.player.pause()
            this.connection?.removeAllListeners();
            this.connection?.destroy()
            this.connection = undefined;
            const channel = this.channel;
            this.channel = undefined;
            this.emit(VoiceManagerEvent.Disconnect, channel)
            this.state = VoiceManagerState.Disconnected;
            return new VoiceManagerResponse(true)
        } catch (e) {
            log.debug(`caught error while disconnecting from channel ${this.channel?.name} (${this.channel?.id}) for GuildVoiceManager`)
            log.error(e)
            return new VoiceManagerResponse(false, e as string)
        }
    }

    connect(channel: VoiceBasedChannel) {
        try {
            this.state = VoiceManagerState.Connecting
            if (!this.guild.members.me?.permissions.has('Connect') || !this.guild.members.me?.permissions.has('Speak') || !channel.joinable) {
                log.debug(`attempt to join channel with missing permissions to join/speak for #${channel.name} (${channel.id})`)
                return new VoiceManagerResponse(false, `missing permissions to join/speak in <#${channel.id}>`)
            }
            if (this.connected) {
                const response = this.disconnect();
                if (!response.success) {
                    return new VoiceManagerResponse(false, response.message)
                }
            }
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: this.guild.id,
                adapterCreator: this.guild.voiceAdapterCreator,
                selfMute: false,
                selfDeaf: false,
            });

            this.connection = connection;
            this.connection.subscribe(this.player);
            this.channel = channel;
            this.connected = true;
            this.linkEvents();
            this.emit(VoiceManagerEvent.Connect, channel)
            this.state = VoiceManagerState.Idle;
            return new VoiceManagerResponse(true)
        } catch (e) {
            log.debug(`caught error while connecting to channel ${channel.name} (${channel.id}) for GuildVoiceManager`)
            log.error(e)
            return new VoiceManagerResponse(false, e as string)
        }
    }
}

export function checkMemberPermissionsForVoiceChannel(member: GuildMember, channel: VoiceBasedChannel) {
    if (!member || !channel) {
        return false;
    }
    log.debug(`checking voice permissions for member ${member.user.username} (${member.id}) in channel ${channel.name} (${channel.id})`)
    return member.permissionsIn(channel).has("Speak");
}

export function getVoiceManager(guild: Guild) {
    let manager = VoiceManagers.get(guild.id)
    if (!manager) {
        manager = new GuildVoiceManager(guild)
    }
    return manager;
}