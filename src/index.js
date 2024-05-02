import dotenv from "dotenv";
dotenv.config();
import { ShardingManager } from "discord.js";
import * as log from "./lib/log.js";

log.debug("starting pepperbot");

const manager = new ShardingManager("src/bot.js", {
    token: process.env.DISCORD_TOKEN,
    totalShards: "auto",
});

manager.on("shardCreate", (shard) =>
    log.debug(`launched pepperbot shard ${shard.id}`)
);

manager
    .spawn()
    .then((shards) => {
        shards.forEach((shard) => {
            shard.on("message", (message) => {
                //log.info(
                //`Shard[${shard.id}] : ${message._eval} : ${message._result}`
                //);
                return message._result;
            });
        });
    })
    .catch(log.error);

export default manager;