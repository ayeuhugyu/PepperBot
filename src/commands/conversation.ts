import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, Collection, GuildMember, Message, StageChannel, VoiceChannel } from "discord.js";
import { Command, CommandAccess, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { CommandAccessTemplates, getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { APIParameters, getConversation, generateImage, GPTModelName, models } from "../lib/gpt";
import { textToAttachment } from "../lib/attachment_manager";
import { CommandTag, SubcommandDeploymentApproach, CommandOptionType, InvokerType } from "../lib/classes/command_enums";

const templateAPIParameters = new APIParameters();

let lastUsedImageAt: { [key: string]: number } = {};
let currentlyGenerating: { [key: string]: boolean } = {};
const imageCooldown = 4 * 60 * 60 * 1000; // 4 hours

const image = new Command(
    {
        name: 'image',
        description: 'generates an image',
        long_description: 'generates an image from the provided prompt',
        tags: [CommandTag.AI],
        example_usage: "p/conversation get",
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

const modelcommand = new Command(
    {
        name: 'model',
        description: 'set the model for your conversation',
        long_description: 'allows you to change which AI model your conversation uses',
        tags: [],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'model',
                description: 'the AI model to use for the conversation.',
                long_description: 'the AI model to use for the conversation. ',
                type: CommandOptionType.String,
                required: true,
                choices: Object.keys(GPTModelName).map(key => {
                    // Filter out the numeric keys from the enum
                    if (isNaN(Number(key))) {
                        return { name: key, value: key };
                    }
                }).filter(choice => choice !== undefined) as { name: string, value: string }[] // Filter out undefined values
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "d/gpt model gpt-3.5-turbo",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["model"]),
    async function execute ({ invoker, args, guild_config }) {
        if (!args.model) {
            await action.reply(invoker, {
                content: "you must provide a model name or 'list'/'ls' to view available models.",
                ephemeral: guild_config.useEphemeralReplies,
            });
            return new CommandResponse({
                error: true,
                message: "you must provide a model name or 'list'/'ls' to view available models.",
            });
        }

        if (args.model === "list" || args.model === "ls") {
            const mappedModels = Object.entries(models).map(([key, value]) => {
                return `${value.name}:
  - provider: ${value.provider}
  - capabilities: ${value.capabilities ? value.capabilities.join(", ") : "none"}
                `
            });
            await action.reply(invoker, {
                content: `available models: \`\`\`md\n${mappedModels.join("\n")}\`\`\``,
                ephemeral: guild_config.useEphemeralReplies,
            });
            return;
        }
        const modelName = GPTModelName[args.model as keyof typeof GPTModelName]
            || GPTModelName[args.model.toUpperCase() as keyof typeof GPTModelName]
            || GPTModelName[args.model.toLowerCase() as keyof typeof GPTModelName]
            || Object.keys(GPTModelName).find(key => key.startsWith(args.model))
            || Object.values(GPTModelName).find(value => typeof value === "string" && value.startsWith(args.model));
        const modelInfo = models[modelName];
        if (!modelInfo) {
            await action.reply(invoker, {
                content: `model '${args.model}' does not exist. use 'list' or 'ls' to view available models.`,
                ephemeral: guild_config.useEphemeralReplies,
            });
            return new CommandResponse({
                error: true,
                message: `model '${args.model}' does not exist. use 'list' or 'ls' to view available models.`,
            });
        }

        const conversation = await getConversation(invoker as Message);
        // Check if the model is already set to avoid unnecessary updates
        if (conversation.api_parameters.model === modelInfo) {
            await action.reply(invoker, {
                content: `model is already set to ${modelInfo.name}.`,
                ephemeral: guild_config.useEphemeralReplies,
            });
            return new CommandResponse({
                error: true,
                message: `model is already set to ${modelInfo.name}.`,
            });
        }
        // Update the model in the conversation
        conversation.api_parameters.model = modelInfo;

        await action.reply(invoker, {
            content: `set current model to ${modelInfo.name}`,
            ephemeral: guild_config.useEphemeralReplies,
        });
    }
);

const setparam = new Command(
    {
        name: 'setparam',
        description: 'allows you to change parameters for the gpt conversation',
        long_description: 'allows you to change parameters for the gpt conversation, notably things like temperature and top_p',
        tags: [CommandTag.AI],
        example_usage: "p/conversation setparam temperature 1",
        options: [
            new CommandOption({
                name: 'parameter',
                description: 'the parameter to change',
                type: CommandOptionType.String,
                required: true,
                choices: Object.keys(templateAPIParameters)
                    .filter(key => key !== "model")
                    .map(key => { return { name: key, value: key } })
            }),
            new CommandOption({
                name: 'value',
                description: 'the value to set the parameter to',
                type: CommandOptionType.Number,
                required: true,
            })
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.TwoStringFirstSpaceSecondWholeMessage, ["parameter", "value"]),
    async function execute ({ args, invoker, guild_config }) {
        if (!args.parameter) {
            action.reply(invoker, { content: "parameter is required", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "parameter is required",
            });
        }
        if (!args.value) {
            action.reply(invoker, { content: "value is required", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "value is required",
            });
        }
        const parameter = args.parameter;
        const value = args.value;
        if (!templateAPIParameters.hasOwnProperty(parameter)) {
            action.reply(invoker, { content: `invalid parameter: \`${parameter}\`. must be one of the following: \`${Object.keys(templateAPIParameters).filter(key => key !== "model").join(", ")}\``, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `invalid parameter: \`${parameter}\`. must be one of the following: \`${Object.keys(templateAPIParameters).filter(key => key !== "model").join(", ")}\``,
            });
        }
        // constraints on values
        switch (parameter) {
            case "temperature": {
                if (value < 0 || value > 2) {
                    action.reply(invoker, { content: "temperature must be between 0 and 2", ephemeral: guild_config.other.use_ephemeral_replies });
                    return;
                }
                break;
            }
            case "top_p": {
                if (value < 0 || value > 1) {
                    action.reply(invoker, { content: "top_p must be between 0 and 1", ephemeral: guild_config.other.use_ephemeral_replies });
                    return;
                }
                break;
            }
            case "presence_penalty": {
                if (value < -2 || value > 2) {
                    action.reply(invoker, { content: "presence_penalty must be between -2 and 2", ephemeral: guild_config.other.use_ephemeral_replies });
                    return;
                }
                break;
            }
            case "frequency_penalty": {
                if (value < -2 || value > 2) {
                    action.reply(invoker, { content: "frequency_penalty must be between -2 and 2", ephemeral: guild_config.other.use_ephemeral_replies });
                    return;
                }
                break;
            }
            case "max_tokens": {
                if (value < 0 || value > 4096) {
                    action.reply(invoker, { content: "max_tokens must be between 0 and 4096", ephemeral: guild_config.other.use_ephemeral_replies });
                    return;
                }
                break;
            }
            default: break;
        }
        const conversation = await getConversation(invoker as Message);
        type APIParameterKeys = Exclude<keyof APIParameters, "model">;
        conversation.api_parameters[parameter as APIParameterKeys] = parseInt(value);

        await action.reply(invoker, { content: `set \`${parameter}\` to \`${value}\``, ephemeral: guild_config.other.use_ephemeral_replies });
        return;
    }
);

const get = new Command(
    {
        name: 'get',
        description: 'returns your gpt conversation',
        long_description: 'returns your gpt conversation. Append any text after the command to receive the full conversation output.',
        tags: [CommandTag.Debug],
        example_usage: "p/conversation get full",
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'full',
                description: 'whether to return the full conversation output',
                type: CommandOptionType.Boolean,
                required: false,
            }),
        ]
    },
    // Using SingleStringWholeMessage to capture extra text which if non-empty means "full" is true
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["full"]),
    async function execute ({ invoker, args, guild_config }) {
        const conversation = await getConversation(invoker as Message);
        // "full" is true if there's any extra text after the command
        const full = !!(args.full && args.full.trim().length);
        const output = conversation.toReasonableOutput(full);
        const file = textToAttachment(JSON.stringify(output, null, 2), "conversation.txt");
        await action.reply(invoker, { content: "here's your conversation", files: [file], ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { input_text: JSON.stringify(output, null, 2) } });
    }
);

const clear = new Command(
    {
        name: 'clear',
        description: 'removes you from your current conversation',
        long_description: 'removes your from your current conversation',
        tags: [CommandTag.AI],
        example_usage: "p/conversation clear",
        pipable_to: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ invoker, guild_config }) {
        const conversation = await getConversation(invoker as Message);
        conversation.removeUser(invoker.author);
        action.reply(invoker, { content: "removed you from your current conversation", ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const command = new Command(
    {
        name: 'conversation',
        description: 'various gpt conversation related commands',
        long_description: 'allows you to manipulate your conversation with the AI',
        tags: [CommandTag.AI],
        example_usage: "p/conversation get",
        subcommands: {
            deploy:  SubcommandDeploymentApproach.Split,
            list: [get, setparam, clear, image, modelcommand],
        },
        aliases: ["conv", "gpt"],
        options: [],
        pipable_to: [] // todo: fix this so it just works on subcommands
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {
        if (!args.subcommand) {
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