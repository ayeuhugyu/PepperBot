import * as action from "../lib/discord_action.js";
import * as log from "../lib/log.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { AttachmentBuilder, Collection } from "discord.js";
import sharp from "sharp";
import * as globals from "../lib/globals.js";
import { error } from "shelljs";

const config = globals.config;

const data = new CommandData();
data.setName("chatbubble");
data.setDescription("SpeechMemeify [PROXY]");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setAliases(["cb", "sb", "speechbubble", "bubble"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.addAttachmentOption((option) =>
    option
        .setName("image")
        .setDescription("the image to chat bubble")
        .setRequired(true)
);
data.addStringOption((option) =>
    option
        .setName("tail")
        .setDescription("the position of the end of the tail")
        .setRequired(false)
        .addChoices(
            { name: "left", value: "left" },
            { name: "center", value: "center" },
            { name: "right", value: "right" }
        )
);

const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set("image", message.attachments.first());
        args.set(
            "tail",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {
        let tail = args.get("tail");
        if (!args.get("tail")) tail = "left";
        if (!args.get("image")) {
            action.reply(message, {
                content: "provide the correct arguments RETARD",
            });
            return;
        }
        let replied = false;

        const supportedFiletypes = [
            "jpeg",
            "jpg",
            "png",
            "webp",
            "gif",
            "tiff",
            "avif",
            "heif",
        ];
        const extension = args.get("image").name.split(".").pop();
        if (!supportedFiletypes.includes(extension)) {
            action.reply(message, {
                content:
                    "image format *probably* not supported, this is based off a list of sure supported ones",
            });
            return;
        }
        const originalImg = args.get("image");
        if (!originalImg.width || !originalImg.height) {
            action.reply(message, {
                content:
                    "this image does not appear to have a valid height or width defined. please try again with a different image.",
                ephemeral: true,
            });
            return;
        }
        if (originalImg.width > 4096 || originalImg.height > 4096) {
            action.reply(message, {
                content:
                    "image too big, please try again with a smaller image.",
                ephemeral: true,
            });
            return;
        }

        const sentReply = await action.reply(message, {
            ephemeral: true,
            content: "processing...",
        });
        let inputImg;
        let inputImgBuf;
        let outputImg;
        let outputImgMetadata;
        let errored = false;
        try {
            inputImg = await fetch(args.get("image").url);
            inputImgBuf = await inputImg.arrayBuffer();

            outputImg = await sharp(inputImgBuf, { animated: true });
            outputImgMetadata = await outputImg.metadata();
        } catch (e) {
            log.error(e);
            errored = true;
        }
        if (errored) {
            action.editMessage(sentReply, {
                ephemeral: true,
                content:
                    "there was an error processing/fetching this image, see logs for more details",
            });
            return;
        }

        let tailImg;
        switch (tail) {
            case "left":
                tailImg = sharp("resources/images/tails/tail_left.png");
                break;
            case "center":
                tailImg = sharp("resources/images/tails/tail_center.png");
                break;
            case "right":
                tailImg = sharp("resources/images/tails/tail_right.png");
                break;
        }

        const fullHeight =
            outputImgMetadata.pageHeight ?? outputImgMetadata.height;
        const tailHeight = Math.round(fullHeight / 4);
        tailImg = tailImg
            .resize({
                width: outputImgMetadata.width,
                height: tailHeight,
                fit: "fill",
            })
            .extend({
                bottom: fullHeight - tailHeight,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            });

        outputImg = await outputImg
            .composite([
                {
                    input: await tailImg.toBuffer(),
                    blend: "dest-out",
                    gravity: "north",
                    tile: true,
                },
            ])
            .toFormat("gif")
            .toBuffer();
        if (replied) return;
        replied = true;
        action.editMessage(sentReply, {
            content: "hewwo :3 here is your chat bubble pookie-wookie bear!",
            files: [
                new AttachmentBuilder(outputImg, { name: "chatbubble.gif" }),
            ],
        });
    }
);

export default command;
