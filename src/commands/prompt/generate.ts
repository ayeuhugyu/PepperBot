import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import { getEditingPrompt, listPrompts, Prompt, setActivePrompt } from "../../lib/gpt/promptManager";
import { generatePrompt } from "../../lib/gpt/basic";
import { Message } from "discord.js";

const command = new Command(
    {
        name: 'generate',
        description: 'generates a prompt\'s content',
        long_description: 'generates a prompt\'s content incase you don\'t feel like writing it yourself',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'input',
                description: 'the prompt to use to generate a longer prompt from',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/prompt generate respond like a bee",
        aliases: [],
        argument_order: "<input>"
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["input"]),
    async function execute ({ invoker, args, guild_config, piped_data, invoker_type, will_be_piped }) {
        if (!args.input) {
            action.reply(invoker, {
            content: "please supply input for the prompt",
            ephemeral: guild_config.other.use_ephemeral_replies
            });
            return new CommandResponse({
                error: true,
                message: "please supply input for the prompt",
            });
        }

        const sent = await action.reply(invoker, { content: "processing...", ephemeral: guild_config.other.use_ephemeral_replies }) as Message;
        const response = await generatePrompt(args.input as string);
        action.edit(sent, { content: will_be_piped ? "piped generated prompt" : `generated prompt: \`\`\`\n${response}\`\`\`use ${guild_config.other.prefix}prompt set to use it. (or just pipe it)`, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { input_text: response }});
    }
);

export default command;