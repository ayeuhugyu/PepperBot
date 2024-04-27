import fs from "fs";
import * as log from "../lib/log.js";
import { Events } from "discord.js";

const configNonDefault = await import("../../config.json", { assert: { type: 'json' }});
const config = configNonDefault.default

const reaction_roles_non_default = await import("../../resources/data/reaction_roles.json", { assert: { type: 'json'}});    
const reaction_roles = reaction_roles_non_default.default

function collectorFilter(reaction, args) {
    if (reaction.emoji.name === args.emoji) return true;
    if (`<:${reaction.emoji.name}:${reaction.emoji.id}>` === args.emoji)
        return true;
    return false;
}

export default {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        const message = reaction.message;
        try {
            if (!reaction_roles[message.id]) return;
            if (!collectorFilter(reaction, reaction_roles[message.id])) return;
            const member = message.guild.members.cache.get(user.id);
            member.roles.add(reaction_roles[message.id].role);
        } catch (error) {
            log.error(error);
        }
    },
};
