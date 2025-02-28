import { Collection, Message } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { GPTFormattedCommandInteraction, GPTProcessor, respond } from "../lib/gpt";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandCategory, CommandOptionType } from "../lib/classes/command_enums";

const command = new Command(
    {
        name: 'ask',
        description: 'ask the ai something',
        long_description: 'ask the ai something',
        category: CommandCategory.AI,
        pipable_to: ['grep'],
        example_usage: "p/ask hi there",
        argument_order: "<question>",
        aliases: ["question", "askai"],
        options: [
            new CommandOption({
                name: 'question',
                description: 'the question to ask the ai',
                type: CommandOptionType.String,
                required: true,
            })
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["request"]),
    async function execute ({ args, invoker, guild_config }) {
        if (!args || !args.request) {
            action.reply(invoker, { content: "please provide a request", ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const request = args.request;
        const processor = new GPTProcessor()
        processor.repliedMessage = invoker;
        processor.sentMessage = await action.reply(invoker, { content: "processing..." }) as Message;
        let formattedMessage: any = invoker
        formattedMessage.content = request as string;
        if (!formattedMessage.cleanContent) formattedMessage.cleanContent = request as string;
        formattedMessage.attachments = formattedMessage.attachments || new Collection();
        formattedMessage as GPTFormattedCommandInteraction;
        const response = await respond(formattedMessage, processor);
        return new CommandResponse({ pipe_data: { grep_text: response } });
    }
);

export default command;