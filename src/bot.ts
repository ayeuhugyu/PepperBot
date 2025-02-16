import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config } from 'dotenv';
import * as log from './lib/log';
import { Theme, getThemeEmoji } from './lib/theme';
import fs from "fs";

config();

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
const shardTotal = await fetch("http://localhost:49999/totalShards").then(async (response) => await response.json())

/*const app = await startServer("shard" + shardTotal.currentShard, 50000 + shardTotal.currentShard);
if (app instanceof Error) {
    log.error(app.message);
    process.exit(1);
}*/

const eventFiles = fs
    .readdirSync("src/events")
for (const file of eventFiles) {
    (async () => {
        const event = await import(`./events/${file}`);
        client.on(event.default.name, event.default.execute);
    })();
}

client.once('ready', async () => {
    log.info(`logged in as ${client.user?.tag}; shard ${shardTotal.currentShard}/${shardTotal.totalShards}`);
    
    // web server starting has been moved to index.ts because in here it would start one for every single shard
    
    const channel = await client.channels.fetch("1312566483569741896").catch(() => {});
    if (channel) {
        if (channel.isSendable()) {
            channel.send(`it's pepper time ${getThemeEmoji(Theme.CURRENT)}`);
        }
    }
});

async function init() {
    log.info("logging into discord...");
    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (err) {
        log.error("failed to login into discord. wifi down? token invalid?");
        log.error(err);
        process.exit(1);
    }
}
init();