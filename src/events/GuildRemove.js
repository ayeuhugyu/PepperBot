import * as log from "../lib/log.js";
import { Events } from "discord.js";
import * as commands from "../register_commands.js"

export default {
    name: Events.GuildCreate,
    async execute(guild) {
        log.info(`left guild: ${guild.name} (${guild.id})`);
        commands.unregister(guild)
    },
};