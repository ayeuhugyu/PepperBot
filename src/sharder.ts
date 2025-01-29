import { ShardingManager } from 'discord.js';
import { config } from 'dotenv';
config();
import * as log from './lib/log';
log.info("starting sharding manager...")

const manager = new ShardingManager('./src/bot.ts', {
    token: process.env.DISCORD_TOKEN,
    totalShards: 'auto'
});

manager.on('shardCreate', shard => {
    log.info(`launched shard ${shard.id + 1}/${manager.totalShards} (id ${shard.id})`);
});

manager.spawn();