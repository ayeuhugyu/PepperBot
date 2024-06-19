import * as voice from "@discordjs/voice";
import * as log from "./log.js";

const players = {};

export async function joinVoiceChannel(channel) {
    let connection = await voice.joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });
    if (players[channel.guild.id]) {
        await connection.subscribe(players[channel.guild.id]);
    }
    log.info(`created voice connection to channel ${channel.id}`);
    return connection;
}

export async function leaveVoiceChannel(connection) {
    connection.destroy();
    log.info(`destroyed voice connection ${connection.channelId}`);
}

export async function createAudioResource(path) {
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
    connection.destroy();
    log.info(`destroyed voice connection for guild ${connection.guildId}`);
}
