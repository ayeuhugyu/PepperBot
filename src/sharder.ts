import { ShardingManager } from 'discord.js';
import { config } from 'dotenv';
config();
import * as log from './lib/log';
import { startServer } from './lib/communication_manager';

const app = await startServer("sharder", 49999);
if (app instanceof Error) {
    log.error(`failed to start server: ${app}`);
    process.exit(1);
}
app.get("/totalShards", (_req, res) => {
    if (!manager) { // this should realistically never happen
        log.error("sharding manager not ready when /totalShards requested");
        res.sendStatus(500).json({ error: "sharding manager not ready" });
        return;
    }
    res.json({ totalShards: manager.totalShards, currentShard: manager.shards.size });
});
app.post("/fetchClientValues", async (req, res) => {
    if (!manager) { // this should realistically never happen
        log.error("sharding manager not ready when /fetchClientValues requested");
        // TODO: actually do something with these error messages.. OR
        // use something like HttpException from the front facing web server
        res.sendStatus(500).json({ error: "client not ready" });
        return;
    }
    const values = await manager.fetchClientValues(req.body.property); // this could hypothetically return incorrect results if started while shards are still starting, but its a fairly minimal issue so im not gonna worry about it. might add another method later that errors if called before that point
    res.json({ data: values });
});

log.info("starting sharding manager...")

const manager = new ShardingManager('./src/bot.ts', {
    token: process.env.DISCORD_TOKEN,
    totalShards: 'auto'
});

manager.on('shardCreate', shard => {
    log.info(`launched shard ${shard.id + 1}/${manager.totalShards} (id ${shard.id})`);
});

await manager.spawn();
if (process.send) { // typescript why do you do this to me it will literally never be undefined
    process.send("ready");
}