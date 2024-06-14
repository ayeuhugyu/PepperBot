import { Client, GatewayIntentBits, Events, Partials } from "discord.js";
import * as log from "./lib/log.js";
import util from "util";
import prettyBytes from "pretty-bytes";
import fs from "fs";
import * as globals from "./lib/globals.js";
import process from "node:process";

const config = globals.config;

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

async function init() {
    log.debug("initializing bot...");
    log.debug("logging into discord...");
    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (err) {
        log.error("failed to login into discord. wifi down? token invalid?");
        log.error(err);
        process.exit(1);
    }
}

const eventFiles = fs
    .readdirSync("src/events")
    .filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
    (async () => {
        const event = await import(`./events/${file}`);
        client.on(event.default.name, event.default.execute);
    })();
}

client.on(Events.ClientReady, async () => {
    log.info("bot online");
    let channel = await client.channels.cache.get("1148814162273763418");
    if (channel) {
        channel.send(`its pepper time 🌶`);
    } else {
        let channels = await client.shard.fetchClientValues(
            "channels.cache"
        );
        const shards = channels.size;
        for (const shardChannels of channels) {
            for (const shardChannel of shardChannels) {
                if (shardChannel.id == "1148814162273763418") {
                    channel = shardChannel;
                    break;
                }
            }
        }
        if (!channel) {
            log.error("failed to find pepper channel");
        } else {
            channel.send(`its pepper time 🌶 ${client.shard.ids[0]}/${shards}`);
        }
    }

    log.info("bot ready to serve");
    log.debug(`running on ${process.platform} ${process.arch}`);
    const memory = process.memoryUsage();
    log.debug(
        `${prettyBytes(memory.rss)} memory usage, ${prettyBytes(
            memory.heapUsed
        )} / ${prettyBytes(memory.heapTotal)} heap usage`
    );
});

await init();

const channel = await client.channels.fetch(config.lib.notification_channel);

let quickErrors = 3;
let lastErrorTime = undefined;

process.on("uncaughtException", (err, origin) => {
    lastErrorTime = performance.now();
    log.fatal(err);
    channel.send(
        `<@440163494529073152> uncaught exception: \n\`\`\`${util.inspect(
            err
        )}\`\`\``
    );
    const currentTime = performance.now();
    if (lastErrorTime && currentTime - lastErrorTime < 50 && quickErrors >= 5) {
        log.fatal("EXCESSIVE ERRORS DETECTED, ESCAPING");
        process.exit(1);
    } else if (lastErrorTime && currentTime - lastErrorTime >= 50) {
        lastErrorTime = currentTime;
        quickErrors = 0;
    } else {
        lastErrorTime = currentTime;
        quickErrors++;
    }
});

process.on("exit", () => {
    log.info("exiting pepperbot");
});
