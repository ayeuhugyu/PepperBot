import { Collection, Message } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { GPTFormattedCommandInteraction, GPTProcessor, respond } from "../lib/gpt";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, CommandOptionType, InvokerType } from "../lib/classes/command_enums";

const command = new Command(
    {
        name: 'ask',
        description: 'ask the ai something',
        long_description: 'ask the ai something',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        example_usage: "p/ask hi there",
        argument_order: "<question>",
        aliases: ["question", "askai"],
        options: [
            new CommandOption({
                name: 'request',
                description: 'the question to ask the ai',
                type: CommandOptionType.String,
                required: true,
            })
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["request"]),
    async function execute ({ args, invoker, guild_config, invoker_type }) {
        if (!args || !args.request) {
            action.reply(invoker, { content: "please provide a request", ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const request = args.request;
        const processor = new GPTProcessor()
        processor.repliedMessage = invoker;
        processor.isEphemeral = guild_config.other.use_ephemeral_replies && invoker_type === InvokerType.Interaction;
        processor.currentContent = "processing...";
        processor.sentMessage = await action.reply(invoker, { content: "processing...", ephemeral: guild_config.other.use_ephemeral_replies }) as Message;
        let formattedMessage: any = invoker
        formattedMessage.content = request as string;
        if (!formattedMessage.cleanContent) formattedMessage.cleanContent = request as string;
        formattedMessage.attachments = formattedMessage.attachments || new Collection();
        formattedMessage as GPTFormattedCommandInteraction;
        const response = await respond(formattedMessage, processor);
        return new CommandResponse({ pipe_data: { input_text: response } });
    }
);

export default command;