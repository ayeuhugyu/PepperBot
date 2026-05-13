import { Collection, Message, Attachment } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { CommandTag, CommandOptionType, InvokerType } from "../lib/classes/command_enums";
import { respond } from "../lib/gpt/respond";

const command = new Command(
    {
        name: 'ask',
        description: 'ask the ai something',
        long_description: 'ask the ai something.\nit is much easier and better to simply ping the bot rather than using this command, this is mostly for use either in aliases or as a slash command in other servers.\nfyi, this uses your latest conversation as the base. if you don\'t want that, run p/conversation clear',
        tags: [CommandTag.AI, CommandTag.TextPipable], // TODO: re-add image pipability
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
                long_requirements: 'if image is not provided'
            }),
            new CommandOption({
                name: 'image',
                description: 'an image to provide context',
                type: CommandOptionType.Attachment,
                required: false,
                long_requirements: 'if request is not provided'
            }),
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
    },
    async function execute ({ args, invoker, guild_config, invoker_type, piped_data }) {
        const request = args.request || piped_data?.data?.input_text;
        const image = args.image;
        if (!request && !image) {
            action.reply(invoker, { content: "please provide a request", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "please provide a request",
            });
        }
        const attachments: Collection<string, Attachment> = new Collection();
        if (image) {
            attachments.set(image.id,  image);
        }

        const formattedInvoker = Object.assign(invoker, {
            author: invoker.author,
            content: request ?? "",
            attachments: attachments,
        });

        let forcedProcessingType: "default" | undefined = undefined;
        if (invoker_type === InvokerType.Interaction) forcedProcessingType = "default";

        const response = await respond(formattedInvoker as Message<true>, forcedProcessingType, true);
        return new CommandResponse({ pipe_data: { input_text: response?.content } });
    }
);

export default command;