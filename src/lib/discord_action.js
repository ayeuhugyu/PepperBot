import discord, { CommandInteraction } from "discord.js";
import { client } from "../bot.js";
import * as log from "./log.js";
import * as files from "./files.js";
import fs from "fs";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

export async function fixMsg(msg) {
    const ogMsg = msg;
    if (typeof msg === "string") {
        msg = { content: ogMsg };
    }
    if (msg && !msg.content) {
        msg.content = "";
        msg.deleteContent = true;
    }
    if (msg.content.length == 0) {
        let isEmpty = false;
        if (msg.embeds && msg.embeds.length == 0) {
            msg = { content: "attempt to send an empty message" };
            isEmpty = true;
        } else if (msg.embeds && msg.embeds.length !== 0) {
            isEmpty = false;
        }
        if (msg.attachments && msg.attachments.size == 0) {
            msg = { content: "attempt to send an empty message" };
            isEmpty = true;
        } else if (msg.attachments && msg.attachments.size !== 0) {
            isEmpty = false;
        }
        if (msg.deleteContent) {
            delete msg.content;
            delete msg.deleteContent;
        }
        return msg;
    } // this A: prevents empty message errors, and B prevents this function from attempting to fix attachments (as reading them every time is gonna be stupidly inefficient)
    msg.content = msg.content
        .replaceAll("@everyone", "##potato")
        .replaceAll("@here", "##carrot")
        .replaceAll(process.env.DISCORD_TOKEN, "##pepper")
        .replaceAll(process.env.OPENAI_API_KEY, "##bellpepper")
        .replaceAll(process.env.WEBHOOK_TOKEN, "##onion"); // this prevents the bot from pinging everyone, and from leaking sensitive information
    if (msg.content.length > 2000) {
        let path = await files.textToFile(msg.content, "overflowtext.txt");
        if (!msg.files) {
            msg.files = [];
        }
        msg = {
            content:
                "message exceeded 2000 characters, defaulting to file attachment",
            files: msg.files,
        };
        msg.files.unshift({
            attachment: path,
            name: "overflowtext.txt",
        });
    } // this prevents "message exceeds 2000 characters" errors
    if (msg.deleteContent) {
        delete msg.content;
        delete msg.deleteContent;
    }
    return msg;
}

export async function sendMessage(channel, content) {
    if (!(channel instanceof discord.TextChannel)) {
        channel = await client.channels.fetch(channel.toString());
    }
    try {
        channel.sendTyping();
        const sent = await channel.send(await fixMsg(content)).catch((err) => {
            log.error(err);
        });
        return sent;
    } catch (err) {
        log.error(err);
    }
}

export async function reply(message, content) {
    const channel = message.channel;
    if (!message.channel) {
        log.warn("attempt to reply to a message without a channel");
        return;
    }
    if (!message) {
        log.warn("attempt to reply to a message that does not exist");
        return;
    }
    channel.sendTyping();
    let sent;
    try {
        const msg = await fixMsg(content);
        sent = await message.reply(msg).catch((err) => {
            log.error(err);
        });
        if (!sent && message instanceof CommandInteraction) {
            sent = await message.followUp(msg).catch(() => {});
            if (!sent) {
                sent = await message.editReply(msg).catch(() => {});
            }
        }
        if (!sent) {
            sent = await channel.send(msg).catch(() => {});
        }
        if (!sent) {
            log.error("fully failed to reply to a message");
        }
    } catch (err) {
        log.error("fully failed to reply to a message");
    }
    return sent;
}

export async function sendDM(user, content) {
    try {
        if (!(user instanceof discord.User)) {
            const usersCache = client.users.cache;
            if (typeof user === "number") {
                user = user.toString();
            }
            if (typeof user === "string") {
                user = usersCache.get(user);
            }
        }

        const msg = await user.send(await fixMsg(content)).catch((err) => {
            log.error(err);
        });
        return msg;
    } catch (err) {
        log.error(err);
    }
}

export async function deleteMessage(message) {
    if (message instanceof CommandInteraction) return;
    try {
        if (message.deletable) {
            if (!message) {
                return;
            }
            await message.delete().catch((err) => {
                log.error(err);
            });
        } else {
            log.error("unable to delete message");
        }
    } catch (err) {
        log.error(err);
    }
}

export async function editMessage(message, content) {
    try {
        const sent = await message
            .edit(await fixMsg(content))
            .catch(async (err) => {
                log.error(err);
                await message.editReply(await fixMsg(content)).catch((err) => {
                    log.error(err);
                });
            });
        return sent;
    } catch (err) {
        log.error(err);
    }
}
