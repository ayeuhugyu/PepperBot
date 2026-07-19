import { Client, Role } from "discord.js";
import * as log from "../log";
import { Conversation } from "./conversation";

let client: Client | undefined = undefined;
export function initReplacerClient(inputclient: Client) {
    client = inputclient
}

export async function omitSelfMentions(content: string) {
    return content.replaceAll(new RegExp(` ?<@!?${process.env.DISCORD_OAUTH_CLIENT_ID}>`, "gm"), ""); // TODO: this could be innacurate for things like codeblocks which wouldn't actually mention stuff
}

export async function replaceContentIn(content: string) {
    const mentions = {
        users: content.matchAll(/<@!?(\d+)>/gm),
        channels: content.matchAll(/<#!?(\d+)>/gm),
        roles: content.matchAll(/<@&!?(\d+)>/gm),
        guildEmojis: content.matchAll(/<a?(:\w+:)\d+>/gm),
    };

    if (mentions.users && client) {
        for (const mention of mentions.users) {
            try {
                const user = await client.users.fetch(mention[1]);
                if (user) content = content.replaceAll(mention[0], `<@${user.username}>`);
            } catch {}
        }
    }
    if (mentions.channels && client) {
        for (const mention of mentions.channels) {
            try {
                const channel = await client.channels.fetch(mention[1]);
                if (channel && 'name' in channel) content = content.replaceAll(mention[0], `<#${channel.name}>`);
            } catch {}
        }
    }
    if (mentions.roles && client) {
        for (const mention of mentions.roles) {
            try {
                await client.guilds.fetch();
                const role: Role = (await Promise.all(client.guilds.cache.map(async (g) => {
                    return await g.roles.fetch(mention[0]).catch();
                }))).filter(r => r != undefined)[0];
                if (role && 'name' in role) content = content.replaceAll(mention[0], `<@&${role.name}>`);
            } catch {}
        }
    }
    if (mentions.guildEmojis) {
        for (const mention of mentions.guildEmojis) {
            content = content.replaceAll(mention[0], mention[1]);
        }
    }
    content = content.replaceAll("@everyone", "<@everyone>").replaceAll("@here", "<@here>");

    return content;
}

export async function replaceContentOut(content: string, conversation: Conversation) {
    // if (!client) {
        // throw new Error("client is not set"); // theoretically this should never be able to happen since for it to send a message you'd need to first input one
        // return inputContent; // don't do anything to it, itll eventually be defined
    // }/
    const mentions = {
        users: content.matchAll(/<@\!?(.*?)>/gm),
        channels: content.matchAll(/\!?<#(.*?)>/gm),
        roles: content.matchAll(/<@&\!?(.*?)>/gm),
        emojis: content.matchAll(/<?:([\w]+):>?/gm),
    };

    if (mentions.users && client) {
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

    if (mentions.channels && client) {
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

    const guild = await conversation.fetchGuild();

    if (mentions.roles && client) {
        for (const mention of mentions.roles) {
            try {
                const role = guild?.roles.cache.find(r => r.name === mention[1])
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

    if (mentions.emojis) {
        const mentionMap: Record<string, string> = {};
        for (const mention of mentions.emojis) {
            try {
                const emoji = guild?.emojis.cache.find(e => e.name === mention[1])
                if (emoji) {
                    mentionMap[mention[0]] = `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
                }
            } catch {
                log.warn(`error finding emoji with name ${mention[1]}`);
            }
        }
        Object.entries(mentionMap).forEach(([input, output]) => {
            content = content.replaceAll(input, output);
        });
    }

    content = content.replaceAll("<@everyone>", "@everyone").replaceAll("<@here>", "@here"); // the handling of these not pinging everyone is done by the action script, dont worry.

    return content;
}