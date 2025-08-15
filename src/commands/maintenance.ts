import { Collection, Message } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { CommandAccessTemplates, getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, CommandOptionType, InvokerType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import { enableMaintenanceMode, disableMaintenanceMode } from "../lib/maintenance_manager";
import process from "node:process";

const maintenance_start = new Command(
    {
        name: 'start',
        description: 'enables maintenance mode',
        long_description: 'enables maintenance mode with an optional end timestamp',
        tags: [CommandTag.Debug, CommandTag.WhitelistOnly],
        input_types: [InvokerType.Message],
        pipable_to: [],
        example_usage: "p/maintenance start 1735689600",
        aliases: [],
        access: CommandAccessTemplates.dev_only,
        options: [
            new CommandOption({
                name: 'timestamp',
                description: 'unix timestamp for when maintenance mode should end',
                long_description: 'unix timestamp for when maintenance mode is expected to end',
                type: CommandOptionType.String,
                required: true
            })
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["timestamp"]),
    async function execute ({ invoker, args, guild_config }) {
        try {
            const timestamp = args.timestamp?.trim();

            // Validate timestamp if provided
            if (timestamp && timestamp !== "") {
                const timestampNum = parseInt(timestamp);
                if (isNaN(timestampNum) || timestampNum <= 0) {
                    await action.reply(invoker, {
                        content: "invalid timestamp, please provide a valid unix timestamp.",
                        ephemeral: guild_config.other.use_ephemeral_replies
                    });
                    return new CommandResponse({});
                }

                // Check if timestamp is in the future
                const currentTime = Math.floor(Date.now() / 1000);
                if (timestampNum <= currentTime) {
                    await action.reply(invoker, {
                        content: "timestamp must be in the future.",
                        ephemeral: guild_config.other.use_ephemeral_replies
                    });
                    return new CommandResponse({});
                }
            }

            await enableMaintenanceMode(timestamp);

            const endMessage = timestamp ? ` expected end time: <t:${timestamp}:t> (<t:${timestamp}:R>)` : "";
            await action.reply(invoker, {
                content: `maintenance mode enabled.${endMessage}\nrestarting bot...`,
                ephemeral: guild_config.other.use_ephemeral_replies
            });

            // Restart the bot
            setTimeout(() => {
                process.exit(0);
            }, 1000);

        } catch (error) {
            await action.reply(invoker, {
                content: `failed to enable maintenance mode: ${error}`,
                ephemeral: guild_config.other.use_ephemeral_replies
            });
        }

        return new CommandResponse({});
    }
);

const maintenance_end = new Command(
    {
        name: 'end',
        description: 'disables maintenance mode',
        long_description: 'disables maintenance mode and restarts the bot',
        tags: [CommandTag.Debug, CommandTag.WhitelistOnly],
        input_types: [InvokerType.Message],
        pipable_to: [],
        example_usage: "p/maintenance end",
        aliases: [],
        access: CommandAccessTemplates.dev_only,
        options: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, guild_config }) {
        try {
            await disableMaintenanceMode();

            await action.reply(invoker, {
                content: "maintenance mode disabled.\nrestarting bot...",
                ephemeral: guild_config.other.use_ephemeral_replies
            });

            // Restart the bot
            setTimeout(() => {
                process.exit(0);
            }, 1000);

        } catch (error) {
            await action.reply(invoker, {
                content: `failed to disable maintenance mode: ${error}`,
                ephemeral: guild_config.other.use_ephemeral_replies
            });
        }

        return new CommandResponse({});
    }
);

const command = new Command(
    {
        name: 'maintenance',
        description: 'manages bot maintenance mode',
        long_description: 'enables or disables maintenance mode for the bot. only available to developers.',
        tags: [CommandTag.Debug, CommandTag.WhitelistOnly],
        input_types: [InvokerType.Message],
        pipable_to: [],
        argument_order: "<subcommand> [timestamp]",
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [maintenance_start, maintenance_end]
        },
        options: [],
        example_usage: "p/maintenance start 1735689600",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, guild_config, args }) {
        const subcommand = args.subcommand;
        const content = subcommand ?
            `"${subcommand}" is not a valid subcommand. use "start" or "end".` :
            "please specify a subcommand: start or end.";

        await action.reply(invoker, {
            content: content,
            ephemeral: guild_config.other.use_ephemeral_replies
        });
        return new CommandResponse({});
    }
);

export default command;
