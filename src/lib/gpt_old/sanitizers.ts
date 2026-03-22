import { Client, Message } from "discord.js";
import { Conversation } from "./main";
import * as log from "../log";
import { GPTFormattedCommandInteraction } from "./main";

let cached_client: Client | undefined;

export async function sanitizeOutgoingMessageContent(inputContent: string, conversation: Conversation) { // undoes whatever sanitizeIncomingMessageContent does
    const client = cached_client;
    if (!client) {
        throw new Error("Client is not set."); // theoretically this should never be able to happen since for it to send a message you'd need to first input one
    }
    let content = inputContent;

    const mentions = {
        users: content.matchAll(/<@\!?(.*?)>/gm),
        channels: content.matchAll(/\!?<#(.*?)>/gm),
        roles: content.matchAll(/<@&\!?(.*?)>/gm),
    };

    if (mentions.users) {
        for (const mention of mentions.users) {
            try {
                const user = client.users.cache.find(u => u.username === mention[1])
                if (user) {
                    content = content.replaceAll(mention[0], `<@${user.id}>`);
                } else {
                    log.warn(`failed to find user with username ${mention[1]}`);
                }
            } catch {
                log.warn(`failed to find user with username ${mention[1]}`);
            }
        }
    }
    if (mentions.channels) {
        for (const mention of mentions.channels) {
            try {
                const channel = client.channels.cache.find(c => ('name' in c) && (c.name === mention[1]))
                if (channel) {
                    content = content.replaceAll(mention[0], `<#${channel.id}>`);
                } else {
                    log.warn(`failed to find channel with name ${mention[1]}`);
                }
            } catch {
                log.warn(`failed to find channel with name ${mention[1]}`);
            }
        }
    }
    if (mentions.roles) {
        for (const mention of mentions.roles) {
            try {
                const role = client.guilds.cache.find(g => g.roles.cache.find(r => r.name === mention[1]))?.roles.cache.find(r => r.name === mention[1])
                if (role) {
                    content = content.replaceAll(mention[0], `<@&${role.id}>`);
                } else {
                    log.warn(`failed to find role with name ${mention[1]}`);
                }
            } catch {
                log.warn(`failed to find role with name ${mention[1]}`);
            }
        }
    }

    content = content.replaceAll("<@everyone>", "@everyone").replaceAll("<@here>", "@here"); // the handling of these not pinging everyone is done by the action script, dont worry.

    return content;
}

export async function sanitizeIncomingMessageContent(message: Message | GPTFormattedCommandInteraction) {
    cached_client = message.client as Client;
    let content = message.content;
    const mentions = {
        users: content.matchAll(/<@(\d+)>/gm),
        channels: content.matchAll(/<#(\d+)>/gm),
        roles: content.matchAll(/<@&(\d+)>/gm),
    };

    if (mentions.users) {
        for (const mention of mentions.users) {
            try {
                const user = await cached_client.users.fetch(mention[1]);
                if (user) content = content.replaceAll(mention[0], `<@${user.username}>`);
            } catch {}
        }
    }
    if (mentions.channels) {
        for (const mention of mentions.channels) {
            try {
                const channel = await cached_client.channels.fetch(mention[1]);
                if (channel && 'name' in channel) content = content.replaceAll(mention[0], `<#${channel.name}>`);
            } catch {}
        }
    }
    if (mentions.roles) {
        for (const mention of mentions.roles) {
            try {
                const role = await message.guild?.roles.fetch(mention[1]);
                if (role && 'name' in role) content = content.replaceAll(mention[0], `<@&${role.name}>`);
            } catch {}
        }
    }
    content = content.replaceAll("@everyone", "<@everyone>").replaceAll("@here", "<@here>");

    return content;
}