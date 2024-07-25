import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection, AttachmentBuilder } from "discord.js";
import fs, { readlink } from "fs";
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
        //args.set("attachments", message.attachments);
        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (
            message.content.startsWith(
                `${config.generic.prefix}say ${config.generic.prefix}say`
            ) ||
            message.content.startsWith(`d/say d/say`) ||
            message.content.startsWith(`p/say p/say`) ||
            message.content.startsWith(`p/say d/say`) ||
            message.content.startsWith(`d/say p/say`) // fuck you idc this shit sucks it fucking works and if i don't make a solution yall are gonna keep spamming me "Uhhh... You should fix that!!!" despite it literally not being an issue in the fucking first place
        ) {
            action.reply(message, `bro really thought 😂😂😂`);
            return;
        }
        if (args.get("message") || args.get("attachments")) {
            const obj = {};
            if (args.get("message")) {
                obj.content = args.get("message");
            }
            if (args.get("attachments")) {
                const realAttachments = [];
                args.get("attachments").forEach((attachment) => {
                    if (attachment.size > 20 * 1024 * 1024) {
                        return; // due to the way discordjs works, it downloads the image to a buffer and then reuploads it. i have no fking clue why it does this, but there's no way around it, so instead im just going to limit the file size
                    }
                    const att = {
                        attachment: attachment.url,
                        name: attachment.name,
                    };
                    realAttachments.push(att);
                });

                // Assign the processed attachments to obj.files
                obj.files = realAttachments; // THIS IS CURRENTLY DISABLED DUE TO BROKEN FUNCTIONALITY
            }
            action.sendMessage(message.channel, obj); // THIS FOR SOME FUCKING REASON GETS EXECUTED MULTIPLE TIMES AND I HAVE NO IDEA HOW TO FIX IT????
            if (fromInteraction) {
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
