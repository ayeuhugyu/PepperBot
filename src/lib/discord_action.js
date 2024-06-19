import { CommandInteraction } from "discord.js";
import * as log from "./log.js";
import * as files from "./files.js";
import * as globals from "./globals.js";
import process from "node:process";

const config = globals.config;

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
        .replaceAll(process.env.WEBHOOK_TOKEN, "##onion")
        .replaceAll(process.env.YOUTUBE_API_KEY, "##cucumber")
        .replaceAll(process.env.ADOBE_API_KEY, "##kiwi");
    //.replaceAll(process.env.VISION_KEY, "##tomato") // uncomment when vision key is implemented
    //.replaceAll(process.env.VISION_ENDPOINT, "##starfruit"); // this prevents the bot from pinging everyone, and from leaking sensitive information

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
    try {
        channel.sendTyping();
        log.info(
            `sending message to ${channel.id} with content: ${
                (await fixMsg(content)).content
            }`
        );
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
    if (!(typeof content === "string") && !content.ephemeral)
        channel.sendTyping();
    let sent;
    log.info(
        `replying to ${message.id} with: ${(await fixMsg(content)).content}`
    );
    try {
        const msg = await fixMsg(content);
        if (message.replied) {
            sent = await message.followUp(msg).catch(() => {});
        }
        if (!sent && message.deferred) {
            sent = await message.editReply(msg).catch(() => {});
        }
        if (!sent) {
            sent = await message.reply(msg).catch((err) => {
                log.error(err);
            });
        }
        if (!sent && channel) {
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
    if (!user) {
        log.warn("attempt to dm a user that does not exist");
        return;
    }
    try {
        log.info(
            `sending dm to ${user.id} with content: ${
                (await fixMsg(content)).content
            }`
        );
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
    if (!message) {
        log.warn("attempt to delete a message that does not exist");
        return;
    }
    try {
        if (message.deletable) {
            log.info(`deleting message: ${message.id}`);
            if (!message) {
                log.warn(`message was already deleted`);
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
    if (!message) {
        log.warn("attempt to edit a message that does not exist");
        return;
    }
    try {
        log.info(
            `editing message: ${message.id} with content: ${
                (await fixMsg(content)).content
            }`
        );
        const sent = await message
            .edit(await fixMsg(content))
            .catch(async (err) => {
                log.error(err);
            });
        return sent;
    } catch (err) {
        log.error(err);
    }
}
