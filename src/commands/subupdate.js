import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";
import fsextra from "fs-extra";
import default_embed from "../lib/default_embed.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const data = new CommandData();
data.setName("subupdate");
data.setDescription("send the update!!!");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
;
data.setAliases(["peppersubupdate"])
data.addStringOption((option) =>
    option.setName("message").setDescription("what to say").setRequired(true)
);
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
    async function execute(message, args, isInteraction, gconfig) {
        if (args.get("message")) {
            const embed = default_embed().setDescription(args.get("message"));
            const sent = await action.sendMessage(
                message.client.channels.cache.get("1171660137946157146"),
                {
                    embeds: [embed],
                }
            );
            const persistent_data = await JSON.parse(
                fs.readFileSync("resources/data/persistent_data.json")
            );
            const version = persistent_data.version;
            const writeFileMessage = await action.reply(
                message,
                "verifying file..."
            );
            fsextra.ensureFileSync(
                `resources/data/updates/${parseInt(version) + 1}.txt`
            );
            action.editMessage(writeFileMessage, "writing file...");
            fs.appendFileSync(
                `resources/data/updates/${parseInt(version) + 1}.txt`,
                `\n${args.get("message")}`
            );
            action.editMessage(writeFileMessage, "file written");
            if (isInteraction) {
                action.reply(message, { content: "sent!", ephemeral: gconfig.useEphemeralReplies });
            }
            action.deleteMessage(message);
            sent.crosspost();
        } else {
            action.reply(message, "provide a message to say you baffoon!");
        }
    }
);

export default command;
