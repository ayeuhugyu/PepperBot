import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../lib/classes/command_enums";
import { getStatistics, Statistics } from "../lib/statistics";
import { createThemeEmbed, Theme } from "../lib/theme";

const command = new Command(
    {
        name: 'statistics',
        description: 'get statistics about the bot',
        long_description: 'get statistics about the bot',
        tags: [CommandTag.Utility],
        pipable_to: [CommandTag.TextPipable],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/statistics",
        aliases: ["stats"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, args, guild_config }) {
        const statistics = await getStatistics();
        const embed = createThemeEmbed(Theme.CURRENT);
        embed.setTitle('Statistics');
        let totalCommandUsage = Object.values(statistics.command_usage).reduce((acc, value) => acc + value, 0);
        let description = `
Total GPT Responses: ${statistics.total_gpt_responses}
Total Command Usage: ${totalCommandUsage}
Total Piped Commands: ${statistics.total_piped_commands}

GPT Model Usage:
        `;
        for (const model in statistics.gpt_model_usage) {
            description += `    ${model}: ${statistics.gpt_model_usage[model as keyof Statistics["gpt_model_usage"]]}\n`;
        }
        description += `
Command Usage:
        `;
        for (const command in statistics.command_usage) {
            description += `    ${command}: ${statistics.command_usage[command]}\n`;
        }
        description += `
Average Execution Times:
        `;
        for (const command in statistics.execution_times) {
            const times = statistics.execution_times[command];
            const average = times.reduce((acc, value) => acc + value, 0) / times.length;
            description += `    ${command}: ${average.toFixed(2)}ms\n`;
        }
        embed.setDescription(description);

        action.reply(invoker, { embeds: [embed], ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

export default command;