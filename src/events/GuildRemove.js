import * as log from "../lib/log.js";
import { Events } from "discord.js";

export default {
    name: Events.GuildCreate,
    async execute(guild) {
        log.info(`left guild: ${guild.name} (${guild.id})`);
    },
};