import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import { getCurrentUpdateNumber } from "../lib/update_manager";
import database, { tables } from "../lib/data_manager";
import prettyBytes from "pretty-bytes";
import fs from 'fs';
import path from 'path';
import os from 'os';
import si from 'systeminformation';
import { Container, Separator, TextDisplay } from "../lib/classes/components";

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
        long_description: 'returns information about the storage space being used in total, and the individual components such as the database, cache, resources, and logs',
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

        const embed = new Container({
            components: [
                new TextDisplay({
                    content: `## storage information`
                }),
                new Separator(),
                new TextDisplay({
                    content:
                            `**total**: ${prettyBytes(totalStorageSize)}\n\n` +
                            `**database**: ${prettyBytes(totalSize)}\n` +
                            `**cache**: ${prettyBytes(cacheSize)}\n` +
                            `**resources**: ${prettyBytes(resourcesSize)}\n` +
                            `**logs**: ${prettyBytes(logsSize)}\n`
                })
            ]
        })

        action.reply(invoker, { components: [embed], components_v2: true, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const dbinfo = new Command(
    {
        name: 'database',
        description: 'returns information about the database',
        long_description: 'returns information about the database such as the total size and number of entries in each table',
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

        const excludedTables = ["sqlite_sequence", "knex_migrations", "knex_migrations_lock"];

        for (const table of tables) {
            if (excludedTables.includes(table)) continue;

            const countResult = await database(table).count({ count: '*' });
            totalEntries += Number(countResult[0]?.count ?? 0);
            description += `**${table} entries**: ${countResult[0].count}\n`;
        }

        description = `**total size**: ${prettyBytes(totalSize)}\n**total entries**: ${totalEntries}\n\n` + description;

        const embed = new Container({
            components: [
                new TextDisplay({
                    content: `## database information`
                }),
                new Separator(),
                new TextDisplay({
                    content: description
                })
            ]
        });

        action.reply(invoker, { components: [embed], components_v2: true, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const performanceinfo = new Command(
    {
        name: 'performance',
        description: 'returns information about system performance',
        long_description: 'returns information about memory usage, CPU usage, socket ping, and uptime',
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
        const cpuLoad = await si.currentLoad();
        const ping = invoker.client.ws.ping;

            // Convert uptime to human readable format
            const uptimeSeconds = Math.floor(process.uptime());
            const days = Math.floor(uptimeSeconds / (24 * 3600));
            const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = uptimeSeconds % 60;
            let uptimeString = '';
            if (days > 0) uptimeString += `${days}d `;
            if (hours > 0 || days > 0) uptimeString += `${hours}h `;
            if (minutes > 0 || hours > 0 || days > 0) uptimeString += `${minutes}m `;
            uptimeString += `${seconds}s`;

            const embed = new Container({
                components: [
                    new TextDisplay({
                        content: `## performance information`
                    }),
                    new Separator(),
                    new TextDisplay({
                        content:
                            `**memory usage**: ${prettyBytes(memoryUsage.rss)} (RSS)\n` +
                            `**CPU load**: ${cpuLoad.currentLoad.toFixed(2)}%\n` +
                            `**socket ping**: ${(ping < 0) ? '???' : ping}ms\n` +
                            `**uptime**: ${uptimeString.trim()}`
                    })
                ]
            });

        action.reply(invoker, { components: [embed], components_v2: true, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const botinfo = new Command(
    {
        name: 'bot',
        description: 'returns information about the bot',
        long_description: 'returns information about the bot such as the bot version, total guilds, and unique users',
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
        const guilds = await invoker.client.guilds.cache.size;
        const users = await invoker.client.users.cache.size;
        const version = await getCurrentUpdateNumber();

        const embed = new Container({
            components: [
                new TextDisplay({
                    content: `## bot information`
                }),
                new Separator(),
                new TextDisplay({
                    content:
                        `**version**: ${version}\n` +
                        `**total guilds**: ${guilds}\n` +
                        `**total unique users**: ${users}`
                })
            ]
        });

        action.reply(invoker, { components: [embed], components_v2: true, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const command = new Command(
    {
        name: 'info',
        description: 'provides information about the bot',
        long_description: 'provides information such as the bot version, memory and storage usage, etc. ',
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
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use any of the following subcommands:\n\`${guild_config.other.prefix}info bot\`: get information about the bot\n\`${guild_config.other.prefix}info db\`: get information about the database\n\`${guild_config.other.prefix}info storage\`: get information about storage usage\n\`${guild_config.other.prefix}info performance\`: get performance information`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        await action.reply(invoker, {
            content: `this command does nothing if you don't supply a subcommand. use any of the following subcommands:\n\`${guild_config.other.prefix}info bot\`: get information about the bot\n\`${guild_config.other.prefix}info db\`: get information about the database\n\`${guild_config.other.prefix}info storage\`: get information about storage usage\n\`${guild_config.other.prefix}info performance\`: get performance information`,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
    }
);

export default command;