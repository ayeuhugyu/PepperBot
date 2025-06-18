import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import { generateImage } from "../lib/gpt/basic";
import { Message } from "discord.js";

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
            list: [image, /*convert*/]
        }
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use ${guild_config.other.prefix}help image for a list of subcommands`,
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