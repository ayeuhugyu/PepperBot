import { getVoiceConnection } from "@discordjs/voice";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

export default {
    name: "voiceStateUpdate",
    async execute(oldState, newState) {
        if (!oldState.channelId) {
            return;
        }
        const guild = oldState.guild;

        let connection;
        try {
            connection = getVoiceConnection(guild.id);
        } catch (err) {
            log.error(err);
            return;
        }
        if (connection) {
            if (connection.joinConfig.channelId === oldState.channelId) {
                if (newState.channelId !== undefined) {
                    if (
                        guild.members.cache.filter(
                            (member) =>
                                member.voice.channelId ===
                                connection.joinConfig.channelId
                        ).size <= 1
                    ) {
                        connection.destroy();
                        log.info(
                            `left ${connection.joinConfig.channelId} due to nobody being in it`
                        );
                    }
                }
            }
        }
    },
};
