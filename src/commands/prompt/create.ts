import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import { countUnnamedPrompts, listPrompts, Prompt, setEditingPrompt } from "../../lib/gpt/promptManager";

const command = new Command(
    {
        name: 'create',
        description: 'create a new prompt',
        long_description: 'creates a new prompt and sets it as your current prompt',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'name',
                description: 'the name of the prompt to create',
                long_description: 'the name of the prompt to create',
                type: CommandOptionType.String,
                required: false,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: [
            "p/prompt create",
            "p/prompt create my prompt"
        ],
        aliases: ["new"],
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["name"]),
    async function execute ({ invoker, args, guild_config }) {
        let name = args.name
        if (!name) {
            const unnamedCount = await countUnnamedPrompts(invoker.author.id);
            name = `unnamed-${unnamedCount}`;
        }

        if (await Prompt.checkExists(invoker.author.id, name)) {
            await action.reply(invoker, { content: `cannot create prompt; \`${invoker.author.username}/${name}\` already exists.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return
        }

        const prompt = await Prompt.new(name, invoker.author);
        await prompt.write();
        await setEditingPrompt(invoker.author.id, name);
        await action.reply(invoker, { content: `created new prompt: \`${invoker.author.username}/${name}\`. you are now editing prompt \`${name}\`.`, ephemeral: guild_config.other.use_ephemeral_replies })
    }
);

export default command;