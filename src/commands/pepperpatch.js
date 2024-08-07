import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";
import default_embed from "../lib/default_embed.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const data = new CommandData();
data.setName("pepperpatch");
data.setDescription("send the update!!!");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["peppersmallupdate"]);
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
    async function execute(message, args, isInteraction) {
        if (args.get("message")) {
            const persistent_data = await JSON.parse(
                fs.readFileSync("resources/data/persistent_data.json")
            );
            const embed = default_embed()
                .setTitle(`SMALL UPDATE/PATCH ${persistent_data.version}`)
                .setDescription(args.get("message"));
            const sent = await action.sendMessage(
                message.client.channels.cache.get("1171660137946157146"),
                {
                    embeds: [embed],
                }
            );
            if (isInteraction) {
                action.reply(message, { content: "sent!", ephemeral: true });
            }
            sent.crosspost();
            action.deleteMessage(message);
        } else {
            action.reply(message, "provide a message to say you baffoon!");
        }
    }
);

export default command;
