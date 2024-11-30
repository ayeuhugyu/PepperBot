import * as log from "../lib/log.js";
import { Events } from "discord.js";
import fs from "fs";
import fsExtra from "fs-extra";


function ensureTruebanList(guildID) {
    if (!fs.existsSync(`resources/data/truebans/${guildID}.json`)) {
        fsExtra.ensureFileSync(`resources/data/truebans/${guildID}.json`);
        fs.writeFileSync(`resources/data/truebans/${guildID}.json`, "[]");
    }
}

function getTruebanList(guildID) {
    ensureTruebanList(guildID)
    const truebanList = fs.readFileSync(`resources/data/truebans/${guildID}.json`);
    if (truebanList == "") {
        return [];
    }
    return JSON.parse(truebanList);
}

export default {
    name: Events.GuildBanRemove,
    async execute(ban) {
        const user = ban.user;
        const guild = ban.guild;
        const truebanList = getTruebanList(guild.id);
        if (truebanList.includes(user.id)) {
            log.info(`user ${user.id} (${user.tag}) was unbanned from ${guild.name} (${guild.id}) while being on their trueban list, rebanning...`);
            guild.members.ban(user, { reason: "recursive ban; do not return" });
        }
    },
};
