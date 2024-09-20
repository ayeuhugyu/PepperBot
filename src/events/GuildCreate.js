import * as log from "../lib/log.js";
import { Events } from "discord.js";
import guildConfigs from "../lib/guildConfigs.js";

export default {
    name: Events.GuildCreate,
    async execute(guild) {
        log.info(`joined guild: ${guild.name} (${guild.id})`);
        const gconfig = guildConfigs.getGuildConfig(guild.id);
        if (gconfig && JSON.stringify((Object.values(gconfig).sort())) == JSON.stringify((Object.values(guildConfigs.defaultGuildConfig).sort()))) { // note: may not work with some objects? not entirely sure why not
            log.debug(`new guild config created for (${guild.id})`);
            guildConfigs.createGuildConfig(guild.id);
        } else {
            log.debug(`existing guild config detected for (${guild.id})`);
        }
        console.log(JSON.stringify((Object.values(gconfig).sort())), JSON.stringify((Object.values(guildConfigs.defaultGuildConfig).sort())));
    },
};
