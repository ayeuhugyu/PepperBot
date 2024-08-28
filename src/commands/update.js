import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";
import * as globals from "../lib/globals.js";
import setversion from "./setversion.js";
import deploycommands from "./deploycommands.js";
import fsextra from "fs-extra";
import default_embed from "../lib/default_embed.js";

const config = globals.config;

const data = new CommandData();
data.setName("update");
data.setDescription(
    "perform all the actions i gotta do for updates in one command"
);
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
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
    async function execute(message, args, isInteraction) {
        if (args.get("message")) {
            const persistent_data = await JSON.parse(
                fs.readFileSync("resources/data/persistent_data.json")
            );
            const version = persistent_data.version;
            const setversionArgs = new Collection();
            setversionArgs.set("version", parseInt(version) + 1);
            const deployCommandsArgs = new Collection();
            deployCommandsArgs.set("guild", "global");
            await setversion.execute(message, setversionArgs, isInteraction);
            await deploycommands.execute(
                message,
                deployCommandsArgs,
                isInteraction
            );
            const writeFileMessage = await action.reply(
                message,
                "verifying file..."
            );
            fsextra.ensureFileSync(
                `resources/data/updates/${parseInt(version) + 1}.txt`
            );
            action.editMessage(writeFileMessage, "writing file...");
            fs.writeFileSync(
                `resources/data/updates/${parseInt(version) + 1}.txt`,
                args.get("message")
            );
            action.editMessage(writeFileMessage, "file written");
            const messageTextContent = args.get("patch") ? `PepperBot small update/patch! 🌶` : `<@&1210034891018993755> PepperBot update! 🌶`;
            const embed = default_embed()
                .setTitle(`VERSION ${version + 1}`)
                .setDescription(args.get("message"));
            const sent = await action.sendMessage(
                message.client.channels.cache.get("1171660137946157146"),
                {
                    content: messageTextContent,
                    bypassFixer: true,
                    embeds: [embed],
                }
            );

            if (isInteraction) {
                action.reply(message, { content: "sent!", ephemeral: true });
            }
            action.deleteMessage(message);
            sent.crosspost();
        } else {
            action.reply(message, "provide an update log you baffoon!");
        }
    }
);

export default command;
