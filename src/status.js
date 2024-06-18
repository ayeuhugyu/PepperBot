import { Client, GatewayIntentBits, Events, Partials } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
import process from "node:process";

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

client.on(Events.ClientReady, async () => {
    client.user.setActivity("to the pepper whispers.", {
        type: "LISTENING",
    });
    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
