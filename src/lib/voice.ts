import { GuildMember, StageChannel, VoiceChannel } from "discord.js";
import * as log from "./log"
import { AudioPlayer, AudioResource, VoiceConnection, joinVoiceChannel as jvc, createAudioResource as createResource } from "@discordjs/voice";
import fs from "fs";

let voiceManagers: GuildVoiceManager[] = [];

export class GuildVoiceManager {
    guild: string = "";
    channel: VoiceChannel | StageChannel | null = null;
    connection: VoiceConnection | null = null;
    audio_player: AudioPlayer = new AudioPlayer();
    constructor(guild: string) {
        this.guild = guild;
        voiceManagers.push(this);
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
    voiceManager.connection = await jvc({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });
    voiceManager.connection.subscribe(voiceManager.audio_player);
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
        log.warn(
            `attempted to create audio resource for non-existent file ${path}`
        );
        return;
    }
    const resource: AudioResource | undefined = await createResource(path);
    log.info(`created audio resource from ${path}`);
    return resource;
}

export function checkMemberPermissionsForVoiceChannel(member: GuildMember, channel: VoiceChannel | StageChannel) {
    if (!member || !channel) {
        return false;
    }
    return member.permissionsIn(channel).has("Speak");
}