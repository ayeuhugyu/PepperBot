import { GuildMember, StageChannel, VoiceChannel, VoiceState } from "discord.js";
import * as log from "./log"
import { AudioPlayer, AudioResource, VoiceConnection, joinVoiceChannel as jvc, createAudioResource as createResource, VoiceConnectionState, VoiceConnectionStatus } from "@discordjs/voice";
import fs from "fs";
import { Readable } from "stream";

let voiceManagers: GuildVoiceManager[] = [];

export class GuildVoiceManager {
    guild: string = "";
    channel: VoiceChannel | StageChannel | null = null;
    connection: VoiceConnection | null = null;
    audio_player: AudioPlayer = new AudioPlayer();
    destroyed = false;
    constructor(guild: string) {
        this.guild = guild;
        voiceManagers.push(this);
    }

    private onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        if (
            (oldState.channelId === this.channel?.id) &&
            (newState.channelId !== this.channel?.id) &&
            (this.channel?.members.size === 1) &&
            (this.channel?.members.get(this.channel.client.user.id))
        ) {
            log.info(`leaving voice channel ${this.channel?.id} in guild ${this.guild} due to no members remaining`);
            this.channel.send("no members remain in voice channel; leaving")
            this.destroy();
        }
    }
    setConnection(connection: VoiceConnection) {
        this.connection = connection;
        this.connection.subscribe(this.audio_player);
        this.channel?.client.on('voiceStateUpdate', this.onVoiceStateUpdate.bind(this));
    }
    play(audio: AudioResource) {
        this.audio_player.play(audio);
    }
    stop() {
        this.audio_player.stop();
    }
    destroy() {
        this.audio_player.stop();
        this.connection?.destroy();
        this.connection = null;
        this.channel?.client.off('voiceStateUpdate', this.onVoiceStateUpdate.bind(this));
        this.channel = null;
        this.destroyed = true;
        voiceManagers = voiceManagers.filter(voiceManager => voiceManager.guild !== this.guild);
    }
}

export function getVoiceManager(guildid: string) {
    return voiceManagers.find(voiceManager => voiceManager.guild === guildid);
}

export async function joinVoiceChannel(channel: VoiceChannel | StageChannel) {
    let voiceManager = voiceManagers.find(voiceManager => voiceManager.guild === channel.guild.id);
    if (!voiceManager) {
        voiceManager = new GuildVoiceManager(channel.guild.id);
    }
    voiceManager.channel = channel;
    voiceManager.setConnection(await jvc({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    }));
    log.info(`joined voice channel ${channel.id} in guild ${channel.guild.id}`);
    return voiceManager;
}

export async function leaveVoiceChannel(guildid: string) {
    let voiceManager = voiceManagers.find(voiceManager => voiceManager.guild === guildid);
    if (voiceManager) {
        voiceManager.destroy();
    }
}

export async function createAudioResource(path: string) {
    if (!fs.existsSync(path)) {
        log.warn(`attempted to create audio resource for non-existent file`);
        return;
    }
    const resource: AudioResource | undefined = await createResource(path);
    return resource;
}

export async function createAudioResourceFromBuffer(buffer: Readable) {
    const resource: AudioResource | undefined = createResource(buffer);
    return resource;
}

export function checkMemberPermissionsForVoiceChannel(member: GuildMember, channel: VoiceChannel | StageChannel) {
    if (!member || !channel) {
        return false;
    }
    return member.permissionsIn(channel).has("Speak");
}