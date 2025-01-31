import { Client, GatewayIntentBits, Events, Partials, Collection } from "discord.js";
import * as log from "./lib/log.js";
import util from "util";
import prettyBytes from "pretty-bytes";
import fs from "fs";
import * as globals from "./lib/globals.js";
import process from "node:process";
import * as theme from "./lib/theme.js";

const config = globals.config;

log.debug("update start timestamp for shard");
process.send({ action: "setStartedAt" });

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
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildModeration],
});

async function init() {
    log.info("initializing bot...");
    log.info("logging into discord...");
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
    let channel = await client.channels.cache.get("1312566483569741896");
    if (channel) {
        channel.send(`its pepper time ${theme.getThemeEmoji(theme.themes.CURRENT)}`);
    } else {
        let channels = await client.shard.fetchClientValues("channels.cache");
        const shards = channels.size;
        for (const shardChannels of channels) {
            for (const shardChannel of shardChannels) {
                if (shardChannel.id == "1312566483569741896") {
                    channel = shardChannel;
                    break;
                }
            }
        }
        if (!channel) {
            log.error("failed to find pepper channel");
        } else {
            channel.send(`its pepper time ${theme.getThemeEmoji(theme.themes.CURRENT)} ${client.shard.ids[0]}/${shards}`);
        }
    }

    client.user.setActivity("pepper whisperers.", { type: 2 });
    log.debug("edited presence");

    log.info("bot ready to serve");
    log.info(`running on ${process.platform} ${process.arch}`);
    const memory = process.memoryUsage();
    log.info(`${prettyBytes(memory.rss)} memory usage, ${prettyBytes(memory.heapUsed)} / ${prettyBytes(memory.heapTotal)} heap usage`);
});

await init();

const channel = await client.channels.fetch("1312566483569741896");

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

process.on("message", function (message) {
    if (message.action && message.action == "get_mem_usage") {
        const memory = process.memoryUsage();
        let memResponse = {
            rss: memory.rss,
            heapUsed: memory.heapUsed,
            heapTotal: memory.heapTotal,
        };
        process.send({
            action: "mem_response",
            mem: memResponse,
        });
    }
    if (message.action && message.action == "messageCreate") {
        //console.log(message)
        const event = import(`./events/MessageCreate.js`).then((event) => {
            //console.log(event)
            message.message.reply = new Function(`return ${message.message.reply}`)();
            message.message.react = new Function(`return ${message.message.react}`)();
            message.message.delete = new Function(`return ${message.message.delete}`)();
            message.message.edit = new Function(`return ${message.message.reply}`)();
            message.message.guild.members = new Collection();
            message.message.guild.channels = new Collection();
            message.message.guild.roles = new Collection();
            message.message.attachments = new Collection();
            message.message.guild.ownerID = "0";
            event.default.execute(message.message);
        });
    }
})