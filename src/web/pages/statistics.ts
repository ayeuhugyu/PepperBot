import { Router, Request, Response, NextFunction } from "express";
import { Client } from "discord.js";
import { getStatistics } from "../../lib/statistics";
import * as log from "../../lib/log";

export function createStatisticsRoutes(client: Client): Router {
    const router = Router();

    router.get("/statistics", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const statistics = await getStatistics();
            const guilds = client.guilds.cache.size;
            const users = client.users.cache.size;

            // Calculate average execution times
            let avgExecutionTimes: Record<string, string> = {};
            for (const command in statistics.execution_times) {
                const times = statistics.execution_times[command];
                avgExecutionTimes["p/" + command] = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(0);
            }
            const sortedAvgExecutionTimes = Object.fromEntries(Object.entries(avgExecutionTimes).sort(([,a], [,b]) => Number(b) - Number(a)));

            // Sort commands by usage
            const sortedCommandUsage = Object.entries(statistics.command_usage)
                .sort(([,a], [,b]) => b - a)
                .map(([command, usage]) => [`p/${command}`, usage]);

            // Sort models by usage
            const sortedModelUsage = Object.entries(statistics.gpt_model_usage)
                .sort(([,a], [,b]) => b - a)
                .filter(([,usage]) => usage > 0);

            res.render("statistics", {
                title: "statistics",
                description: "PepperBot Statistics",
                path: "/statistics",
                stylesheet: "statistics.css",
                guilds,
                users,
                totalCommands: Object.values(statistics.command_usage).reduce((a, b) => a + b, 0),
                totalGptResponses: Object.values(statistics.gpt_model_usage).reduce((a, b) => a + b, 0),
                totalPipedCommands: statistics.total_piped_commands,
                commandUsage: sortedCommandUsage,
                avgExecutionTimes: sortedAvgExecutionTimes,
                modelUsage: sortedModelUsage,
                invokerUsage: [
                    { type: "Slash Commands", count: statistics.invoker_type_usage.interaction },
                    { type: "Text Commands", count: statistics.invoker_type_usage.message }
                ]
            });
        } catch (err) {
            next(err);
        }
    });

    return router;
}
