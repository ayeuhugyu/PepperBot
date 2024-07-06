import {
    Events,
    Collection,
    Guild,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} from "discord.js";
import * as fs from "fs";
import * as log from "../lib/log.js";
import { client } from "../bot.js";
import * as gpt from "../lib/gpt.js";
import * as action from "../lib/discord_action.js";
import commandsObject from "../lib/commands.js";
import * as globals from "../lib/globals.js";
import process from "node:process";
import fsExtra from "fs-extra";
import cheerio from "cheerio";

async function fetchTitle(url) {
    try {
        // Fetch the HTML of the page
        const response = await fetch(url);
        const body = await response.text();
        // Load the HTML string into cheerio
        const $ = cheerio.load(body);
        // Extract the title
        const title = $("title").text();
        return title;
    } catch (error) {
        console.error(`Could not fetch title for ${url}:`, error.message);
        return null;
    }
}

const config = globals.config;
const diabolical_events = globals.diabolical_events;

const commands = commandsObject.commandExecutions;

function logmessage(message) {
    fsExtra.ensureFileSync("logs/messages.log");
    if (
        !message.author.bot &&
        !message.content
            .toLowerCase()
            .startsWith(config.generic.prefix.toLowerCase())
    ) {
        fs.appendFileSync("logs/messages.log", message.content + "\n");
    }
}

async function processDM(message) {
    if (message.channel.type === 1) {
        if (!message.author.bot) {
            if (
                !message.content
                    .toLowerCase()
                    .startsWith(config.generic.prefix.toLowerCase())
            ) {
                const channel = await client.channels.cache.get(
                    "1148814162273763418"
                );
                const webhooks = await channel.fetchWebhooks();
                let webhook = await webhooks.find(
                    (webhook) => webhook.name === message.author.displayName
                );
                if (webhook === undefined) {
                    webhook = await channel.createWebhook({
                        name: message.author.displayName,
                        avatar: await message.author.displayAvatarURL({
                            size: 2048,
                            extention: "webp",
                            dynamic: true,
                        }),
                        token: process.env.WEBHOOK_TOKEN,
                    });
                }
                log.info(
                    `dm received from ${message.author.id} with: ${message.content}`
                );
                webhook
                    .send(await action.fixMsg(message.content))
                    .catch((err) => {
                        log.error(err);
                    });
            }
        }
    }
}
async function processDiabolicalEvent(message) {
    if (
        !message.author.bot &&
        !message.content
            .toLowerCase()
            .startsWith(config.generic.prefix.toLowerCase())
    ) {
        const random = Math.random() * 250;
        if (random < 5) {
            // ~2%
            log.info(`diabolical emoji event triggered on ${message.id}`);
            const emoji =
                globals.emojis[
                    Math.floor(Math.random() * globals.emojis.length)
                ];
            message.react(emoji);
        }
        if (random > 246.5 && random < 249) {
            // ~1%
            log.info(`diabolical thread event triggered on ${message.id}`);
            message
                .startThread({
                    name: "Threaded! 🧵",
                    autoArchiveDuration: 60,
                    reason: "It's quite diabolical.",
                })
                .then((thread) => {
                    thread.send("You've just been threaded! 🧵");
                });
        }
        if (random > 249) {
            // ~0.4%
            log.info(`diabolical event triggered on ${message.id}`);
            const event =
                diabolical_events[
                    Math.floor(Math.random() * diabolical_events.length)
                ];
            action.reply(message, event);
        }
    }
}

async function processGPTResponse(message) {
    if (message.mentions) {
        if (
            message.mentions.has(client.user) &&
            !message.content
                .toLowerCase()
                .startsWith(config.generic.prefix.toLowerCase()) &&
            !message.mentions.everyone
        ) {
            if (!message.author.bot) {
                let completion = await gpt.respond(message).catch((err) => {
                    log.error(err);
                });
                if (completion) {
                    log.info(`gpt response succssful for ${message.author.id}`);
                    action.reply(
                        message,
                        completion.choices[0].message.content
                    );
                } else {
                    action.reply(
                        message,
                        "error while generating GPT completion, edit your prompt and try again later"
                    );
                }
            }
        }
    }
}

async function processCommand(message) {
    if (
        !message.content
            .toLowerCase()
            .startsWith(config.generic.prefix.toLowerCase())
    ) {
        return;
    } // return if not a command

    message.showModal = async function (modal) {
        const openModal = new ButtonBuilder()
            .setCustomId("openModal")
            .setLabel("Open Modal Menu")
            .setStyle(ButtonStyle.Success);
        const actionRow = new ActionRowBuilder().addComponents(openModal);
        const response = await action.reply(message, {
            content:
                "discord does not currently support showing modals directly from messages, so you'll have to click this button. This collector will expire after 2 minutes.",
            components: [actionRow],
        });
        const collectorFilter = (i) => i.user.id === message.author.id;

        try {
            const confirmation = await response.awaitMessageComponent({
                filter: collectorFilter,
                time: 120_000,
            });
            if (confirmation.customId === "openModal") {
                confirmation.showModal(modal);
            }
        } catch (e) {
            return;
        }
    };
    message.awaitModalSubmit = async function () {};

    let blackliststring = fs.readFileSync(
        "resources/data/blacklist.json",
        "utf-8"
    );
    let blacklists = await JSON.parse(blackliststring);
    if (blacklists.includes(message.author.id)) {
        action.reply(message, `blacklisted lmfao`);
        return;
    }
    const command =
        message.content // this is just the substring between the prefix and the first space lowercased
            .slice(config.generic.prefix.length)
            .split(/ +/)
            .shift() || "".toLowerCase();

    if (!command) {
        log.warn("no command found in message");
        return;
    } // return if command == '' (probably caused by entering just the prefix)
    if (!commands.get(command)) {
        action.reply(message, `invalid command: ${command}, baffoon!`);
        log.info(`invalid command by ${message.author.id}: p/${command}`);
        return;
    }
    log.info(`command requested by ${message.author.id}: p/${command}`);
    const commandFn = commands.get(command);
    await commandFn(message, undefined, false).catch((err) => log.error);
    let logmsg = `command executed: ${command} from: ${message.author.username} (${message.author}) `;
    if (message.channel) {
        if (message.channel.type === 1) {
            logmsg += `in DM `;
        } else {
            logmsg += `in: ${message.channel.name} (${message.channel}) `;
        }
    }
    if (message.guild) {
        logmsg += `in guild: ${message.guild.name} (${message.guild}) `;
    }
    logmsg += `full: ${message.content}`;
    log.info(logmsg);
}

async function getIsDisgraceful(message) {
    if (message.guild && message.guild.id == "1112819622505365556") {
        if (message.channel && message.channel.id == "1171660137946157146") {
            if (
                message.member.id !== "440163494529073152" &&
                message.member.id !== message.client.user.id &&
                message.member.id !== "1209297323029565470" &&
                message.member.id !== "1148796261793800303"
            ) {
                await action.sendDM(message.author, {
                    content: "Disgraceful.",
                });
                await action.deleteMessage(message);
                return true;
            }
        }
    }
    const medalTvRegex = /https:\/\/medal\.tv[^\s]+/g;
    const medalTvUrls = message.content.match(medalTvRegex);
    if (medalTvUrls && medalTvUrls.length > 0) {
        if (medalTvUrls.length > 5) return false; // it takes a little bit to fetch the titles, so someone could just spam medal links in a message and it would make the bot hang for a long time
        for (const url of medalTvUrls) {
            const title = await fetchTitle(url);
            if (!title) return false;
            if (title.toLowerCase().trim().startsWith("untitled")) {
                action.sendMessage(message.channel, {
                    content: `<@${message.author.id}> TITLE YOUR FUCKING CLIPS YOU FUCKTARD`,
                });
                action.deleteMessage(message);
                return true;
            }
        }
    }
    return false;
}

export default {
    name: Events.MessageCreate,
    async execute(message) {
        const DNI = await getIsDisgraceful(message);
        if (DNI) return;
        await Promise.allSettled([
            processDM(message),
            processDiabolicalEvent(message),
            processGPTResponse(message),
            processCommand(message),
        ]);
        logmessage(message);
    },
};
