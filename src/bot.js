import dotenv from "dotenv";
dotenv.config();
import { Client, GatewayIntentBits, Events, Partials } from "discord.js";
import * as log from "./lib/log.js";
import prettyBytes from "pretty-bytes";
import fs from "fs";

const configNonDefault = await import("../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

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
        await client.login(process.env["DISCORD_TOKEN"]);
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
    const channel = await client.channels.cache.get(
        config.generic.generic_info_channel
    );
    if (channel) {
        channel.send("its pepper time 🌶");
    } else {
        log.error("no channel");
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

process.on("uncaughtException", (err, origin) => {
    log.fatal(err);
});

process.on("exit", () => {
    log.info("exiting pepperbot");
});

init();
