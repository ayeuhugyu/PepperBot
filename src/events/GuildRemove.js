import * as log from "../lib/log.js";
import { Events } from "discord.js";

export default {
    name: Events.GuildDelete,
    async execute(guild) {
        log.info(`removed from guild: ${guild.id}`);
    },
};
