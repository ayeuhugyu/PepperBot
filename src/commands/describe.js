import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";
import * as gpt from "../lib/gpt.js";
import default_embed from "../lib/default_embed.js";

const config = globals.config;

const supportedFileTypes = ['png', 'jpeg', 'gif', 'webp']

const data = new CommandData();
data.setName("describe");
data.setDescription("ask the ai to describe an image");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setAliases();
data.addAttachmentOption((option) =>
    option.setName("request").setDescription("the image to describe").setRequired(false)
);
data.addStringOption((option) => 
    option.setName("url").setDescription("url of the image to describe").setRequired(false)
)
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "request",
            message.attachments.first()
        );
        args.set("url", message.content
            .slice(prefix.length + commandLength)
            .trim())
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (!args.get("request") && !args.get("url")) {
            return action.reply(message, "no request provided");
        }
        if (args.get("request")) {
            if (args.get("request").size >= 20000000) {
                return action.reply(message, "image too large; openAI enforces a maximum of 20 MB.");
            }
            if (!supportedFileTypes.includes(args.get("request").name.split('.').pop())) {
                return action.reply(message, "unsupported file type; only png, jpeg, gif, and webp are supported by openAI.");
            }
        }
        
        if (args.get("url")) {
            if (args.get("url").length >= 2000) {
                return action.reply(message, "url too long; openAI enforces a maximum of 2000 characters.");
            }
            if (!args.get("url").startsWith("http")) {
                return action.reply(message, "invalid url; make sure to include the protocol (http/https).");
            }
        }
        let url = args.get("url");
        if (args.get("request") && args.get("url")) {
            url = false;
        }

        const ephemeral = gconfig.useEphemeralReplies || gconfig.disableGPTResponses || (gconfig.blacklistedGPTResponseChannelIds && message.channel && gconfig.blacklistedGPTResponseChannelIds.includes(message.channel.id))
        const processingMessage = await action.reply(message, { content: "processing...", ephemeral: ephemeral });
        try {
            const caption = await gpt.captionImage(url || args.get("request").url, message.author.id);
            if (typeof caption == "object" && caption.error) {
                return action.editMessage(processingMessage, { content: `there was an error processing your image: \`\`\`${caption.error.message}\`\`\``, ephemeral: ephemeral });
            }
            if (!caption) {
                return action.editReply(processingMessage, "error processing image");
            }
            const embed = default_embed()
                .setTitle(args.get("request") ? args.get("request").name : url.split('/').pop().split('?')[0])
                .setDescription(caption)
                .setImage(args.get("request") ? args.get("request").url : url);
            return action.editMessage(processingMessage, { content: "heres your description!", embeds: [embed], ephemeral: ephemeral });
        } catch (err) {
            log.error(err)
        }
    },
    [] // subcommands
);

export default command;