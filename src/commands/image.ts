import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import { generateImage } from "../lib/gpt";
import { Message } from "discord.js";
import { FFmpeggy } from "ffmpeggy";
import { randomUUIDv7 } from "bun";
import fs from "fs";

function downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const request = require('request');
        request({ url, encoding: null }, (error: any, response: any, body: Buffer) => {
            if (error) {
                reject(error);
            } else if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image. Status code: ${response.statusCode}`));
            } else {
                resolve(body);
            }
        });
    });
}

function genericFFmpeg(buffer: Buffer, format: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const filename = randomUUIDv7()
        const path = `cache/ffmpeg/input_${filename}.tmp`;
        fs.writeFileSync(path, buffer);
        const ffmpeg = new FFmpeggy();
        ffmpeg
            .setInput(path)
            .setOutput(`cache/ffmpeg/output_${filename}.${format}`)
            .run()

        ffmpeg.done()

        resolve(`cache/ffmpeg/output_${filename}.${format}`);
    });
}

const encoders: Record<string, (imageUrl: string) => Promise<string>> = {
    png: async (imageUrl: string) => {
        return genericFFmpeg(await downloadImage(imageUrl), "png");
    },
    jpg: async (imageUrl: string) => {
        return genericFFmpeg(await downloadImage(imageUrl), "jpg");
    },
    jpeg: async (imageUrl: string) => {
        return genericFFmpeg(await downloadImage(imageUrl), "jpeg");
    },
    gif: async (imageUrl: string) => {
        return genericFFmpeg(await downloadImage(imageUrl), "gif");
    },
    webp: async (imageUrl: string) => {
        return genericFFmpeg(await downloadImage(imageUrl), "webp");
    }
}

const convert = new Command(
    {
        name: 'convert',
        description: 'converts an image to a different format',
        long_description: 'converts an image to a different format.',
        tags: [CommandTag.Utility, CommandTag.ImagePipable],
        pipable_to: [CommandTag.ImagePipable],
        options: [
            new CommandOption({
                name: 'image',
                description: 'the image to convert',
                long_description: 'the image to convert',
                type: CommandOptionType.String,
                required: true
            }),
            new CommandOption({
                name: 'format',
                description: 'the format to convert the image to',
                long_description: 'the format to convert the image to',
                type: CommandOptionType.String,
                required: true,
                choices: [
                    { name: "png", value: "png" },
                    { name: "jpg", value: "jpg" },
                    { name: "jpeg", value: "jpeg" },
                    { name: "gif", value: "gif" },
                    { name: "webp", value: "webp" }
                ]
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/image convert png <attach your image>",
        aliases: ["encode", "format"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["format", "image"]),
    async function execute ({ invoker, args, guild_config }) {

    }
);

let lastUsedImageAt: { [key: string]: number } = {};
let currentlyGenerating: { [key: string]: boolean } = {};
const imageCooldown = 4 * 60 * 60 * 1000; // 4 hours

const image = new Command(
    {
        name: 'generate',
        description: 'generates an image',
        long_description: 'generates an image from the provided prompt',
        tags: [CommandTag.AI],
        example_usage: "p/image generate a forest with a river made of cats",
        options: [
            new CommandOption({
                name: 'prompt',
                description: 'the image to generate',
                type: CommandOptionType.String,
                required: true,
            }),
        ],
        pipable_to: [CommandTag.ImagePipable]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["prompt"]),
    async function execute ({ invoker, args, piped_data, will_be_piped, guild_config }) {
        const userId = invoker.author.id;

        if (currentlyGenerating[userId]) {
            await action.reply(invoker, {
                content: "you are already generating an image. please wait for it to finish.",
                ephemeral: guild_config.useEphemeralReplies
            });
            return new CommandResponse({
                error: true,
                message: "you are already generating an image. please wait for it to finish.",
            });
        }

        if (lastUsedImageAt[userId] && Date.now() - lastUsedImageAt[userId] < imageCooldown) {
            await action.reply(invoker, {
                content: `you can only generate an image every 4 hours (this stuff's expensive, sorry!). the next time you can generate an image is <t:${Math.floor((lastUsedImageAt[userId] + imageCooldown) / 1000)}:R> (<t:${Math.floor((lastUsedImageAt[userId] + imageCooldown) / 1000)}:T>).`,
                ephemeral: guild_config.useEphemeralReplies
            });
            return new CommandResponse({
                error: true,
                message: `you can only generate an image every 4 hours (this stuff's expensive, sorry!). the next time you can generate an image is <t:${Math.floor((lastUsedImageAt[userId] + imageCooldown) / 1000)}:R> (<t:${Math.floor((lastUsedImageAt[userId] + imageCooldown) / 1000)}:T>).`,
            });
        }

        currentlyGenerating[userId] = true;

        try {
            if (args.prompt) {
                const sent = await action.reply(invoker, { content: "generating image, please wait...", ephemeral: guild_config.useEphemeralReplies }) as Message;
                const url: any = await generateImage(args.prompt); // string | Error (but ts screams at me because its unknown)
                if (typeof url !== "string") {
                    await action.edit(sent, {
                        content: "failed to generate image. error: " + url.invoker,
                        ephemeral: guild_config.useEphemeralReplies
                    });
                    return;
                }
                lastUsedImageAt[userId] = Date.now();
                action.edit(sent, {
                    files: [{ name: "image.png", attachment: url }],
                    content: `image generated from prompt: \`${args.prompt}\`\nopenai deletes these images after 60 minutes, so save the file if you want it for later. the next time you can generate an image is <t:${Math.floor((lastUsedImageAt[userId] + imageCooldown) / 1000)}:R> (<t:${Math.floor((lastUsedImageAt[userId] + imageCooldown) / 1000)}:T>). (this stuff's expensive, sorry!)`,
                });
                return new CommandResponse({ pipe_data: { image_url: url }});
            } else {
                action.reply(invoker, "provide a prompt to use you baffoon!");
                return;
            }
        } finally {
            currentlyGenerating[userId] = false;
        }
    }
);

const command = new Command(
    {
        name: 'image',
        description: 'various functions related to images',
        long_description: 'various functions related to images. allows you to generate images, describe images, or convert images to a different format.',
        tags: [CommandTag.Utility, CommandTag.AI],
        pipable_to: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/image generate a forest with a river made of cats",
        aliases: [],
        subcommands: {
            deploy: SubcommandDeploymentApproach.Merge,
            list: [image, convert]
        }
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: "invalid subcommand: " + args.subcommand,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        action.reply(invoker, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: guild_config.other.use_ephemeral_replies
        });
    }
);

export default command;