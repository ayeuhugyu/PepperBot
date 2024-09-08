import prettyBytes from "pretty-bytes";
import default_embed from "../lib/default_embed.js";
import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import fs from "fs";
import path from "path";
import { stat } from "fs/promises";
import * as globals from "../lib/globals.js";
import process from "node:process";

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
    const logs = await fs.readdirSync("logs");
    for (const log of logs) {
        if (log.endsWith(".log") && !(log == "messages.log")) {
            files.push("logs/" + log);
        }
    } // lmao i just pasted this in here idec that its not valid for its function fuck you
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

const data = new CommandData();
data.setName("info");
data.setDescription("returns info about current bot instance");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
const command = new Command(
    data,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, isInteraction, gconfig) {
        const memory = process.memoryUsage();

        let guilds = await message.client.shard.fetchClientValues(
            "guilds.cache.size"
        );
        const persistent_data = JSON.parse(
            fs.readFileSync("resources/data/persistent_data.json", "utf-8")
        );

        const embed = default_embed()
            .setTitle("pepperbot info")
            .addFields(
                {
                    name: "version",
                    value: `${persistent_data.version}`,
                    inline: true,
                },
                {
                    name: "memory usage",
                    value: `${prettyBytes(
                        memory.rss
                    )} memory usage, ${prettyBytes(
                        memory.heapUsed
                    )} / ${prettyBytes(memory.heapTotal)} heap usage`,
                    inline: true,
                },
                {
                    name: "approx. uptime",
                    value: `${formatTime(
                        Math.floor((Date.now() - startedAtTimestamp) / 1000)
                    )}`,
                    inline: true,
                },
                {
                    name: "current shard id",
                    value: `${message.guild ? message.guild.shardId : "N/A"}`,
                    inline: true,
                },
                {
                    name: "total running shards",
                    value: `${guilds.length}`,
                    inline: true,
                },
                {
                    name: "wasted space",
                    value: prettyBytes(
                        await dirSize("./resources/ytdl_cache/")
                    ),
                    inline: true,
                },
                {
                    name: "ws latency",
                    value: `${message.client ? message.client.ws.ping : "unknown "}ms`,
                    inline: true,
                },
                {
                    name: "system info",
                    value: `${process.platform} ${process.arch}`,
                    inline: true,
                },
                { name: "node version", value: process.version, inline: true }
            );
        if (isInteraction) {
            action.reply(message, {
                embeds: [embed],
                ephemeral: gconfig.useEphemeralReplies,
            });
        } else {
            action.reply(message, {
                embeds: [embed],
                ephemeral: gconfig.useEphemeralReplies,
            });
        }
    }
);

export default command;
