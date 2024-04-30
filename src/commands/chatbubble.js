import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { AttachmentBuilder, Collection } from "discord.js";
import sharp from "sharp";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

const data = new CommandData();
data.setName("chatbubble");
data.setDescription("SpeechMemeify [PROXY]");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setAliases(["cb", "sb", "speechbubble"]);
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
        .setRequired(true)
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
        if (!args.get("image") || !args.get("tail")) {
            action.reply(message, {
                content: "provide the correct arguments RETARD",
            });
            return;
        }

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

        const inputImg = await fetch(args.get("image").url);
        const inputImgBuf = await inputImg.arrayBuffer();

        let outputImg = await sharp(inputImgBuf, { animated: true });
        const outputImgMetadata = await outputImg.metadata();

        let tailImg;
        switch (args.get("tail")) {
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

        tailImg.toFile("fuck.png", (err, inf) => {});
        console.log(
            `fullHeight: ${fullHeight}, tailHeight: ${tailHeight}, reportedHeight: ${await tailImg
                .metadata()
                .then((metadata) => metadata.height)}`
        );

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

        action.reply(message, {
            content: "hewwo :3 here is your chat bubble pookie-wookie bear!",
            files: [
                new AttachmentBuilder(outputImg, { name: "chatbubble.gif" }),
            ],
        });
    }
);

export default command;
