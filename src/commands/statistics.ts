import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../lib/classes/command_enums";
import { getStatistics, Statistics } from "../lib/statistics";
import { Container, Separator, TextDisplay } from "../lib/classes/components";

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
        let totalCommandUsage = Object.values(statistics.command_usage).reduce((acc, value) => acc + value, 0);
        let description = `
-# view online at ${(process.env.IS_DEV?.toLowerCase() === "true") ? "http://localhost:53134" : "https://pepperbot.online"}/statistics
Total GPT Responses: ${statistics.total_gpt_responses}
Total Command Usage: ${totalCommandUsage}
Total Piped Commands: ${statistics.total_piped_commands}

GPT Model Usage:\n`;
        for (const model in statistics.gpt_model_usage) {
            if (statistics.gpt_model_usage[model as keyof Statistics["gpt_model_usage"]] === 0) continue;
            description += `    ${model}: ${statistics.gpt_model_usage[model as keyof Statistics["gpt_model_usage"]]}\n`;
        }
        // Top 5 Command Usage
        description += `
Command Usage:\n`;
        const topCommandUsage = Object.entries(statistics.command_usage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        for (const [command, count] of topCommandUsage) {
            description += `    ${command}: ${count}\n`;
        }

        // Top 5 Average Execution Times
        description += `
Average Execution Times:\n`;
        const avgExecutionTimes = Object.entries(statistics.execution_times)
            .map(([command, times]) => {
            const avg = times.length ? times.reduce((acc, v) => acc + v, 0) / times.length : 0;
            return [command, avg] as [string, number];
            })
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        for (const [command, average] of avgExecutionTimes) {
            description += `    ${command}: ${average.toFixed(2)}ms\n`;
        }

        const embed = new Container({
            components: [
                new TextDisplay({
                    content: `## Statistics`,
                }),
                new Separator(),
                new TextDisplay({
                    content: description,
                }),
            ]
        })

        action.reply(invoker, { components: [embed], components_v2: true, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

export default command;