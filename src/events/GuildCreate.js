import * as log from "../lib/log.js";
import { Events } from "discord.js";
import guildConfigs from "../lib/guildConfigs.js";

export default {
    name: Events.GuildCreate,
    async execute(guild) {
        log.info(`joined guild: ${guild.name} (${guild.id})`);
        const gconfig = guildConfigs.getGuildConfig(guild.id);
        if (!gconfig) {
            guildConfigs.createGuildConfig(guild.id);
        }
    },
};
