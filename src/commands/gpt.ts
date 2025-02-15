import { ChannelType, Collection, GuildMember, Message, StageChannel, VoiceChannel } from "discord.js";
import { Command, CommandCategory, CommandOption, CommandOptionType, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { APIParameters, getConversation, generateImage } from "../lib/gpt";
import { textToFile } from "../lib/filify";

const templateAPIParameters = new APIParameters();

let lastUsedImageAt: { [key: string]: number } = {};
const imageCooldown = 4 * 60 * 60 * 1000; // 4 hours

const image = new Command(
    {
        name: 'image',
        description: 'various gpt related commands',
        long_description: 'allows you to manipulate your conversation with the AI',
        category: CommandCategory.AI,
        example_usage: "p/gpt get",
        options: [
            new CommandOption({
                name: 'prompt',
                description: 'the image to generate',
                type: CommandOptionType.String,
                required: false,
            }),
        ],
        pipable_to: ["chatbubble"]
    }, 
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["prompt"]),
    async function execute ({ message, args, piped_data, will_be_piped, guildConfig }) {
        if (lastUsedImageAt[message.author.id] && Date.now() - lastUsedImageAt[message.author.id] < imageCooldown) {
            return action.reply(message, {
                content: `you can only generate an image every 4 hours (this stuff's expensive, sorry!). the next time you can generate an image is <t:${Math.floor((lastUsedImageAt[message.author.id] + imageCooldown) / 1000)}:R> (<t:${Math.floor((lastUsedImageAt[message.author.id] + imageCooldown) / 1000)}:T>).`,
                ephemeral: guildConfig.useEphemeralReplies
            });
        }
        if (args?.get("prompt")) {
            const sent = await action.reply(message, { content: "generating image, please wait...", ephemeral: guildConfig.useEphemeralReplies }) as Message;
            const url: any = await generateImage(args.get("prompt")); // string | Error (but ts screams at me because its unknown)
            if (typeof url !== "string") {
                return action.edit(sent, {
                    content: "failed to generate image. error: " + url.message,
                    ephemeral: guildConfig.useEphemeralReplies
                });
            }
            lastUsedImageAt[message.author.id] = Date.now();
            action.edit(sent, {
                files: [{ name: "image.png", attachment: url }],
                content: `image generated from prompt: \`${args.get("prompt")}\`\nopenai deletes these images after 60 minutes, so save the file if you want it for later. the next time you can generate an image is <t:${Math.floor((lastUsedImageAt[message.author.id] + imageCooldown) / 1000)}:R> (<t:${Math.floor((lastUsedImageAt[message.author.id] + imageCooldown) / 1000)}:T>). (this stuff's expensive, sorry!)`,
            });
            return new CommandResponse({ pipe_data: { chatbubble_url: url }});
        } else {
            action.reply(message, "provide a prompt to use you baffoon!");
        }
    }
);

const setparam = new Command(
    {
        name: 'setparam',
        description: 'allows you to change parameters for the gpt conversation',
        long_description: 'allows you to change parameters for the gpt conversation, notably things like temperature ad top_p',
        category: CommandCategory.AI,
        example_usage: "p/gpt setparam temperature 1",
        subcommands: [],
        options: [
            new CommandOption({
                name: 'parameter',
                description: 'the parameter to change',
                type: CommandOptionType.String,
                required: true,
                choices: Object.keys(templateAPIParameters).map(key => { return { name: key, value: key } })
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
    async function execute ({ args, message, guildConfig }) {
        if (!args?.get("parameter")) {
            action.reply(message, { content: "parameter is required", ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        if (!args?.get("value")) {
            action.reply(message, { content: "value is required", ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        const parameter = args.get("parameter");
        const value = args.get("value");
        if (!templateAPIParameters.hasOwnProperty(parameter)) {
            action.reply(message, { content: `invalid parameter: \`${parameter}\`. must be one of the following: \`${Object.keys(templateAPIParameters).map(key => key).join(", ")}\``, ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        // constraints on values
        switch (parameter) {
            case "temperature": {
                if (value < 0 || value > 2) {
                    action.reply(message, { content: "temperature must be between 0 and 2", ephemeral: guildConfig.other.use_ephemeral_replies });
                    return new CommandResponse({});
                }
                break;
            }
            case "top_p": {
                if (value < 0 || value > 1) {
                    action.reply(message, { content: "top_p must be between 0 and 1", ephemeral: guildConfig.other.use_ephemeral_replies });
                    return new CommandResponse({});
                }
                break;
            }
            case "presence_penalty": {
                if (value < -2 || value > 2) {
                    action.reply(message, { content: "presence_penalty must be between -2 and 2", ephemeral: guildConfig.other.use_ephemeral_replies });
                    return new CommandResponse({});
                }
                break;
            }
            case "frequency_penalty": {
                if (value < -2 || value > 2) {
                    action.reply(message, { content: "frequency_penalty must be between -2 and 2", ephemeral: guildConfig.other.use_ephemeral_replies });
                    return new CommandResponse({});
                }
                break;
            }
            case "max_tokens": {
                if (value < 0 || value > 4096) {
                    action.reply(message, { content: "max_tokens must be between 0 and 4096", ephemeral: guildConfig.other.use_ephemeral_replies });
                    return new CommandResponse({});
                }
                break;
            }
            default: break;
        }
        const conversation = await getConversation(message as Message);
        conversation.api_parameters[parameter as keyof APIParameters] = parseInt(value);

        await action.reply(message, { content: `set \`${parameter}\` to \`${value}\``, ephemeral: guildConfig.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const get = new Command(
    {
        name: 'get',
        description: 'returns your gpt conversation',
        long_description: 'returns your gpt conversation',
        category: CommandCategory.Debug,
        example_usage: "p/gpt get",
        subcommands: [],
        options: [],
        pipable_to: ["grep"]
    }, 
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ message, guildConfig }) {
        const conversation = await getConversation(message as Message);
        const output = conversation.toReasonableOutput();
        const file = textToFile(JSON.stringify(output, null, 2), "conversation");
        await action.reply(message, { content: "here's your conversation", files: [file], ephemeral: guildConfig.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { grep_text: JSON.stringify(output, null, 2) } });
    }
);

const clear = new Command(
    {
        name: 'clear',
        description: 'removes you from your current conversation',
        long_description: 'removes your from your current conversation',
        category: CommandCategory.AI,
        example_usage: "p/gpt clear",
        subcommands: [],
        options: [],
        pipable_to: []
    }, 
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ message, guildConfig }) {
        const conversation = await getConversation(message as Message);
        conversation.removeUser(message.author);
        action.reply(message, { content: "removed you from your current conversation", ephemeral: guildConfig.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const subcommands: Command[] = [get, setparam, clear, image];

const command = new Command(
    {
        name: 'gpt',
        description: 'various gpt related commands',
        long_description: 'allows you to manipulate your conversation with the AI',
        category: CommandCategory.AI,
        example_usage: "p/gpt get",
        subcommands: subcommands,
        options: [
            new CommandOption({
                name: 'subcommand',
                description: 'the subcommand to run',
                type: CommandOptionType.String,
                required: true,
                choices: subcommands.map(subcommand => { return { name: subcommand.name, value: subcommand.name } })
            }),
            new CommandOption({
                name: 'parameter',
                description: 'the parameter to change (setparam subcommand)',
                type: CommandOptionType.String,
                required: false,
                choices: Object.keys(APIParameters).map(key => { return { name: key, value: key } })
            }),
            new CommandOption({
                name: 'value',
                description: 'the value to set the parameter to (setparam subcommand)',
                type: CommandOptionType.Number,
                required: false,
            })
        ],
        pipable_to: ["grep", "chatbubble"] // todo: fix this so it just works on subcommands
    }, 
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ message, args, piped_data, will_be_piped, guildConfig }) {
        if (args?.get("subcommand")) {
            action.reply(message, {
                content: "invalid subcommand: " + args?.get("subcommand"),
                ephemeral: guildConfig.other.use_ephemeral_replies,
            })
            return;
        }
        action.reply(message, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: guildConfig.other.use_ephemeral_replies
        })
    }
);

export default command;