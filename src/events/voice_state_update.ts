import { getVoiceConnection } from "@discordjs/voice";
import * as log from "../lib/log.js";
import { VoiceState } from "discord.js";

export default {
    name: "voiceStateUpdate",
    async execute(oldState: VoiceState, newState: VoiceState) {
        log.debug(`voiceStateUpdate event triggered`);
        log.debug(`oldState.channelId: ${oldState.channelId}, newState.channelId: ${newState.channelId}`);

        if (!oldState.channelId) {
            log.debug("no oldState.channelId, returning early.");
            return;
        }
        const guild = oldState.guild;
        log.debug(`guild ID: ${guild.id}`);

        let connection;
        try {
            connection = getVoiceConnection(guild.id);
        } catch (err) {
            log.error(err);
            return;
        }
        if (connection) {
            log.debug(`connection joinConfig.channelId: ${connection.joinConfig.channelId}`);
            if (connection.joinConfig.channelId === oldState.channelId) {
                log.debug("connection is in the same channel as oldState.channelId");
                if (newState.channelId !== undefined) {
                    log.debug("newState.channelId is defined");
                    const membersInChannel = guild.members.cache.filter(
                        (member) =>
                            member.voice.channelId === connection.joinConfig.channelId
                    );
                    log.debug(`members in channel ${connection.joinConfig.channelId}: ${membersInChannel.size}`);
                    if (membersInChannel.size <= 1) {
                        log.debug("only one or fewer members left in the channel, destroying connection.");
                        connection.destroy();
                        log.info(`left ${connection.joinConfig.channelId} due to nobody being in it`);
                    } else {
                        log.debug("more than one member in the channel, not destroying connection.");
                    }
                } else {
                    log.debug("newState.channelId is undefined");
                }
            } else {
                log.debug("connection is not in the same channel as oldState.channelId");
            }
        } else {
            log.debug("no connection found for guild.");
        }
    },
};