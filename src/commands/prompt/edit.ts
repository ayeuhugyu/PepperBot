import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import { AnyPrompt, countUnnamedPrompts, listPrompts, Prompt, setEditingPrompt } from "../../lib/gpt/promptManager";

const command = new Command(
    {
        name: 'edit',
        description: 'edit one of your prompts',
        long_description: 'allows you to edit various aspects of your prompts',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'name',
                description: 'the name of the prompt to edit',
                long_description: 'the name of the prompt to edit',
                type: CommandOptionType.String,
                required: false,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: [
            "p/prompt edit",
            "p/prompt edit my prompt"
        ],
        aliases: ["new"],
        argument_order: "<name?>"
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["name"]),
    async function execute ({ invoker, args, guild_config }) {
        let name = args.name
        if (!name) {
            const unnamedCount = await countUnnamedPrompts(invoker.author.id);
            name = `unnamed-${unnamedCount}`;
        }

        let prompt = await Prompt.fromName(invoker.author.id, name);

        if (!prompt) {
            // create the prompt if it doesn't exist
            prompt = await Prompt.new(name, invoker.author);
        }

        await prompt.write();
        await setEditingPrompt(invoker.author.id, name);
        // await action.reply(invoker, { content: `created new prompt: \`${invoker.author.username}/${name}\`. you are now editing prompt \`${name}\`.`, ephemeral: guild_config.other.use_ephemeral_replies })
    }
);

export default command;