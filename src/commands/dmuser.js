import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

const data = new CommandData();
data.setName("dmuser");
data.setDescription("make the bot dm someone");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(false);
data.setDMPermission(false);
data.setAliases(["dm"]);
data.addUserOption((option) =>
    option.setName("user").setDescription("who to dm").setRequired(true)
);
data.addStringOption((option) =>
    option.setName("message").setDescription("what to say").setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        if (message.mentions.users.first()) {
            args.set("user", message.mentions.users.first());
        } else {
            if (message.client.users.cache.get(message.content.split(" ")[1])) {
                args.set(
                    "user",
                    message.client.users.cache.get(
                        message.content.split(" ")[1]
                    )
                );
            }
        }
        if (args.get("user")) {
            args.set(
                "message",
                message.content.slice(
                    config.generic.prefix.length +
                        commandLength +
                        message.content.split(" ")[1].length +
                        1
                )
            );
        }
        return args;
    },
    async function execute(message, args, isInteraction) {
        if (args.get("user")) {
            if (args.get("message")) {
                action.sendDM(args.get("user"), args.get("message"));
                action.deleteMessage(message);
                if (isInteraction) {
                    action.reply(message, {
                        content: "sent!",
                        ephemeral: true,
                    });
                }
            } else {
                action.reply(message, "provide a valid message you baffoon!");
            }
        } else {
            action.reply(message, "provide a valid user to dm you baffoon!");
        }
    }
);

export default command;
