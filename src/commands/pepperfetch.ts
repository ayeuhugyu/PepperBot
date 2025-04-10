import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../lib/classes/command_enums";
import si from 'systeminformation';
import os from 'os';
import { readFileSync } from "fs";
import prettyBytes from "pretty-bytes";

const command = new Command(
    {
        name: 'pepperfetch',
        description: 'basically neofetch but for pepperbot',
        long_description: 'basically neofetch but for pepperbot',
        tags: [],
        pipable_to: [CommandTag.TextPipable],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/pepperfetch",
        aliases: ["neofetch", "fastfetch"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, args, guild_config }) {
        const client = invoker.client;

        const asciiArt = `
        // ASCII art placeholder
        `;

        const osInfo = `\x1b[31mOS:\x1b[0m           \x1b[37m${os.type()} ${os.release()}\x1b[0m`;
        const uptime = `\x1b[31mUptime:\x1b[0m       \x1b[37m${Math.floor(client.uptime! / 1000)}s\x1b[0m`;
        const packageCount = `\x1b[31mPackages:\x1b[0m    \x1b[37m${Object.keys(JSON.parse(readFileSync("package.json").toString()).dependencies).length}\x1b[0m`;
        const terminal = `\x1b[31mTerminal:\x1b[0m    \x1b[37m${process.env.TERM || "Unknown"}\x1b[0m`;

        const cpuInfo = await si.cpu();
        const cpuUsage = (await si.currentLoad()).currentLoad.toFixed(2);
        const cpu = `\x1b[31mCPU:\x1b[0m          \x1b[37m${cpuInfo.manufacturer} ${cpuInfo.brand} (${cpuUsage}% usage)\x1b[0m`;

        const gpuInfo = (await si.graphics()).controllers[0]?.model || "Unknown";
        const gpu = `\x1b[31mGPU:\x1b[0m          \x1b[37m${gpuInfo}\x1b[0m`;

        const memoryInfo = await si.mem();
        const memoryUsage = `${prettyBytes(memoryInfo.used)} / ${prettyBytes(memoryInfo.total)}`;
        const memory = `\x1b[31mMemory Usage:\x1b[0m \x1b[37m${memoryUsage}\x1b[0m`;

        const response = `\`\`\`ansi
${asciiArt}
${osInfo}
${uptime}
${packageCount}
${terminal}
${cpu}
${gpu}
${memory}\`\`\``;

        action.reply(invoker, {
            content: response,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
        return new CommandResponse({ pipe_data: { data: { input_text: response } } })
    }
);

export default command;