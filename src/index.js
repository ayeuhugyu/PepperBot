import dotenv from "dotenv";
dotenv.config();
import { ShardingManager } from "discord.js";
import * as log from "./lib/log.js";
import process from "node:process";
import { fork } from "child_process";

log.debug("starting pepperbot");

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

function handleSiteRequests(message) {}

let site;
function forkSite() {
    if (site) {
        site.send({ action: "kill" });
    }
    log.info("forking site.js");
    site = fork("src/site.js");
    site.on("message", (message) => {
        return handleSiteRequests(message);
    });
    site.send({
        action: "updateStartedAt",
        bot: {
            startedAt: humanReadableDate,
            startedAtTimestamp: botStartedAt,
        },
        shard: {
            startedAt: shardHumanReadableDate,
            startedAtTimestamp: shardStartedAt,
        },
    });
}
forkSite();

let shardCount = 0;

function setShardCount(count) {
    site.send({ action: "setShardCount", value: count });
}

manager.on("shardCreate", (shard) => {
    shardCount++;
    setShardCount(shardCount);
    log.debug(`launched pepperbot shard ${shard.id}`);
});

manager
    .spawn()
    .then((shards) => {
        shards.forEach((shard) => {
            shard.on("message", (message) => {
                if (message.action && message.action == "restartSite") {
                    forkSite();
                }
                if (message.action && message.action == "setStartedAt") {
                    shardStartedAt = Date.now();
                    shardStartedAtDate = new Date(shardStartedAt);
                    shardHumanReadableDate =
                        shardStartedAtDate.toLocaleString();
                    site.send({
                        action: "updateStartedAt",
                        bot: {
                            startedAt: humanReadableDate,
                            startedAtTimestamp: botStartedAt,
                        },
                        shard: {
                            startedAt: shardHumanReadableDate,
                            startedAtTimestamp: shardStartedAt,
                        },
                    });
                }
                return message._result;
            });
        });
    })
    .catch(log.error);

export default manager;
