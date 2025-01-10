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
    manager.shards.forEach((shard) => {
        shard.kill();
        log.info(`killed shard ${shard.id}`);
    });
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
    if (message.action === "getMemoryUsage") {
        const memory = process.memoryUsage();
        let memResponse = {
            rss: memory.rss,
            heapUsed: memory.heapUsed,
            heapTotal: memory.heapTotal,
        }
        manager.shards.forEach((shard) => {
            const shardMemory = shard.process.memoryUsage();
            memResponse.rss += shardMemory.rss
            memResponse.heapUsed += shardMemory.heapUsed
            memResponse.heapTotal += shardMemory.heapTotal
        })
        process.send({
            action: "memoryResponse",
            mem: memResponse,
        });
        
        return;
    }
    if (message.action && message.action == "messageCreate") {
        //console.log(message)
        manager.shards.get(0).send({ action: "messageCreate", message: message.message });
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

let shardErrorCounts = {};

manager.spawn().then((shards) => {
    process.send({ action: "ready" });
    updateSiteStartTimes();
    shards.forEach((shard) => {
        shardErrorCounts[shard.id] = {
            errors: 0,
            warnings: 0,
            fatal: 0,
            id: shard.id,
        };
        shard.on("message", (message) => {
            if (message.action && message.action == "restart") {
                if (message.process === "shard") {
                    log.info(`restarting shard #${message.shardId}`);
                    const shrd = shards.get(parseInt(message.shardId));
                    if (!shrd) {
                        log.warn(
                            `could not find and restart shard #${message.shardId}`
                        );
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
            if (message.action === "getMemoryUsage") {
                const performance = process.memoryUsage()
                let memResponse = performance;
                Promise.all(manager.shards.map((shard) => {
                    return new Promise((resolve, reject) => {
                        shard.process.once("message", function(message) {
                            const shardMemory = message.mem;
                            memResponse.rss += shardMemory.rss;
                            memResponse.heapUsed += shardMemory.heapUsed;
                            memResponse.heapTotal += shardMemory.heapTotal;
                            resolve(shardMemory);
                        });
                        shard.process.send({ action: "get_mem_usage" });
                    });
                })).then(() => {
                    shard.send({
                        action: "memoryResponse",
                        mem: memResponse,
                    });
                }).catch((error) => {
                    log.error("Error collecting memory usage from shards:", error);
                });
                
                return;
            }
            if (message.action && message.action === "errorCount") {
                if (message.type === "errors") {
                    shardErrorCounts[shard.id].errors++;
                }
                if (message.type === "warnings") {
                    shardErrorCounts[shard.id].warnings++;
                }
                if (message.type === "fatal") {
                    shardErrorCounts[shard.id].fatal++;
                }
            }
            if (message.action && message.action === "getErrorCount") {
                shard.send({
                    action: "errorCountResponse",
                    data: shardErrorCounts,
                })
            }
            if (message.action && message.action === "getShardId") {
                shard.send({
                    action: "shardIdResponse",
                    id: shard.id
                });
            }
            return message._result;
        });
    });
});

export default manager;
