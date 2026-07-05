import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse, FormattedCommandInteraction } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import { AnyPrompt, Prompt } from "../../lib/gpt/promptManager";
import database from "../../lib/data_manager";
import { Message } from "discord.js";
import { GuildConfig } from "../../lib/guild_config_manager";
import { deletePromptCommand } from "../ai-shared/deletePromptCommand";

const command = new Command(
    {
        name: 'delete',
        description: 'delete a prompt',
        long_description: 'deletes the specified prompt',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'name',
                description: 'the name of the prompt to delete',
                long_description: 'the name of the prompt to delete',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: [
            "p/prompt delete my prompt"
        ],
        aliases: ["rm", "remove"],
        argument_order: "<name?>"
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["name"]),
    async function execute ({ invoker, args, guild_config }) {
        if (!args.name) {
            await action.reply(invoker, { content: `please supply a prompt to delete`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `please supply a prompt to delete`,
            });
        }

        if (!await Prompt.checkExists(invoker.author.id, args.name)) {
            await action.reply(invoker, { content: `cannot delete prompt; you do not have a prompt named \`${args.name}\`.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `cannot delete prompt; you do not have a prompt named \`${args.name}\`.`,
            });
        }

        const prompt = (await Prompt.fromName(invoker.author.id, args.name));
        if (!prompt) {
            await action.reply(invoker, { content: `something has gone horribly wrong`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `something has gone horribly wrong`,
            });
        }

        await deletePromptCommand(prompt, invoker, guild_config);
    }
);

export default command;

