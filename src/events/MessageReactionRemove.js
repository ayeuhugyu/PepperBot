import fs from "fs";
import * as log from "../lib/log.js";
import { Events } from "discord.js";
import * as globals from "../lib/globals.js";

const config = globals.config;
const reaction_roles = globals.reaction_roles;

function collectorFilter(reaction, args) {
    if (reaction.emoji.name === args.emoji) return true;
    if (`<:${reaction.emoji.name}:${reaction.emoji.id}>` === args.emoji)
        return true;
    return false;
}

export default {
    name: Events.MessageReactionRemove,
    async execute(reaction, user) {
        const message = reaction.message;
        try {
            if (!reaction_roles[message.id]) return;
            if (!collectorFilter(reaction, reaction_roles[message.id])) return;
            const member = message.guild.members.cache.get(user.id);
            if (
                member.roles.cache.find(
                    (role) => role.id == reaction_roles[message.id].role
                )
            )
                member.roles.remove(reaction_roles[message.id].role);
        } catch (error) {
            log.error(error);
        }
    },
};
