import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import { getCurrentUpdateNumber } from "../lib/update_manager";
import { createThemeEmbed, Theme } from "../lib/theme";
import database, { tables } from "../lib/data_manager";
import prettyBytes from "pretty-bytes";
import fs from 'fs';
import path from 'path';
import os from 'os';
import si from 'systeminformation';

const getDirectorySize = (directory: string): number => {
    const files = fs.readdirSync(directory);
    let totalSize = 0;

    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
            totalSize += stats.size;
        } else if (stats.isDirectory()) {
            totalSize += getDirectorySize(filePath);
        }
    });

    return totalSize;
};

const storageinfo = new Command(
    {
        name: 'storage',
        description: 'returns information about the storage',
        long_description: 'returns information about the storage',
        tags: [CommandTag.Info],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, guild_config }) {
        const sizeResult = await database.raw(`PRAGMA page_count`);
        const pageSizeResult = await database.raw(`PRAGMA page_size`);
        const totalSize = sizeResult[0].page_count * pageSizeResult[0].page_size;

        const cacheSize = await getDirectorySize(path.join(__dirname, '../../cache'));
        const resourcesSize = await getDirectorySize(path.join(__dirname, '../../resources'));
        const logsSize = await getDirectorySize(path.join(__dirname, '../../logs'));

        const totalStorageSize = totalSize + cacheSize + resourcesSize + logsSize;

        const embed = createThemeEmbed(Theme.CURRENT)
            .setTitle("storage information")
            .setDescription(
                `**total**: ${prettyBytes(totalStorageSize)}\n\n` +
                `**database**: ${prettyBytes(totalSize)}\n` +
                `**cache**: ${prettyBytes(cacheSize)}\n` +
                `**resources**: ${prettyBytes(resourcesSize)}\n` +
                `**logs**: ${prettyBytes(logsSize)}\n`
            );

        action.reply(invoker, { embeds: [embed], ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const dbinfo = new Command(
    {
        name: 'database',
        description: 'returns information about the database',
        long_description: 'returns information about the database',
        tags: [CommandTag.Info],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "",
        aliases: ["db"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, guild_config }) {
        const sizeResult = await database.raw(`PRAGMA page_count`);
        const pageSizeResult = await database.raw(`PRAGMA page_size`);
        const totalSize = sizeResult[0].page_count * pageSizeResult[0].page_size;

        let totalEntries = 0;
        let description = ``;

        for (const table of tables) {
            const countResult = await database(table).count({ count: '*' });
            totalEntries += Number(countResult[0]?.count ?? 0);
            description += `**${table} entries**: ${countResult[0].count}\n`;
        }

        description = `**total size**: ${prettyBytes(totalSize)}\n**total entries**: ${totalEntries}\n\n` + description;

        const embed = createThemeEmbed(Theme.CURRENT)
            .setTitle("database information")
            .setDescription(description)

        action.reply(invoker, { embeds: [embed], ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const performanceinfo = new Command(
    {
        name: 'performance',
        description: 'returns information about system performance',
        long_description: 'returns information about RAM, CPU, and GPU usage',
        tags: [CommandTag.Info],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, guild_config }) {
        const memoryUsage = process.memoryUsage();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        const cpuLoad = await si.currentLoad();
        const gpuData = await si.graphics();

        const embed = createThemeEmbed(Theme.CURRENT)
            .setTitle("performance information")
            .setDescription(
                `**RAM usage**: ${prettyBytes(memoryUsage.rss)} (RSS)\n` +
                `**Total system memory**: ${prettyBytes(totalMemory)}\n` +
                `**Used system memory**: ${prettyBytes(usedMemory)}\n\n` +
                `**CPU load**: ${cpuLoad.currentLoad.toFixed(2)}%\n` +
                `**CPU cores**: ${os.cpus().length}\n\n` +
                (gpuData.controllers.length > 0
                    ? gpuData.controllers.map((gpu, index) =>
                        `**GPU ${index + 1}**: ${gpu.model}\n` +
                        `**GPU load**: ${gpu.utilizationGpu || 0}%\n` +
                        `**GPU memory usage**: ${prettyBytes(gpu.memoryUsed || 0)} / ${prettyBytes(gpu.memoryTotal || 0)}\n`
                    ).join("\n")
                    : "**GPU**: No GPU detected\n")
            );

        action.reply(invoker, { embeds: [embed], ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const botinfo = new Command(
    {
        name: 'bot',
        description: 'returns information about the bot',
        long_description: 'returns information about the bot',
        tags: [CommandTag.Info],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, guild_config }) {
        const guilds = await invoker.client.shard?.fetchClientValues("guilds.cache.size");
        const users = await invoker.client.shard?.fetchClientValues("users.cache.size");
        const version = await getCurrentUpdateNumber();
        const embed = createThemeEmbed(Theme.CURRENT)
            .setTitle("bot information")
            .setDescription(
                `**version**: ${version}\n` +
                `**shard count**: ${invoker.client.shard?.count}\n` +
                `**shard id**: ${invoker.client.shard?.ids[0]}\n` +
                `**total guilds**: ${(guilds as number[])?.reduce((prev: number, val: number) => prev + val, 0)}\n` +
                `**total unique users**: ${(users as number[])?.reduce((prev: number, val: number) => prev + val, 0)}`
            )
        action.reply(invoker, { embeds: [embed], ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const command = new Command(
    {
        name: 'info',
        description: 'provides information about the bot',
        long_description: 'provides information such as the version, shard status, memory and storage usage, etc. ',
        tags: [CommandTag.Info],
        options: [
            new CommandOption({
                name: 'subcommand',
                description: 'the subcommand to execute',
                long_description: 'the subcommand to execute',
                type: CommandOptionType.String,
                required: true
            })
        ],
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [botinfo, dbinfo, storageinfo, performanceinfo]
        },
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {
        if (args.subcommand) {
            action.reply(invoker, `invalid subcommand: ${args.subcommand}; use ${guild_config.other.prefix}help info for a list of subcommands`);
            return new CommandResponse({});
        }
        action.reply(invoker, "this command does nothing if you dont supply a subcommand")
        return new CommandResponse({});
    }
);

export default command;