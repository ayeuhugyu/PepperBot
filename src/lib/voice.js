import * as voice from "@discordjs/voice";
import * as log from "./log.js";
import fs from "fs";

const players = {};

export async function joinVoiceChannel(channel) {
    if (!channel || !channel.type) {
        log.warn(`attempted to join nil or untyped voice channel`);
        return;
    }
    if (channel.type !== 2 && channel.type !== 13) {
        log.warn(`attempted to join non-voice channel`);
        return;
    }
    let connection = await voice.joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });
    if (players[channel.guild.id]) {
        await connection.subscribe(players[channel.guild.id]);
    }
    log.info(`created voice connection to channel ${channel.id}`);
    if (channel.type === 13) {
        channel.guild.members.cache
            .find(
                (member) =>
                    member.id === "1209297323029565470" ||
                    member.id === "1148796261793800303"
            )
            .voice.setSuppressed(false);
        log.info(`forced speaker in stage channel ${channel.id}`);
    }
    return connection;
}

export async function leaveVoiceChannel(connection) {
    if (!connection) {
        log.warn(`attempted to leave nil voice connection`);
        return;
    }
    log.info(`destroyed voice connection ${connection.channelId}`);
    connection.destroy();
}

export async function createAudioResource(path) {
    if (!fs.existsSync(path)) {
        log.warn(
            `attempted to create audio resource for non-existent file ${path}`
        );
        return;
    }
    const resource = await voice.createAudioResource(path, {
        inlineVolume: true,
    });
    log.info(`created audio resource from ${path}`);
    return resource;
}

export async function createAudioPlayer(guildId) {
    if (!players[guildId]) {
        players[guildId] = await voice.createAudioPlayer();
    }
    log.info(`created audio player for guild ${guildId}`);
    return players[guildId];
}

export async function getVoiceConnection(guildId) {
    const player = await voice.getVoiceConnection(guildId);
    log.info(`retrieved voice connection for guild ${guildId}`);
    return player;
}

export async function playResource(resource, player) {
    player.play(resource);
    log.info(`played audio resource for guild ${player.guildId}`);
}

export async function pauseAudioPlayer(player) {
    player.pause();
    log.info(`paused audio player for guild ${player.guildId}`);
}

export async function resumeAudioPlayer(player) {
    player.unpause();
    log.info(`resumed audio player for guild ${player.guildId}`);
}

export async function stopAudioPlayer(player) {
    player.stop();
    log.info(`stopped audio player for guild ${player.guildId}`);
}

export async function setVolume(player, volume) {
    player.setVolume(volume);
    log.info(`set volume for guild ${player.guildId} to ${volume}`);
}

export async function destroyVoiceConnection(connection) {
    return leaveVoiceChannel(connection);
}

export function checkMemberPermissionsForVoiceChannel(member, channel) {
    if (!member || !channel) {
        return false;
    }
    if (channel.type === 2) {
        return member.permissionsIn(channel).has("Connect");
    } else if (channel.type === 13) {
        return member.permissionsIn(channel).has("Speak");
    }
    return false;
}