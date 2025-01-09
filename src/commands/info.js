import prettyBytes from "pretty-bytes";
import * as theme from "../lib/theme.js";
import * as action from "../lib/discord_action.js";
import { Command, CommandData, SubCommand, SubCommandData } from "../lib/types/commands.js";
import fs from "fs";
import path from "path";
import { stat } from "fs/promises";
import * as globals from "../lib/globals.js";
import process from "node:process";
import { Collection } from "discord.js"

const startedAtTimestamp = Date.now(); // too lazy to export from the sharder and deal with circular dependencies so this is close enough (it will be like 0.15 seconds off but i don't care)
function padZero(number) {
    return number.toString().padStart(2, "0");
}
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
}

const config = globals.config;

const dirSize = async (directory) => {
    let files = await fs.readdirSync(directory);
    files = files.map((file) => path.join(directory, file));
    const stats = files.map((file) => stat(file));
    return (await Promise.all(stats)).reduce(
        (accumulator, { size }) => accumulator + size,
        0
    );
};
/*
async function convertMilisecondsToReadable(time) {
    var milliseconds = Math.floor((time % 1000) / 100),
        seconds = Math.floor((time / 1000) % 60),
        minutes = Math.floor((time / (1000 * 60)) % 60),
        hours = Math.floor((time / (1000 * 60 * 60)) % 24);

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}
// will probably be useful at some point in time
*/

const performancedata = new SubCommandData();
performancedata.setName("performance");
performancedata.setDescription("return info relating to the bot's performance");
performancedata.setPermissions([]);
performancedata.setPermissionsReadable("");
performancedata.setWhitelist([]);
performancedata.setNormalAliases();
performancedata.setCanRunFromBot(true);
const performance = new SubCommand(
    performancedata,
    async function getArguments(message) {
        return new Collection();
    },
    async function execute(message, args, fromInteraction, gconfig) {
        const embed = theme.createThemeEmbed(theme.themes[gconfig.theme] || theme.themes.CURRENT);
        embed.setTitle("Performance Info");
        //const memory = process.memoryUsage();
        let memory = undefined;
        let sent = undefined

        function memoryResponseListener(response) {
            if (response.action && response.action === "memoryResponse" && !sent) {
                memory = response.mem;
                process.removeListener("message", memoryResponseListener)
                embed.addFields({
                    name: "process memory usage",
                    value: `${prettyBytes(memory.rss)} memory usage, ${prettyBytes(memory.heapUsed)} / ${prettyBytes(memory.heapTotal)} heap usage`,
                    inline: true,
                });
                sent = action.reply(message, {
                    embeds: [embed],
                    ephemeral: gconfig.useEphemeralReplies,
                });
            }
        }
        process.on('message', memoryResponseListener)
        process.send({ action: "getMemoryUsage"})
        embed.addFields(
            {
                name: "approx. bot uptime",
                value: `${formatTime(Math.floor((Date.now() - startedAtTimestamp) / 1000))}`,
                inline: true,
            },
            {
                name: "wasted space",
                value: prettyBytes(await dirSize("./resources/ytdl_cache/")),
                inline: true,
            },
            {
                name: "websocket latency",
                value: `${message.client ? message.client.ws.ping : "unknown "}ms`,
                inline: true,
            },
            {
                name: "system info",
                value: `${process.platform} ${process.arch}`,
                inline: true,
            },
            { 
                name: "node version", 
                value: process.version, 
                inline: true 
            },
        )
        setTimeout(() => {
            if (!sent ||!memory) {
                embed.addFields({
                    name: "process memory usage",
                    value: `reading memory usage of all processes exceeded time limit`,
                    inline: true,
                })
                action.reply(message, {
                    embeds: [embed],
                    ephemeral: gconfig.useEphemeralReplies,
                });
            }
        }, 2000)
    }
);

const logsdata = new SubCommandData();
logsdata.setName("logs");
logsdata.setDescription("return info relating to the logs");
logsdata.setPermissions([]);
logsdata.setPermissionsReadable("");
logsdata.setWhitelist([]);
logsdata.setNormalAliases();
logsdata.setCanRunFromBot(true);
const logs = new SubCommand(
    logsdata,
    async function getArguments(message) {
        return new Collection();
    },
    async function execute(message, args, fromInteraction, gconfig) {
        let logfiles = fs.readdirSync("logs")
        logfiles = logfiles.filter((file) => file !== "messages.log")
        let totalSize = 0
        let sizes = {};
        let totalLength = 0;
        let lengths = {};
        await Promise.all(logfiles.map(async (file) => {
            const filestat = await stat(`logs/${file}`);
            const fileContent = fs.readFileSync(`logs/${file}`, "utf-8");
            const length = fileContent.split("\n").length;
            sizes[file] = filestat.size;
            lengths[file] = length;
            totalLength += length;
            totalSize += filestat.size;
        }));
        //console.log(sizes, lengths)
        const embed = theme.createThemeEmbed(theme.themes[gconfig.theme] || theme.themes.CURRENT)
        embed.setTitle("Log Info");
        embed.setDescription(`files: ${logfiles.map((file) => `${file}`).join(", ")}`);
        embed.addFields(
            {
                name: "File Size",
                value: `Total: ${prettyBytes(totalSize)}\n${logfiles.map((file) => `${file}: ${prettyBytes(sizes[file])}`).join("\n")}`,
                inline: true
            },
            {
                name: "Line Length",
                value: `Total: ${totalLength}\n${logfiles.map((file) => `${file}: ${lengths[file]}`).join("\n")}`,
                inline: true
            }
        );
        action.reply(message, {
            embeds: [embed],
            ephemeral: gconfig.useEphemeralReplies,
        });
    }
);

let currentShardId = undefined

const sharddata = new SubCommandData();
sharddata.setName("shard");
sharddata.setDescription("return info relating to the shards (processes)");
sharddata.setPermissions([]);
sharddata.setPermissionsReadable("");
sharddata.setWhitelist([]);
sharddata.setNormalAliases();
sharddata.setAliases(["shards", "processes", "process"]);
sharddata.setCanRunFromBot(true);
const shard = new SubCommand(
    sharddata,
    async function getArguments(message) {
        return new Collection();
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (currentShardId === undefined) {
            currentShardId = message?.guild?.shardId || undefined
        }
        let sent = undefined
        const embed = theme.createThemeEmbed(theme.themes[gconfig.theme] || theme.themes.CURRENT)
            .setTitle("pepperbot info")
            .setDescription(`shard count: ${message.client.shard.count}\ncurrent shard: ${currentShardId || "???"}`)
        function errorCountResponseHandler(data) {
            if (data.message === "errorCountResponse" && !sent) {
                const response = data.data
                const fieldValue = ``
                process.removeListener("message", errorCountResponseHandler)
                response.forEach((count) => {
                    let statusEmoji = "🟢"
                    if (count.fatal === 1) {
                        statusEmoji = "🟡"
                    }
                    if (count.fatal === 2) {
                        statusEmoji = "🔴"
                    }
                    const isThisShard = count.id === currentShardId
                    fieldValue += `${isThisShard ? "**" : ""}${statusEmoji} ${count.id}: ${count.warnings} warnings, ${count.errors + count.fatal} errors (${count.fatal} fatal)${isThisShard ? "**" : ""}\n`
                })
                const field = {
                    name: "",
                    value: fieldValue,
                    inline: true
                }
                embed.addFields(field)
                sent = action.reply(message, {
                    embeds: [embed],
                    ephemeral: gconfig.useEphemeralReplies,
                });
            }
        }
        process.on('message', errorCountResponseHandler)
        process.send({ action: "getErrorCount"})
        setTimeout(() => {
            if (!sent) {
                embed.addFields({
                    name: "",
                    value: "reading error count exceeded time limit",
                    inline: true
                })
                sent = action.reply(message, {
                    embeds: [embed],
                    ephemeral: gconfig.useEphemeralReplies,
                });
            }
        }, 2000)
    }
);

const botdata = new SubCommandData();
botdata.setName("bot");
botdata.setDescription("return info relating to the bot");
botdata.setPermissions([]);
botdata.setPermissionsReadable("");
botdata.setWhitelist([]);
botdata.setNormalAliases();
botdata.setAliases();
botdata.setCanRunFromBot(true);
const bot = new SubCommand(
    botdata,
    async function getArguments(message) {
        return new Collection();
    },
    async function execute(message, args, fromInteraction, gconfig) {
        const guilds = await message.client.shard.fetchClientValues("guilds.cache.size");
        const users = await message.client.shard.fetchClientValues("users.cache.size");
        const persistent_data = JSON.parse(fs.readFileSync("resources/data/persistent_data.json", "utf-8"));

        const embed = theme.createThemeEmbed(theme.themes[gconfig.theme] || theme.themes.CURRENT)
            .setTitle("pepperbot info")
            .addFields(
                {
                    name: "version",
                    value: `${persistent_data.version}`,
                    inline: true,
                },
                {
                    name: "total guilds",
                    value: `${guilds.reduce((acc, guildCount) => acc + guildCount, 0)}`,
                    inline: true,
                },
                {
                    name: "total unique users",
                    value: `${users.reduce((acc, userCount) => acc + userCount, 0)}`,
                    inline: true,
                }
            );
        action.reply(message, {
            embeds: [embed],
            ephemeral: gconfig.useEphemeralReplies,
        });
    }
);

const data = new CommandData();
data.setName("info");
data.setDescription("returns info about current bot instance");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setPrimarySubcommand(performance);
data.addStringOption(option => 
    option
        .setName("subcommand")
        .setDescription("the subcommand to use")
        .setRequired(false)
        .addChoices(
            { name: "performance", value: "performance" },
            { name: "logs", value: "logs" },
            { name: "bot", value: "bot" },
            { name: "shard", value: "shard" }
        )
)
const command = new Command(
    data,
    async function getArguments(message) {
        const args = new Collection();
        args.set("_SUBCOMMAND", message.content.split(" ")[1]);
        return args;
    },
    async function execute(message, args, isInteraction, gconfig) {
        action.reply(message, {
            content: `invalid subcommand: ${args.get("_SUBCOMMAND")}`,
            ephemeral: gconfig.useEphemeralReplies,
        })
    },
    [logs, performance, bot, shard]
);

export default command;
