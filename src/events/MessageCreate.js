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
import * as cheerio from "cheerio";
import guildConfigs from "../lib/guildConfigs.js";
import commonRegex from "../lib/commonRegex.js";
import statistics from "../lib/statistics.js";
import * as diabolic from "../lib/diabolicalEvents.js";

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
        log.error(`Could not fetch title for ${url}:`, error.message);
        return null;
    }
}

const config = globals.config;
const diabolical_events = globals.diabolical_events;

const commands = new Collection();
commandsObject.commands.forEach((value, key) => {
    commands.set(key, value.execute);
}); // idfk why this works and just using the execute function directly doesn't
const normalCommandAliases = commandsObject.commandSubCommandAliases;

function logmessage(message) {
    fsExtra.ensureFileSync("logs/messages.log");
    if (
        !message.author.bot &&
        !message.content
            .toLowerCase()
            .startsWith(config.generic.prefix.toLowerCase())
    ) {
        fs.appendFile("logs/messages.log", message.content + "\n", () => {});
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
                const channel = await client.channels.cache.get("1312566483569741896");
                const webhooks = await channel.fetchWebhooks();
                let webhook = await webhooks.find((webhook) => webhook.name === message.author.displayName);
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
                log.info(`dm received from ${message.author} with: ${message.content}`);
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
    if (diabolic.messageFilter(message)) return;
    const eventName = diabolic.getEvent(message);
    if (!eventName) return;
    const eventFunction = diabolic.getEventFunction(eventName);
    if (!eventFunction) return;
    eventFunction(message);
}

async function processGPTResponse(message) {
    const gconfig = await guildConfigs.getGuildConfig(message.guild.id);
    const prefix = gconfig.prefix || config.generic.prefix;
    if (message.mentions) {
        if (message.mentions.has(client.user) && !message.content.toLowerCase().startsWith(prefix.toLowerCase()) && !message.mentions.everyone) {
            if (!message.author.bot) {
                if (gconfig && gconfig.disableGPTResponses) return;
                if (gconfig && gconfig.blacklistedGPTResponseChannelIds && gconfig.blacklistedGPTResponseChannelIds.includes(message.channel.id)) return;
                
                const sent = await action.reply(message, { content: "processing..." });
                let sentContent = "processing...";

                const conversation = await gpt.getConversation(message.author.id);
                sentContent += `\n-# fetched conversation with ${message.author.username} (${message.author.id})`
                await action.editMessage(sent, {
                    content: sentContent,
                })
                conversation.emitter.on("tool_call", async (tool) => {
                    sentContent += `\n-# processing tool call ${tool.id}: ${tool.function}`
                    await action.editMessage(sent, {
                        content: sentContent,
                    })
                })
                conversation.emitter.on("message", async (message) => {
                    await action.editMessage(sent, {
                        content: message
                    })
                })
                conversation.emitter.on("error", async (message) => {
                    sentContent += `\nan error occurred while creating a GPT message. see logs for more details. debug data will persist.`
                    await action.editMessage(sent, {
                        content: sentContent
                    })
                })
                await gpt.respond(message);
                conversation.emitter.removeAllListeners();
            }
        }
    }
}

async function processCommand(message) {
    //console.log("processing command")
    const gconfig = await guildConfigs.getGuildConfig(message.guild.id);
    const prefix = gconfig.prefix || config.generic.prefix;
    if (!message.content.toLowerCase().startsWith(prefix.toLowerCase())) {
        //console.log("not a command")
        return;
    } // return if not a command

    let blackliststring = fs.readFileSync(
        "resources/data/blacklist.json",
        "utf-8"
    );
    let blacklists = await JSON.parse(blackliststring);
    if (blacklists.includes(message.author.id)) {
        //console.log("blacklisted")
        action.reply(message, `blacklisted lmfao`);
        return;
    }
    const command =
        message.content // this is just the substring between the prefix and the first space lowercased
            .slice(prefix.length)
            .split(/ +/)
            .shift() || "".toLowerCase();

    if (!command) {
        //console.log("command not found")
        action.reply(message, {
            content: "supply a command, baffon!",
        });
        return;
    } // return if command == '' (probably caused by entering just the prefix)
    if (!commands.get(command) && !normalCommandAliases.get(command)) {
        action.reply(message, `invalid command: ${command}, baffoon!`);
        log.debug(`invalid command by ${message.author.id}: p/${command}`);
        return;
    }

    log.info(`TEXT command requested by ${message.author.id}: p/${command}`);
    const commandFn =
        commands.get(command) ||
        normalCommandAliases.get(command).subcommand.execute;
    if (!commandFn) {
        action.reply(message, `invalid command: ${command}, baffoon!`);
        log.debug(`invalid command by ${message.author.id}: p/${command}`);
        return;
    } // theoretically should never happen but im just being safe
    const startCommand = performance.now();
    //console.log("executing message")
    commandFn(message, undefined, false)
        .catch((err) => log.error)
        .then((returned) => {
            let logmsg = `command executed: ${command} in: ${(
                performance.now() - startCommand
            ).toFixed(3)}ms from: ${message.author} `;
            const excludeList = ["restart", "eval"];
            if (!excludeList.includes(commandsObject.normalAliasesToBaseCommand[command] || command)) {
                statistics.logCommandUsage(commandsObject.normalAliasesToBaseCommand[command] || commandsObject.commandAliasesToBaseCommand[command] || command, performance.now() - startCommand);
                statistics.addCommandTypeStat("text");
                log.info("wrote statistic to " + (commandsObject.normalAliasesToBaseCommand[command] || command))
            }
            if (message.channel) {
                if (message.channel.type === 1) {
                    logmsg += `in DM `;
                } else {
                    logmsg += `in: ${message.channel} `;
                }
            }
            if (message.guild) {
                logmsg += `in guild: ${message.guild.id} `;
            }
            const firstNewlineIndex = message.content.indexOf('\n');
            const logsliced = firstNewlineIndex !== -1 ? message.content.slice(0, firstNewlineIndex) : message.content;
            logmsg += `full: ${logsliced}`;
            log.debug(logmsg);
        });
}

async function getIsDisgraceful(message) {
    if (message.guild && message.guild.id == "1112819622505365556") {
        if (message.channel && message.channel.id == "1171660137946157146") {
            if (
                message.member &&
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
            if (!message.member) {
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
                return true;
            }
        }
    }
    return false;
}

async function processOtherStuff(message) {
    const gconfig = guildConfigs.getGuildConfig(message.guild.id)
    if (gconfig.autoBuildPreview) {
        const buildLinkRegex = commonRegex.deepwokenBuildLink
        const buildID = message.content.match(buildLinkRegex)?.[1];
        if (buildID) {
            const command = await import("../commands/preview.js")
            const args = new Collection()
            args.set("buildid", buildID)
            await command.default.execute(message, args, false)
        }
        
    }
    if (gconfig.autoCrosspostChannels.includes(message.channel.id)) {
        try {
            if (message.crosspostable) {
                message.crosspost().catch((err) => {
                    log.error(err)
                })
            }
        } catch (e) {
            log.error(e)
        }
        
    }
}

export default {
    name: Events.MessageCreate,
    async execute(message) {
        const DNI = await getIsDisgraceful(message);
        //console.log(message, DNI)
        if (DNI) return;
        await Promise.allSettled([
            processDM(message),
            processDiabolicalEvent(message),
            processGPTResponse(message),
            processCommand(message),
            processOtherStuff(message),
        ]);
        logmessage(message);
    },
};
