import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import { listPrompts, Prompt, setActivePrompt, setEditingPrompt } from "../../lib/gpt/promptManager";

const command = new Command(
    {
        name: 'use',
        description: 'use the specified prompt',
        long_description: 'sets the specified prompt as your currently editing & active prompt',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'name',
                description: 'the name of the prompt to use',
                long_description: 'the name of the prompt to use',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: [
            "p/prompt use my prompt",
        ],
        aliases: ["activate"],
        argument_order: "<name?>"
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["name"]),
    async function execute ({ invoker, args, guild_config }) {
        if (!args.name) {
            await action.reply(invoker, { content: `please supply a prompt to use`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `please supply a prompt to use`,
            });
        }

        if (!await Prompt.checkExists(invoker.author.id, args.name)) {
            await action.reply(invoker, { content: `cannot use prompt; you do not have a prompt named \`${args.name}\`.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `cannot use prompt; you do not have a prompt named \`${args.name}\`.`,
            });
        }

        await setEditingPrompt(invoker.author.id, args.name);
        await setActivePrompt(invoker.author.id, invoker.author.id, args.name);

        await action.reply(invoker, { content: `now using/editing prompt \`${args.name}\`. the next conversation you enter will use \`${args.name}\` as its prompt.`, ephemeral: guild_config.other.use_ephemeral_replies })
    }
);

export default command;