import guildConfigs from './guildConfigs.js';
import * as globals from './globals.js';
import * as log from './log.js';
import * as action from "./discord_action.js";
import { AIReaction, fixIncomingMessage, AIDiabolicReply } from './gpt.js';

export const eventChances = { // defaults
    'thread': 0.0005, // 0.05% chance
    'reply': 0.005, // 0.5% chance
    'reaction': 0.01, // 1% chance
}

const replyEvents = globals.diabolical_events

export function messageFilter(message) {
    const gconfig = guildConfigs.getGuildConfig(message.guild.id);
    const prefix = gconfig.prefix
    const conditions = [
        message.author.bot,
        message.content.toLowerCase().startsWith(prefix.toLowerCase()),
        gconfig.disableDiabolicalEvents,
        gconfig.diabolicalEventBlacklistedChannelIds.includes(message.channel.id)
    ]
    return conditions.some(condition => condition === true);
} // if true, return. if false, continue

export function getReplyEvent() {
    const event = replyEvents[Math.floor(Math.random() * replyEvents.length)];
    return event;
}

export function getRandomEmoji() {
    const emojis = globals.emojis;
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    return emoji;
}

export function threadEvent(message) {
    if (message.startThread) {
        if (message.channel && (message.channel.type === 0 || message.channel.type === 5)) {
            message.startThread({
                    name: "Threaded! 🧵",
                    autoArchiveDuration: 60,
                    reason: "It's quite diabolical.",
                }).then((thread) => {
                    thread.send("You've just been threaded! 🧵");
                });
        } else {
            log.warn("could not start thread on message due to channel type");
            return;
        }
    }
}

export async function replyEvent(message) {
    const messageContent = await fixIncomingMessage(message);
    const replyEvent = await AIDiabolicReply(messageContent);
    log.info(`diabolical reply event triggered with AI response: ${replyEvent} ${message.id} with content: ${messageContent}`);
    const event = replyEvents[replyEvent] || getReplyEvent();
    action.reply(message, event);
}

export async function reactionEvent(message) {
    const messageContent = await fixIncomingMessage(message);
    const AIEmoji = await AIReaction(messageContent);
    log.info(`diabolical emoji event triggered with AI emojis: ${AIEmoji} on message: ${message.id} with content: ${messageContent}`);
    let AIReactions = AIEmoji.split(',');
    AIReactions.forEach(emoji => {
        action.messageReact(message, emoji).catch(err => {
            log.warn(`could not react to message with AI emoji. AI emoji: ${emoji}`);
        });
    });
}

export function getEvent(message) {
    const guildConfig = guildConfigs.getGuildConfig(message.guild.id);
    const seed = Math.random();
    let chances = eventChances;
    if (guildConfig) {
        chances = {
            thread: guildConfig.diabolicalThreadEventChance,
            reply: guildConfig.diabolicalReplyEventChance,
            reaction: guildConfig.diabolicalReactionEventChance
        }
    }
    if (seed < chances.thread) {
        return 'thread';
    } else if (seed < chances.thread + chances.reply) {
        return 'reply';
    } else if (seed < chances.thread + chances.reply + chances.reaction) {
        return 'reaction';
    } else {
        return null;
    }
}

export function getEventFunction(name) {
    switch (name) {
        case 'thread':
            return threadEvent;
        case 'reply':
            return replyEvent;
        case 'reaction':
            return reactionEvent;
        default:
            return null;
    }
}