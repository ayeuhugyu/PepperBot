import { CommandInteraction } from "discord.js";
import * as log from "./log.js";
import * as files from "./files.js";
import * as globals from "./globals.js";
import process from "node:process";
import commonRegex from "./commonRegex.js";
import * as util from "util";

const config = globals.config;

export async function fixMsg(msg) {
    let ogMsg = msg;
    msg = { ...msg };
    if (typeof ogMsg === "string") {
        msg = { content: ogMsg };
    }
    if (msg.bypassFixer === true) {
        return msg;
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
    const roleRegex = commonRegex.discord.role;
    msg.content = msg.content
        .replaceAll("@everyone", "Mister Everyone")
        .replaceAll("@here", "Mister Here")
        .replaceAll(process.env.DISCORD_TOKEN, "##pepper")
        .replaceAll(process.env.OPENAI_API_KEY, "##bellpepper")
        .replaceAll(process.env.WEBHOOK_TOKEN, "##onion")
        .replaceAll(process.env.YOUTUBE_API_KEY, "##cucumber")
        .replaceAll(process.env.ADOBE_API_KEY, "##kiwi");
    if (msg.content.match(roleRegex)) {
        msg.content = msg.content.replaceAll(roleRegex, "Mister Role");
    }

    //.replaceAll(process.env.VISION_KEY, "##tomato") // uncomment when vision key is implemented
    //.replaceAll(process.env.VISION_ENDPOINT, "##starfruit"); // this prevents the bot from pinging everyone, and from leaking sensitive information

    if (msg.content.length > 2000) {
        let path = await files.textToFile(msg.content, "overflowtext");
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
        if (!channel) {
            log.warn("attempt to send a message to a channel that does not exist");
            return;
        }
        const fixed = await fixMsg(content);
        const firstNewlineIndex = fixed.content ? fixed.content.indexOf('\n') : -1;
        const logsliced = firstNewlineIndex !== -1 ? fixed.content.slice(0, firstNewlineIndex) : fixed.content;
        log.debug(`sending message to ${channel.id} with ${fixed.content ? `content: ${logsliced}` : "no content; embed/attachment only"}`);
        const sent = await channel.send(fixed).catch((err) => {
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
        log.warn("replying to a message without a channel");
    }
    if (!message) {
        log.warn("attempt to reply to a message that does not exist");
        return;
    }
    let sent;
    const fixed = await fixMsg(content);
    const firstNewlineIndex = fixed.content ? fixed.content.indexOf('\n') : -1;
    const logsliced = firstNewlineIndex !== -1 ? fixed.content.slice(0, firstNewlineIndex) : fixed.content;
    log.debug(`replying to ${message.id} with ${fixed.content ? `content: ${logsliced}` : "no content; embed/attachment only"}`);
    try {
        if (message.replied) {
            sent = await message.followUp(fixed).catch(() => {});
        }
        if (!sent && message.deferred) {
            sent = await message.editReply(fixed).catch(() => {});
        }
        if (!sent) {
            sent = await message.reply(fixed).catch((err) => {
                log.error(err);
            });
        }
        if (!sent && channel) {
            sent = await channel.send(fixed).catch(() => {});
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
        const fixed = await fixMsg(content);
        const firstNewlineIndex = fixed.content ? fixed.content.indexOf('\n') : -1;
        const logsliced = firstNewlineIndex !== -1 ? fixed.content.slice(0, firstNewlineIndex) : fixed.content;
        log.debug(`sending dm to ${user.id} with ${fixed.content ? `content: ${logsliced}` : "no content; embed/attachment only"}`);
        const msg = await user.send(fixed).catch((err) => {
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
            log.debug(`deleting message: ${message.id}`);
            if (!message) {
                log.warn(`message was already deleted`);
                return;
            }
            await message.delete().catch((err) => {
                log.error(err);
            });
        } else {
            log.warn("unable to delete message; message is not deletable");
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
        const fixed = await fixMsg(content);
        const firstNewlineIndex = fixed.content ? fixed.content.indexOf('\n') : -1;
        const logsliced = firstNewlineIndex !== -1 ? fixed.content.slice(0, firstNewlineIndex) : fixed.content;
        log.debug(`editing message: ${message.id} with ${fixed.content ? `content: ${logsliced}` : "no content; embed/attachment only"}`);
        const sent = await message
            .edit(fixed)
            .catch(async (err) => {
                log.error(err);
            });
        return sent;
    } catch (err) {
        log.error(err);
    }
}

export async function editInteractionReply(interaction, content) {
    if (!interaction) {
        log.warn("attempt to edit a message that does not exist");
        return;
    }
    try {
        const fixed = await fixMsg(content);
        const firstNewlineIndex = fixed.content ? fixed.content.indexOf('\n') : -1;
        const logsliced = firstNewlineIndex !== -1 ? fixed.content.slice(0, firstNewlineIndex) : fixed.content;
        log.debug(`editing message: ${interaction.id} with ${fixed.content ? `content: ${logsliced}` : "no content; embed/attachment only"}`);
        const sent = await interaction
            .editReply(fixed)
            .catch(async (err) => {
                log.error(err);
            });
        return sent;
    } catch (err) {
        log.error(err);
    }
}

export async function messageReact(message, reaction) {
    if (message) {
        message.react(reaction);
    }
}