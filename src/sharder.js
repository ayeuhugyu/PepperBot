import dotenv from "dotenv";
dotenv.config();
import { ShardingManager } from "discord.js";
import * as log from "./lib/log.js";
import process from "node:process";

log.info("starting pepperbot");

const manager = new ShardingManager("src/bot.js", {
    token: process.env.DISCORD_TOKEN,
    totalShards: "auto",
});

const botStartedAt = Date.now();
const startedAtDate = new Date(botStartedAt);
const humanReadableDate = startedAtDate.toLocaleString();
let shardStartedAt = botStartedAt;
let shardStartedAtDate = startedAtDate;
let shardHumanReadableDate = humanReadableDate;

function updateSiteStartTimes() {
    const reqobject = {
        action: "updateStartedAt",
        times: {
            bot: {
                startedAt: humanReadableDate,
                startedAtTimestamp: botStartedAt,
            },
            shard: {
                startedAt: shardHumanReadableDate,
                startedAtTimestamp: shardStartedAt,
            },
        },
    };
    process.send(reqobject);
}
function setShardCount(count) {
    process.send({ action: "setShardCount", value: count });
}

function kill() {
    log.info("kill called, killing bot host");
    process.exit(0);
}

let shardCount = 0;

process.on("message", (message) => {
    if (message.action === "kill") {
        kill();
        return;
    }
    if (message.action === "forceUpdateTimes") {
        updateSiteStartTimes();
        return;
    }
});

process.on("uncaughtException", (err) => {
    throw new Error(err);
});

manager.on("shardCreate", (shard) => {
    shardCount++;
    setShardCount(shardCount);
    log.info(`launched pepperbot shard ${shard.id}`);
});

manager.spawn().then((shards) => {
    process.send({ action: "ready" });
    updateSiteStartTimes();
    shards.forEach((shard) => {
        shard.on("message", (message) => {
            if (message.action && message.action == "restart") {
                if (message.process === "shard") {
                    log.info(`restarting shard #${message.shardId}`);
                    const shrd = shards.get(parseInt(message.shardId))
                    if (!shrd) {
                        log.warn(`could not find and restart shard #${message.shardId}`);
                        return;
                    }
                    shrd.respawn();
                    return;
                }
                process.send({ action: "restart", process: message.process });
            }
            if (message.action && message.action == "setStartedAt") {
                shardStartedAt = Date.now();
                shardStartedAtDate = new Date(shardStartedAt);
                shardHumanReadableDate = shardStartedAtDate.toLocaleString();
                updateSiteStartTimes();
            }
            return message._result;
        });
    });
});

export default manager;
