import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";
import default_embed from "../lib/default_embed.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const data = new CommandData();
data.setName("pepperannouncement");
data.setDescription("send the announcement!!!");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.addStringOption((option) =>
    option.setName("message").setDescription("what to say").setRequired(true)
);
data.setAliases(["pepperannounce"]);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "message",
            message.content
                .slice(prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, isInteraction) {
        if (args.get("message")) {
            const embed = default_embed()
                .setTitle(`IMPORTANT PEPPERBOT ANNOUNCEMENT`)
                .setDescription(args.get("message"));
            const sent = await action.sendMessage(
                message.client.channels.cache.get("1171660137946157146"),
                {
                    content: `<@&1210034891018993755> PepperBot Announcement! 🌶`,
                    embeds: [embed],
                }
            );

            if (isInteraction) {
                action.reply(message, { content: "sent!", ephemeral: true });
            }
            action.deleteMessage(message);
            sent.crosspost();
        } else {
            action.reply(message, "provide a message to say you baffoon!");
        }
    }
);

export default command;
