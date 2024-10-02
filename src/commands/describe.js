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

async function download(url, filename) {
    return new Promise((resolve, reject) => {
        const fixedFileName = filename
        fsExtra.ensureFileSync(`resources/gptdownloads/${fixedFileName}`);
        fetch(url).then((res) => {
            const ws = fs.createWriteStream(
                `resources/gptdownloads/${fixedFileName}`
            );
            stream.Readable.fromWeb(res.body).pipe(ws);
            ws.on("finish", () => resolve(true));
            ws.on("error", (err) => reject(err));
        });
    });
}

const data = new CommandData();
data.setName("describe");
data.setDescription("ask the ai to describe an image");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setAliases();
data.addAttachmentOption((option) =>
    option.setName("request").setDescription("what to describe").setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const args = new Collection();
        args.set(
            "request",
            message.attachments.first()
        );
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (!args.get("request")) {
            return action.reply(message, "no request provided");
        }
        const ephemeral = gconfig.useEphemeralReplies || gconfig.disableGPTResponses || (gconfig.blacklistedGPTResponseChannelIds && message.channel && gconfig.blacklistedGPTResponseChannelIds.includes(message.channel.id))
        const processingMessage = await action.reply(message, { content: "processing...", ephemeral: ephemeral });
        const caption = await gpt.captionImage(args.get("request").url)
        if (!caption) {
            return action.editReply(processingMessage, "error processing image");
        }
        const embed = default_embed()
            .setTitle(args.get("request").name)
            .setDescription(caption)
            .setImage(args.get("request").url);
        return action.editMessage(processingMessage, { embeds: [embed], ephemeral: ephemeral });
    },
    [] // subcommands
);

export default command;