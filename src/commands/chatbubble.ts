import { AttachmentBuilder, Collection, Message } from "discord.js";
import { Command, CommandCategory, CommandOption, CommandOptionType, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import fs from "fs";
import sharp from "sharp";
import { evaluate } from "mathjs";
import * as log from "../lib/log";
import { get } from "http";

type Gravity = "south" | "north"

const command = new Command(
    {
        name: 'chatbubble',
        description: 'creates a chatbubble out of the provided image or url',
        long_description: 'creates a chatbubble out of the provided image or url',
        category: CommandCategory.Utility,
        pipable_to: [],
        argument_order: "any",
        contributors: [
            {
                name: "reidlab",
                userid: "436321340304392222"
            },
            {
                name: "ayeuhugyu",
                userid: "440163494529073152"
            }
        ],
        options: [
            new CommandOption({
                name: 'image',
                description: 'the image to create a chatbubble out of',
                required: false,
                type: CommandOptionType.Attachment
            }),
            new CommandOption({
                name: 'url',
                description: 'url of the image to create a chatbubble out of',
                required: false,
                type: CommandOptionType.String
            }),
            new CommandOption({
                name: 'x',
                description: 'x position of the chatbubble',
                required: false,
                type: CommandOptionType.String
            }),
            new CommandOption({
                name: 'y',
                description: 'y position of the chatbubble',
                required: false,
                type: CommandOptionType.String
            }),
            new CommandOption({
                name: 'gravity',
                description: 'gravity of the chatbubble',
                required: false,
                type: CommandOptionType.String,
                choices: [
                    { name: 'south', value: 'south' },
                    { name: 'north', value: 'north' }
                ]
            }),
        ]
    }, 
    async function getArguments ({ message, self, guildConfig }) {
        message = message as Message;
        const args = new Collection();
        const commandLength = `${guildConfig.other.prefix}${self.name}`.length;
        const text = message.content.slice(commandLength)?.trim();
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const foundUrls = text.match(urlRegex);
        if (foundUrls && foundUrls.length > 0) {
            args.set('url', foundUrls[0]);
        }
        const gravityMatch = text.match(/(south|north)/);
        if (gravityMatch) {
            args.set('gravity', gravityMatch[0]);
        }
        const xMatch = text.match(/ x=([^\s]+)/);
        if (xMatch) {
            args.set('x', xMatch[1]);
        }
        const horizontalMatch = text.match(/(left|center|right)/);
        if (horizontalMatch) {
            args.set('x', horizontalMatch[0]);
        }
        const yMatch = text.match(/ y=([^\s]+)/);
        if (yMatch) {
            args.set('y', yMatch[1]);
        }

        args.set('image', message.attachments.first());
        return args;
    },
    async function execute ({ message, piped_data, args, guildConfig }) {
        if (["left", "center", "right"].includes(args?.get("x"))) {
            switch (args?.get("x")) {
                case "left":
                    args.set("x", "1/4");
                    break;
                case "center":
                    args.set("x", "1/2");
                    break;
                case "right":
                    args.set("x", "3/4");
                    break;
            }
        }
        console.log(args)
        const xPos = evaluate(args?.get("x") || "") || (1 / 3);
        const yPos = evaluate(args?.get("y") || "") || (1 / 4);
        if (args?.get("gravity") && !["south", "north"].includes(args?.get("gravity"))) {
            await action.reply(message, { content: "invalid gravity; must be \"south\" or \"north\", not " + args?.get("gravity"), ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        const gravity: Gravity = args?.get("gravity") || (Math.random() > 0.5 ? "south" : "north");
        if (!args?.get("url") && !args?.get("image") && !piped_data?.data?.chatbubble_url) {
            await action.reply(message, { content: "i cant make the air into a chatbubble, gimme an image", ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        const imageUrl = args?.get("url") || args?.get("image")?.url || piped_data?.data?.chatbubble_url;

        const inputImageBuffer = await fetch(imageUrl).then(res => res.arrayBuffer());
        const inputImage = await sharp(inputImageBuffer, { animated: true });
        
        let metadata: sharp.Metadata;
        try {
            metadata = await sharp(inputImageBuffer).metadata();
        } catch (err) {
            log.error(err);
            action.reply(message, { content: "uh oh! invalid image?", ephemeral: guildConfig.other.use_ephemeral_replies });
            return;
        }
        // ....i don't think it's possible for this to be null
        // i am ignoring it
        const width = metadata.width as number;
        const height = metadata.height as number;
        
        const tailCurveDepth = 5 / 8;
        const tailWidth = 40;
        const tailShift = (xPos <= (1/3) || xPos >= (2/3)) ? Math.round(xPos) : xPos;
        
        const tailSvg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <path d="
                    M 0, 0
                    Q ${width / 2}, ${height * yPos * tailCurveDepth} ${width}, 0
                " fill="white" stroke="none"/>
                <polygon points="
                    ${width * tailShift - tailWidth}, 0
                    ${width * tailShift + tailWidth}, 0
                    ${width * xPos}, ${height * yPos}
                " fill="white" stroke="none"/>
            </svg>
        `;
        
        const overlayBuffer = await sharp(Buffer.from(tailSvg))
            .png()
            .toBuffer();
        
        const outputBuffer = await inputImage
            .composite([{
                input: overlayBuffer,
                blend: "dest-out",
                gravity: gravity,
                tile: true,
            }])
            .toFormat("gif")
            .toBuffer();
        
        action.reply(message, { 
            content: "here's your chat bubble",
            files: [new AttachmentBuilder(outputBuffer, { name: "bubble.gif" })]
        })
    }
);

export default command;