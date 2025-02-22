import { Collection, Message } from "discord.js";
import { Command, CommandCategory, CommandOption, CommandOptionType, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { GPTFormattedCommandInteraction, GPTProcessor, respond } from "../lib/gpt";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";

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
    async function execute ({ args, message, piped_data, will_be_piped, guildConfig }) {
        if (!args?.get('request')) return action.reply(message, { content: "please provide a request", ephemeral: guildConfig.other.use_ephemeral_replies });
        const request = args.get('request');
        const processor = new GPTProcessor()
        processor.repliedMessage = message;
        processor.sentMessage = await action.reply(message, { content: "processing..." }) as Message;
        let formattedMessage: any = message
        formattedMessage.content = request as string;
        if (!formattedMessage.cleanContent) formattedMessage.cleanContent = request as string;
        formattedMessage.attachments = formattedMessage.attachments || new Collection();
        formattedMessage as GPTFormattedCommandInteraction;
        const response = await respond(formattedMessage, processor);
        return new CommandResponse({ pipe_data: { grep_text: response } });
    }
);

export default command;