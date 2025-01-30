import { ShardingManager } from 'discord.js';
import { config } from 'dotenv';
config();
import * as log from './lib/log';
import { startServer } from './lib/communication_manager';

const app = await startServer("sharder", 50000 - 1);
if (app instanceof Error) {
    log.error(`failed to start server: ${app}`);
    process.exit(1);
}
app.get("/totalShards", (req, res) => {
    if (!manager) {
        log.warn("sharding manager not ready when /totalShards requested");
        res.sendStatus(503).send("sharding manager not ready");
        return;
    }
    res.json({ totalShards: manager.totalShards, currentShard: manager.shards.size });
});

log.info("starting sharding manager...")

const manager = new ShardingManager('./src/bot.ts', {
    token: process.env.DISCORD_TOKEN,
    totalShards: 'auto'
});

manager.on('shardCreate', shard => {
    log.info(`launched shard ${shard.id + 1}/${manager.totalShards} (id ${shard.id})`);
});

manager.spawn();