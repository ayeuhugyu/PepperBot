import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, Collection, GuildMember, Message, StageChannel, VoiceChannel } from "discord.js";
import { Command, CommandAccess, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { CommandAccessTemplates, getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { getConversation, conversations } from "../lib/gpt/main";
import { Model, Models as models } from "../lib/gpt/models";
import { textToAttachment } from "../lib/attachment_manager";
import { CommandTag, SubcommandDeploymentApproach, CommandOptionType, InvokerType } from "../lib/classes/command_enums";
import { DiscordAnsi as ansi } from "../lib/discord_ansi";
import { TextDisplay } from "../lib/classes/components";

function serializeModel(model: Model): string {
    return `${ansi.bold(ansi.green(model.name))} ${ansi.gray(`(${model.provider})`)}\n` +
        `${ansi.gray(model.description)}\n` +
        `${ansi.blue("capabilities: ")}${model.capabilities.join(', ')}` +
        ((model.whitelist && model.whitelist.length > 0) ? `\n${ansi.blue("whitelist: ")}${model.whitelist.join(', ')}` : '');
}

function serializeModelParameters(parameters: Model['parameters']): string {
    if (!parameters || parameters.length === 0) {
        return ansi.gray("[no parameters]");
    }
    return parameters.map(param => {
        const restrictions = param.restrictions ? ` ${JSON.stringify(param.restrictions)}` : '';
        return `${ansi.cyan("  • ")}${ansi.gold(param.key)} ${ansi.gray(": " + param.type) + " / "}${param.description ? `: ${ansi.white(param.description)}` : ''}\n   ${ansi.gray(`restrictions: ${restrictions}`)}`;
    }).join('\n');
}
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
                choices: Object.keys(models).map(key => {
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
            const modelList = Object.values(models).map(model => serializeModel(model)).join('\n\n');
            if (modelList.length === 0) {
                await action.reply(invoker, {
                    content: "no models available.",
                    ephemeral: guild_config.useEphemeralReplies,
                });
                return new CommandResponse({
                    error: true,
                    message: "no models available.",
                });
            }
            await action.reply(invoker, {
                content: `available models:\n\`\`\`ansi\n${modelList}\`\`\``,
                ephemeral: guild_config.useEphemeralReplies,
            });
            return new CommandResponse({
                pipe_data: { input_text: modelList },
            });
        }
        // Try to find the model by exact match, case-insensitive, or prefix match
        let modelInfo: Model | undefined = models[args.model as keyof typeof models];
        if (!modelInfo) {
            // Try case-insensitive match
            modelInfo = Object.values(models).find(
            m => m.name.toLowerCase() === args.model.toLowerCase()
            );
        }
        if (!modelInfo) {
            // Try prefix match
            modelInfo = Object.values(models).find(
            m => m.name.toLowerCase().startsWith(args.model.toLowerCase())
            );
        }
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

        // Check if the model is whitelisted and the user is not in the whitelist
        if (modelInfo.whitelist && !modelInfo.whitelist.includes(invoker.author.id)) {
            await action.reply(invoker, {
                content: `model '${args.model}' is whitelist only. you cannot use it.`,
                ephemeral: guild_config.useEphemeralReplies,
            });
            return new CommandResponse({
                error: true,
                message: `model '${args.model}' is whitelist only. you cannot use it.`,
            });
        }

        const conversation = await getConversation(invoker as Message);
        // Check if the model is already set to avoid unnecessary updates
        if (conversation.model === modelInfo) {
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
        conversation.model = modelInfo;

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
        action.reply(invoker, {
            content: `im ngl i dont feel like making this rn`,
        });
    }
);

const allWhitelist = CommandAccessTemplates.dev_only.whitelist.users;

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
        const full = !!(args.full && ((typeof args.full === "string") ? args.full.trim().length : true));
        const all = allWhitelist.includes(invoker.author.id) && (typeof args.full === "string") && (args.full == "all")
        if (all) {
            const output = conversations.map((conv) => {
                return conv.serialize(true);
            });
            const file = textToAttachment(output.join("\n\n\n").trim(), "conversations.ansi");
            await action.reply(invoker, { content: "here's all conversations", files: [file], ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({ pipe_data: { input_text: output } });
        }
        const output = conversation.serialize(true);
        const file = textToAttachment(output.trim(), "conversation.ansi");
        await action.reply(invoker, { content: "here's your conversation; if the output looks weird try full screening the file (the \"view whole file\" button on the left)", files: [file], ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { input_text: output } });
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
            list: [get, setparam, clear, modelcommand],
        },
        aliases: ["conv", "gpt"],
        options: [],
        pipable_to: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use \`${guild_config.other.prefix}help conversation\` for a list of subcommands`,
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