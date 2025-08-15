import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config } from 'dotenv';
import * as log from './lib/log';
import fs from "fs";
import { listen } from './web/index';
import { queueAllEvents } from './lib/schedule_manager';
import { initializeMaintenanceMode } from './lib/maintenance_manager';
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

const eventFiles = fs
    .readdirSync("src/events")
for (const file of eventFiles) {
    (async () => {
        const event = await import(`./events/${file}`);

        client.on(event.default.name, (...args: any[]) => {
            setImmediate(() => {
                try {
                    event.default.execute(...args);
                } catch (error) {
                    log.error(`error in event ${event.default.name}:`, error);
                }
            });
        });

        log.info("registered event " + event.default.name);
    })();
}

client.once('ready', async () => {
    log.info(`logged in as ${client.user?.tag}`);

    // initialize maintenance mode from database
    await initializeMaintenanceMode();

    // web server starting has been moved to index.ts because in here it would start one for every single shard

    const channel = await client.channels.fetch("1312566483569741896").catch(() => {});
    if (channel) {
        if (channel.isSendable()) {
            channel.send(`it's pepper time 🌶️`);
        }
    }
});

async function init() {
    log.info("logging into discord...");
    try {
        await client.login(process.env.DISCORD_TOKEN);
        client.user?.setActivity("pepper whisperers.", { type: 2 });
        log.info("set client activity: " + `"pepper whisperers.", { type: 2 }`);
        await queueAllEvents(client);
        log.info("scheduled all events");
    } catch (err) {
        log.error("failed to login into discord. wifi down? token invalid?");
        log.error(err);
        process.exit(1);
    }
}
await init();
process.env.DISCORD_CLIENT_ID = client.user?.id || "0";
await listen(client);

process.on("warning", log.warn);
["unhandledRejection", "uncaughtException"].forEach((event) => {
    process.on(event, (err) => {
        log.fatal(`[PEPPERCRITICAL] bot.ts errored on ${event}: `);
        log.fatal(err);
        console.error(err) // incase of the stupid fucking combined error bullshit discordjs returns for embed errors
        process.exit(1);
    });
})