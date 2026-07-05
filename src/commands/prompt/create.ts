import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import { listPrompts, Prompt, setEditingPrompt } from "../../lib/gpt/promptManager";

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
                required: true,
            }),
            new CommandOption({
                name: 'use-default-content',
                description: 'if true, will use default content',
                long_description: 'if true, content will be set to that of the official default prompt. this makes it easier to make small modifications but keep the same personality. to use this from text commands, put "--default" into the input.',
                type: CommandOptionType.String,
                required: false,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: [
            "p/prompt create",
            "p/prompt create my prompt",
            "p/prompt create my prompt --default"
        ],
        aliases: ["new"],
        argument_order: "<name?>"
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["name"]),
    async function execute ({ invoker, args, guild_config }) {
        if (!args.name) {
            await action.reply(invoker, { content: `please supply the name of the prompt to create`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `please supply the name of the prompt to create`,
            });
        }

        let useDefault = args.useDefaultContent;
        if (args.name.includes("--default")) {
            useDefault = true;
            args.name = args.name.replace(/ ?--default/, "");
        }

        if (await Prompt.checkExists(invoker.author.id, args.name)) {
            await action.reply(invoker, { content: `cannot create prompt; you already have a prompt named \`${args.name}\`.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `cannot create prompt; you already have a prompt named \`${args.name}\`.`,
            });
        }

        const prompt = await Prompt.new(args.name.replaceAll(/[`\n]/g, " "), invoker.author, useDefault ?? false);
        await prompt.write();
        await setEditingPrompt(invoker.author.id, prompt.name);
        await action.reply(invoker, { content: `created new prompt: \`${prompt.name}\`. you are now editing prompt \`${prompt.name}\`.`, ephemeral: guild_config.other.use_ephemeral_replies })
    }
);

export default command;