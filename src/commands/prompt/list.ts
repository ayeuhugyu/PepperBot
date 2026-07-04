import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import { listPrompts } from "../../lib/gpt/promptManager";
import { tablify } from "../../lib/string_helpers";

const command = new Command(
    {
        name: 'list',
        description: 'list you or someone else\'s prompts',
        long_description: 'lists all prompts which you have created, or all prompts that someone else has published',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: [
            "p/prompt list",
            "p/prompt list PepperBot"
        ],
        aliases: ["ls"],
        argument_order: "<user>"
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["user"]),
    async function execute ({ invoker, args, guild_config, will_be_piped }) {
        const prompts = await listPrompts(invoker.author.id);

        if (prompts.length === 0) {
            await action.reply(invoker, { content: `you have no prompts`, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }

        let columnNames = ["1"];
        let colCount = (prompts.length > 25) ? (prompts.length > 50) ? 3 : 2 : 1;
        if (will_be_piped) colCount = 1;
        if (colCount > 1) columnNames.push("2");
        if (colCount > 2) columnNames.push("3");

        let values: string[][] = [];
        let currentCol: string[] = [];
        prompts.forEach(p => {
            if (currentCol.length == colCount) {
                values.push(currentCol);
                currentCol = [];
            }

            currentCol.push(p.name);
        });
        if (currentCol.length > 0) {
            while (currentCol.length != colCount) {
                currentCol.push(" ");
            }
            values.push(currentCol);
        }

        const content = `here's a list of your prompts:\n\`\`\`\n${tablify(columnNames, values, { column_separator: "  ", no_header: true })}\n\`\`\``

        if (!will_be_piped) {
            await action.reply(invoker, { content, ephemeral: guild_config.other.use_ephemeral_replies });
        } else {
            await action.reply(invoker, { content: "piped prompts list", ephemeral: guild_config.other.use_ephemeral_replies });
        }
        return new CommandResponse({ pipe_data: { input_text: content } });
    }
);

export default command;