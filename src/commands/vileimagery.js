import * as action from "../lib/discord_action.js";
import { Collection } from "discord.js";
import default_embed from "../lib/default_embed.js";
import * as textfiles from "../lib/files.js";
import fs from "fs";
import { Command, CommandData } from "../lib/types/commands.js";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

const files = fs
    .readdirSync(config.paths.vile_imagery)
    .filter((file) => file.endsWith(".png"));

const data = new CommandData();
data.setName("vileimagery");
data.setDescription("return some fucked up shit");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.addStringOption((option) =>
    option.setName("image").setRequired(false).setDescription("image to attach")
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "image",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {
        let file;

        if (args.get("image")) {
            // if they specify an image

            const proposedfilename = args.get("image");
            if (proposedfilename.replaceAll(" ", "") == "ls") {
                const lsText = await textfiles.generateLSText(
                    `${config.paths.vile_imagery}`
                );
                const lsFile = await textfiles.textToFile(
                    lsText,
                    "vileimageryls"
                );
                action.reply(message, {
                    files: [
                        {
                            attachment: lsFile,
                            name: "vileimageryls.txt",
                        },
                    ],
                });
                return;
            }
            let possibleFilenames = {
                regular: proposedfilename,
                spaced: proposedfilename.replaceAll(" ", "_"),
                spacedPng: proposedfilename.replaceAll(" ", "_") + ".png",
                png: proposedfilename + ".png",
            };
            for (const value of Object.values(possibleFilenames)) {
                if (files.includes(value)) {
                    file = value;
                }
            } // basically just autocorrect
        }
        const embed = default_embed();
        if (file && args.get("image")) {
            // if the file they wanted exists
            if (message.reference) {
                const reference = message.client.channels.cache
                    .get(message.reference.channelId)
                    .messages.cache.get(message.reference.messageId);
                action.reply(reference, {
                    files: [`${config.paths.vile_imagery}/${file}`],
                });
                if (!fromInteraction) action.deleteMessage(message);
                return;
            }
            embed.setTitle(file.replaceAll("_", " ").replaceAll(".png", ""));
            embed.setImage(`attachment://${file}`);
            action.reply(message, {
                embeds: [embed],
                files: [`${config.paths.vile_imagery}/${file}`],
            });
        } else if (args.get("image")) {
            const maxRan = files.length;
            const randomnum = Math.floor(Math.random() * maxRan);
            file = files[randomnum];
            if (message.reference) {
                action.reply(message, {
                    content: "There's no such thing!",
                    ephemeral: true,
                });
                return;
            }
            embed.setTitle(file.replaceAll("_", " ").replaceAll(".png", ""));
            embed.setDescription("There's no such thing!");
            embed.setImage(`attachment://${file}`);
            action.reply(message, {
                embeds: [embed],
                files: [`${config.paths.vile_imagery}/${file}`],
            });
        }
        if (!args.get("image")) {
            const maxRan = files.length;
            const randomnum = Math.floor(Math.random() * maxRan);
            file = files[randomnum];
            if (message.reference) {
                const reference = message.client.channels.cache
                    .get(message.reference.channelId)
                    .messages.cache.get(message.reference.messageId);
                action.reply(reference, {
                    files: [`${config.paths.vile_imagery}/${file}`],
                });
                if (!fromInteraction) action.deleteMessage(message);
                return;
            }
            embed.setTitle(file.replaceAll("_", " ").replaceAll(".png", ""));
            embed.setImage(`attachment://${file}`);
            action.reply(message, {
                embeds: [embed],
                files: [`${config.paths.vile_imagery}/${file}`],
            });
        }
    }
);

export default command;
