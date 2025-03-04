import { AttachmentBuilder, Collection, Message } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import sharp from "sharp";
import { evaluate } from "mathjs";
import * as log from "../lib/log";
import { CommandTag, CommandOptionType } from "../lib/classes/command_enums";

type Gravity = "south" | "north"

const command = new Command(
    {
        name: 'chatbubble',
        description: 'creates a chatbubble out of the provided image or url',
        long_description: 'creates a chatbubble out of the provided image or url. you can specify where the chatbubble should be placed.',
        tags: [CommandTag.Utility, CommandTag.ImagePipable],
        pipable_to: [],
        argument_order: "any",
        contributors: [
            {
                name: "reidlab",
                user_id: "436321340304392222"
            },
            {
                name: "ayeuhugyu",
                user_id: "440163494529073152"
            }
        ],
        options: [
            new CommandOption({
                name: 'image',
                description: 'the image to create a chatbubble out of',
                required: false,
                long_requirements: "if url is undefined",
                type: CommandOptionType.Attachment
            }),
            new CommandOption({
                name: 'url',
                description: 'url of the image to create a chatbubble out of',
                required: false,
                long_requirements: "if image is undefined",
                type: CommandOptionType.String
            }),
            new CommandOption({
                name: 'x',
                description: 'x position of the chatbubble',
                long_description: 'an expression representing the x position of the end of the tail of the chatbubble. prefixed with "x=", alternatively just type "left", "center", or "right" for 1/4, 1/2, or 3/4 respectively',
                required: false,
                type: CommandOptionType.String
            }),
            new CommandOption({
                name: 'y',
                description: 'y position of the chatbubble',
                long_description: 'an expression representing the y position of the end of the tail of the chatbubble. prefixed with "y="',
                required: false,
                type: CommandOptionType.String
            }),
            new CommandOption({
                name: 'gravity',
                description: 'gravity of the chatbubble',
                long_description: 'gravity of the chatbubble; whether the chatbubble should be placed at the top or bottom of the image. north is top, south is bottom',
                required: false,
                type: CommandOptionType.String,
                choices: [
                    { name: 'south', value: 'south' },
                    { name: 'north', value: 'north' }
                ]
            }),
        ],
        example_usage: ["p/chatbubble x=1/3 y=1/4 https://example.com/image.png", "p/chatbubble x=0.5, y=0.25 <attach your image>", "p/chatbubble left <attach your image>"],
        aliases: ["cb", "sb", "speechbubble", "bubble"]
    },
    async function getArguments ({ invoker, command_name_used, guild_config }) {
        invoker = invoker as Message<true>;
        const args = new Collection();
        const commandLength = `${guild_config.other.prefix}${command_name_used}`.length;
        const text = invoker.content.slice(commandLength)?.trim();
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const foundUrls = text.match(urlRegex);
        if (foundUrls && foundUrls.length > 0) {
            args.set('url', foundUrls[0]);
        }
        const gravityMatch = text.match(/(south|north)/);
        if (gravityMatch) {
            args.set('gravity', gravityMatch[0]);
        }
        const horizontalMatch = text.match(/(left|center|right)/);
        if (horizontalMatch) {
            args.set('x', horizontalMatch[0]);
        }
        const xMatch = text.match(/x=([^\s]+)/);
        if (xMatch) {
            args.set('x', xMatch[1]);
        }
        const yMatch = text.match(/y=([^\s]+)/);
        if (yMatch) {
            args.set('y', yMatch[1]);
        }

        args.set('image', invoker.attachments.first());
        return args;
    },
    async function execute ({ invoker, piped_data, args, guild_config }) {
        if (["left", "center", "right"].includes(args.x || "")) {
            switch (args.x) {
                case "left":
                    args["x"] = "1/4";
                    break;
                case "center":
                    args["x"] = "1/2"
                    break;
                case "right":
                    args["x"] = "3/4";
                    break;
            }
        }

        let xPos
        let yPos
        if (!args.x) args["x"] = "1/3";
        if (!args.y) args["y"] = "1/4";

        try {
            xPos = evaluate(args["x"] || "");
            yPos = evaluate(args["y"] || "");
        } catch (err) {
            log.error(err);
            await action.reply(invoker, { content: "error parsing inputs... are they valid math expressions? space seperated?", ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }

        if (args.gravity && !["south", "north"].includes(args.gravity)) {
            await action.reply(invoker, { content: "invalid gravity; must be \"south\" or \"north\", not " + args.gravity, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        }

        const gravity: Gravity = (args.gravity as Gravity) || "north";
        if (!args.url && !args.image && !piped_data?.data?.image_url) {
            await action.reply(invoker, { content: "i cant make the air into a chatbubble, gimme an image", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        }

        const imageUrl = args.url || args.image?.url || piped_data?.data?.image_url;

        if (!imageUrl) {
            await action.reply(invoker, { content: "i cant make the air into a chatbubble, gimme an image", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        } // this is just to satisfy typescript i think it should be impossible to get here

        const inputImageBuffer = await fetch(imageUrl).then(res => res.arrayBuffer());
        const inputImage = await sharp(inputImageBuffer, { animated: true });

        let metadata: sharp.Metadata;
        try {
            metadata = await sharp(inputImageBuffer).metadata();
        } catch (err) {
            log.error(err);
            await action.reply(invoker, { content: "uh oh! invalid image?", ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }

        // i don't think it's possible for this to be null/undefined
        // i am ignoring it for now 😊
        const width = metadata.width as number;
        const height = metadata.height as number;

        const tailCurveDepth = 5 / 8;
        const tailWidth = 40;
        const tailShift = (xPos <= (1/3) || xPos >= (2/3)) ? Math.round(xPos) : xPos;

        const overlayFlipped = gravity === "south";
        const overlaySvg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <path d="
                    M 0, ${overlayFlipped ? height : 0}
                    Q
                        ${width / 2},
                        ${height * (overlayFlipped ? (1 - yPos * tailCurveDepth) : yPos * tailCurveDepth)} ${width},
                        ${overlayFlipped ? height : 0}
                " fill="white" stroke="none"/>
                <polygon points="
                    ${width * tailShift - tailWidth}, ${overlayFlipped ? height : 0}
                    ${width * tailShift + tailWidth}, ${overlayFlipped ? height : 0}
                    ${width * xPos}, ${height * (overlayFlipped ? (1 - yPos) : (yPos))}
                " fill="white" stroke="none"/>
            </svg>
        `;

        const overlayBuffer = await sharp(Buffer.from(overlaySvg))
            .png()
            .toBuffer();

        const outputBuffer = await inputImage
            .composite([{
                input: overlayBuffer,
                blend: "dest-out",
                gravity: "center",
                tile: true,
            }])
            .toFormat("gif")
            .toBuffer();

        action.reply(invoker, {
            content: `here's your chat bubble\n x=\`${args.x || xPos}\`, y=\`${args.y || yPos}\`, gravity=\`${gravity}\``,
            files: [new AttachmentBuilder(outputBuffer, { name: "bubble.gif" })]
        })
    }
);

export default command;
