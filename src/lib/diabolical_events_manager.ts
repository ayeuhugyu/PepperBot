import { Message } from "discord.js";
import { MessageInput } from "./discord_action";
import { fetchGuildConfig } from "./guild_config_manager";
import * as log from "./log";
import { AIReaction } from "./gpt/basic";
import { readFileSync } from "fs";
import * as action from "./discord_action";

enum DiabolicalEventType {
    Reaction = "reaction",
    Reply = "reply",
    Thread = "thread",
}

export const chances = {
    [DiabolicalEventType.Reaction]: 0.01, // 1% chancew
    [DiabolicalEventType.Reply]: 0.005, // 0.5% chance
    [DiabolicalEventType.Thread]: 0.0005, // 0.05% chance
}

export interface ReplyBasedDiabolicalEvent {
    name: string;
    message: Partial<MessageInput> | string
}

export const ReplyEvents: ReplyBasedDiabolicalEvent[] = [
    {
        name: "Big Berry Adventure",
        message: {
            content: "It's time to go on a ***big berry adventure!***",
            files: [
                {
                    attachment: "constants/media/big_berry_adventure.png",
                    name: "big_berry_adventure.png"
                }
            ]
        }
    },
    {
        name: "Egglord",
        message: {
            content: "It's glorious!",
            files: [
                {
                    attachment: "constants/media/egglord.png",
                    name: "egglord.png"
                }
            ]
        }
    },
    {
        name: "Awkward Reaction",
        message: {
            content: "😬",
            files: [
                {
                    attachment: "constants/media/v12044gd0000cr1r5nfog65q7ovkq53g.mov",
                    name: "v12044gd0000cr1r5nfog65q7ovkq53g.mov"
                }
            ]
        }
    },
    {
        name: "Spicy Conversation",
        message: {
            content: "This conversation is getting a little spicy!!",
            files: [
                {
                    attachment: "constants/media/MisterPepper.png",
                    name: "MisterPepper.png"
                }
            ]
        }
    },
    {
        name: "Monster Reference",
        message: "Monster (2004)"
    },
    {
        name: "Jackson's Message",
        message: "Hello Gang'\nThis is Jackson from b robux\nDragon Snake driver ########\nspeaking"
    },
    {
        name: "Birthday Wish",
        message: "Happy birthday <@694850919032160316>!"
    }
];

export async function messageFilter(message: Message) {
    const gconfig = await fetchGuildConfig(message.guildId || undefined);
    const prefix = gconfig.prefix
    const conditions = [
        message.author.bot,
        message.content.toLowerCase().startsWith(prefix.toLowerCase()),
        gconfig.disableDiabolicalEvents,
        gconfig.diabolicalEventBlacklistedChannelIds.includes(message.channel.id)
    ]
    return conditions.some(condition => condition === true);
} // if true, return. if false, continue

export async function getEvent(message: Message) {
    const guildConfig = await fetchGuildConfig(message.guildId || undefined);
    const seed = Math.random();
    let usedChances = chances;
    if (guildConfig) {
        usedChances = {
            thread: guildConfig.diabolicalThreadEventChance,
            reply: guildConfig.diabolicalReplyEventChance,
            reaction: guildConfig.diabolicalReactionEventChance
        }
    }
    if (seed < usedChances.thread) {
        return DiabolicalEventType.Thread;
    } else if (seed < usedChances.thread + usedChances.reply) {
        return DiabolicalEventType.Reply;
    } else if (seed < usedChances.thread + usedChances.reply + usedChances.reaction) {
        return DiabolicalEventType.Reaction;
    } else {
        return null;
    }
}

export function threadEvent(message: Message) {
    // ensure bot has permissions to create threads and send messages and send messages in threads
    if (!message.guild?.members.me?.permissions.has("CreatePublicThreads") || !message.guild?.members.me?.permissions.has("SendMessages") || !message.guild?.members.me?.permissions.has("SendMessagesInThreads")) {
        log.warn(`could not complete diabolical thread event due to lack of permissions in #${message.channel?.id})`);
        return;
    }
    if (message.startThread) {
        if (message.channel && (message.channel.type === 0 || message.channel.type === 5)) {
            message.startThread({
                    name: "Threaded! 🧵",
                    autoArchiveDuration: 60,
                    reason: "It's quite diabolical.",
                }).then((thread) => {
                    action.send(thread, "You've just been threaded! 🧵");
                }).catch((err) => {
                    log.error(`failed to start thread on message ${message.id} in ${message.channel.id}`);
                    log.error(err);
                });
        } else {
            log.warn("could not start thread on message due to channel type");
            return;
        }
    }
}

export async function replyEvent(message: Message) {
    // ensure bot has permissions to send messages and attach files
    if (!message.guild?.members.me?.permissions.has("SendMessages") || !message.guild?.members.me?.permissions.has("AttachFiles")) {
        log.warn(`could not complete diabolical reply event due to lack of permissions in #${message.channel?.id})`);
        return;
    }
    const event = ReplyEvents[Math.floor(Math.random() * ReplyEvents.length)];
    const replyMessage = event.message;
    if (typeof replyMessage === "string") {
        await action.reply(message as Message<true>, replyMessage).catch((err) => {
            log.error(`failed to reply to message ${message.id} in channel ${message.channel.id}`);
            log.error(err);
        });
    } else {
        await action.reply(message as Message<true>, replyMessage).catch((err) => {
            log.error(`failed to reply to message ${message.id} in channel ${message.channel.id}`);
            log.error(err);
        });
    }
}

const emojis = JSON.parse(readFileSync("constants/emojis.json", "utf-8"));

export function getRandomEmoji(): string {
    return emojis[Math.floor(Math.random() * emojis.length)];
}

export async function reactionEvent(message: Message) {
    if (!message.guild?.members.me?.permissions.has("AddReactions")) {
        log.warn(`could not complete diabolical reaction event due to lack of permissions in ${message.channel?.id})`);
        return;
    }
    const messageContent = message.cleanContent;
    let AIEmoji = await AIReaction(messageContent);
    if (!AIEmoji) {
        AIEmoji = await getRandomEmoji()
    }
    log.info(`diabolical emoji event triggered with AI emojis: ${AIEmoji} on ${message.id}`);
    let AIReactions = AIEmoji!.split(',');
    AIReactions.forEach(async (emoji) => {
        try {
            await message.react(emoji);
        } catch (err) {
            log.warn(`could not react to message with AI emoji. AI emoji: ${emoji}`);
        }
    });
}

export function getDiabolicalEventFunction(event: DiabolicalEventType) {
    switch (event) {
        case DiabolicalEventType.Reaction:
            return reactionEvent;
        case DiabolicalEventType.Reply:
            return replyEvent;
        case DiabolicalEventType.Thread:
            return threadEvent;
        default:
            throw new Error("Invalid diabolical event type");
    }
}

export async function handleDiabolicalEvent(message: Message) {
    const event = await getEvent(message);
    if (event) {
        const eventFunction = getDiabolicalEventFunction(event);
        await eventFunction(message);
    }
}