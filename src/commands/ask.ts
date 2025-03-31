import { Collection, Message, Attachment } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { GPTFormattedCommandInteraction, GPTProcessor, respond } from "../lib/gpt";
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
        const args = new Collection();
        const commandLength = `${guild_config.other.prefix}${command_name_used}`.length;
        const text = invoker.content.slice(commandLength)?.trim();
        args.set('request', text);
        if (invoker.attachments.size > 0) args.set('image', invoker.attachments.first());
        return args;
    }, // No arguments template needed
    async function execute ({ args, invoker, guild_config, invoker_type, piped_data }) {
        const request = args.request || piped_data?.data?.input_text;
        const image = (args.image as Attachment | undefined) || piped_data?.data?.image_url ? { id: "unknown", url: piped_data?.data?.image_url, name: "image.png" } : undefined; // this could have issues but i literally cant think of another way to do it
        if (!request && !image) {
            action.reply(invoker, { content: "please provide a request", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "please provide a request",
            });
        }
        const processor = new GPTProcessor()
        processor.repliedMessage = invoker;
        processor.isEphemeral = guild_config.other.use_ephemeral_replies && invoker_type === InvokerType.Interaction;
        processor.currentContent = "processing...";
        processor.sentMessage = await action.reply(invoker, { content: "processing...", ephemeral: guild_config.other.use_ephemeral_replies }) as Message;
        let formattedMessage: any = invoker
        formattedMessage.content = request as string;
        if (!formattedMessage.cleanContent) formattedMessage.cleanContent = request as string;
        formattedMessage.attachments = formattedMessage.attachments || new Collection();
        if (image) {
            formattedMessage.attachments.set(image.id, image);
        }
        formattedMessage as GPTFormattedCommandInteraction;
        const response = await respond(formattedMessage, processor);
        return new CommandResponse({ pipe_data: { input_text: response } });
    }
);

export default command;