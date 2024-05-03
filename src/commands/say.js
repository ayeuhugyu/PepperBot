import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";
import * as globals from "../lib/globals.js";

const config = globals.config;

const data = new CommandData();
data.setName("say");
data.setDescription("make the bot say something");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.addStringOption((option) =>
    option.setName("message").setDescription("what to say").setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "message",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (message.content.startsWith("p/say p/say")) {
            action.reply(message, `bro really thought 😂😂😂`);
            return;
        }
        if (args.get("message")) {
            action.sendMessage(message.channel, args.get("message"));
            if (fromInteraction) {
                console.log("from interaction");
                action.reply(message, {
                    content: "the deed is done.",
                    ephemeral: true,
                });
            }
            action.deleteMessage(message);
        } else {
            action.reply(message, "provide a message to say you baffoon!");
        }
    }
);

export default command;
