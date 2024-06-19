import prettyBytes from "pretty-bytes";
import default_embed from "../lib/default_embed.js";
import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import fs from "fs";
import path from "path";
import { stat } from "fs/promises";
import * as globals from "../lib/globals.js";
import process from "node:process";

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
    async function execute(message, args, isInteraction) {
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
                    name: "servers",
                    value: `${guilds.reduce(
                        (acc, guildCount) => acc + guildCount,
                        0
                    )}`,
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
                    name: "uptime",
                    value: `${await convertMilisecondsToReadable(
                        message.client.uptime
                    )}`,
                    inline: true,
                },
                {
                    name: "current shard id",
                    value: `${message.guild.shardId}`,
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
                    name: "latency",
                    value: `${message.client.ws.ping}ms`,
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
                ephemeral: true,
            });
        } else {
            action.reply(message, {
                embeds: [embed],
                ephemeral: true,
            });
        }
    }
);

export default command;
