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
import commandsObject from "../lib/commands.js"
import * as globals from "../lib/globals.js";

const config = globals.config;
const diabolical_events = globals.diabolical_events

let commands = commandsObject.commandExecutions;
commandsObject.on("refresh", newCommandsObject => {
    commands = newCommandsObject.commandExecutions;
})

async function processDM(message) {
    if (message.channel.type === 1) {
        if (!message.author.bot) {
            if (!message.content.startsWith(config.generic.prefix)) {
                const channel = await client.channels.cache.get(
                    config.events.dm_replication_channel
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
        !message.content.startsWith(config.generic.prefix)
    ) {
        const random = Math.random() * 250;
        if (random > 249) {
            const random2 = Math.random() * 100;
            if (random2 > 90) {
                message.react();
                return;
            }
            const event =
                diabolical_events.default[
                    Math.floor(Math.random() * diabolical_events.default.length)
                ];
            action.reply(message, event);
        }
    }
}

async function processGPTResponse(message) {
    if (message.mentions) {
        if (message.mentions.has(client.user)) {
            if (!message.author.bot) {
                let completion = await gpt.respond(message).catch((err) => {
                    log.error(err);
                });
                if (completion) {
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
    if (!message.content.startsWith(config.generic.prefix)) {
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

    let blackliststring = fs.readFileSync(config.paths.blacklist_file, "utf-8");
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
        return;
    }
    const commandFn = commands.get(command);
    await commandFn(message, undefined, false).catch((err) => {
        log.error(err);
    });
    let logmsg = `command received: ${command} from: ${message.author.username} (${message.author}) `;
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

export default {
    name: Events.MessageCreate,
    async execute(message) {
        await Promise.all([
            processDM(message),
            processDiabolicalEvent(message),
            processGPTResponse(message),
            processCommand(message),
        ]);
    },
};
