import { Collection, Message, Attachment } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { respond } from "../lib/gpt/main";
import { CommandTag, CommandOptionType, InvokerType } from "../lib/classes/command_enums";

const command = new Command(
    {
        name: 'ask',
        description: 'ask the ai something',
        long_description: 'ask the ai something',
        tags: [CommandTag.AI, CommandTag.TextPipable, CommandTag.ImagePipable],
        pipable_to: [CommandTag.TextPipable],
        example_usage: "p/ask hi there",
        argument_order: "<request> [attach your image]",
        aliases: ["question", "askai"],
        options: [
            new CommandOption({
                name: 'request',
                description: 'the question to ask the ai',
                type: CommandOptionType.String,
                required: false,
            }),
            new CommandOption({
                name: 'image',
                description: 'an image to provide context',
                type: CommandOptionType.Attachment,
                required: false,
            })
        ]
    },
    async function getArguments ({ invoker, command_name_used, guild_config }) {
        invoker = invoker as Message<true>;
        const args: { request?: string; image?: Attachment } = {};
        const commandLength = `${guild_config.other.prefix}${command_name_used}`.length;
        const text = invoker.content.slice(commandLength)?.trim();
        args.request = text;
        if (invoker.attachments.size > 0) args.image = invoker.attachments.first();
        return args;
    }, // No arguments template needed
    async function execute ({ args, invoker, guild_config, invoker_type, piped_data }) {
        const request = args.request || piped_data?.data?.input_text;
        const image = (args.image as Attachment | undefined) || piped_data?.data?.image_url ? { id: args.image?.id, url: piped_data?.data?.image_url, name: args?.image?.name } : undefined; // this could have issues but i literally cant think of another way to do it
        if (!request && !image) {
            action.reply(invoker, { content: "please provide a request", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "please provide a request",
            });
        }
        const response = await respond(invoker as Message<true>);
        return new CommandResponse({ pipe_data: { input_text: response } });
    }
);

export default command;