import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import { listPrompts } from "../../lib/gpt/promptManager";

const command = new Command(
    {
        name: 'list',
        description: 'list you or someone else\'s prompts',
        long_description: 'lists all prompts which you have created, or all prompts that someone else has published',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'user',
                description: 'the user to list prompts for',
                long_description: 'the username of the person to list published prompts for',
                type: CommandOptionType.String,
                required: false,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: [
            "p/prompt list",
            "p/prompt list PepperBot"
        ],
        aliases: ["ls"],
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["user"]),
    async function execute ({ invoker, args, guild_config }) {
        const user = args.user ?? invoker.author.id;
        const notUs = user !== invoker.author.id;
        const prompts = await listPrompts(user, notUs);

        if (prompts.length === 0) {
            await action.reply(invoker, { content: `you have no prompts`, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }

        const content = `here's a list of ${notUs ? `${args.user}'s published` : "your"} prompts:\n\`\`\`\n${prompts.map(p => p.name).join("\n")}\n\`\`\``

        await action.reply(invoker, { content, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { input_text: content } });
    }
);

export default command;