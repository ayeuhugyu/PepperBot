import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, CommandEntryType } from "../lib/classes/command_enums";
import { createThemeEmbed, Theme } from "../lib/theme";
import { APIEmbedField, Message } from "discord.js";
import PagedMenu from "../lib/classes/pagination";

const command = new Command(
    {
        name: 'help',
        description: 'explains usages of specific commands',
        long_description: 'explains how to use certain commands as well as listing all commands',
        tags: [CommandTag.Utility],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'command',
                description: 'the specific command to get help for',
                long_description: 'the specific command to get help for',
                type: CommandOptionType.String,
                required: false
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        argument_order: "<command>",
        example_usage: ["p/help", "p/help test"],
        aliases: ["commands"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["command"]),
    async function execute ({ invoker, args, guild_config }) {
        const commandManager = await import('../lib/command_manager');
        if (!args.command) {
            const commands = commandManager.default.mappings.filter(commandEntry => {
                const { whitelisted, blacklisted } = commandEntry.command.access.test(invoker);
                return (commandEntry.type === CommandEntryType.Command) || (!whitelisted || blacklisted)
            });
            const embed = createThemeEmbed(Theme.CURRENT);
            embed.setTitle('Available Commands');
            const columnCount = 3;
            const columns: (string[])[] = Array.from({ length: columnCount }, () => []);
            let index = 0;

            commands.forEach((command) => {
                columns[index % columnCount].push(guild_config.other.prefix + command.name);
                index++
            });
            let fields: APIEmbedField[] = [];
            columns.forEach((column, index) => {
                fields.push({ name: `​`, value: column.join("\n"), inline: true }); // name is a zero width space because discord gets mad if the name has length of zero
            });
            embed.addFields(...fields);
            action.reply(invoker, { embeds: [embed], ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                pipe_data: {
                    data: {
                        input_text: embed.toJSON().description,
                    }
                }
            });
        } else {
            if (args.command == "-a" || args.command == "--all" || args.command == "-t" || args.command == "--tree") {
                const commands = commandManager.default.mappings.filter(commandEntry => {
                    const { whitelisted, blacklisted } = commandEntry.command.access.test(invoker);
                    return (commandEntry.type === CommandEntryType.Command) || (!whitelisted || blacklisted);
                });

                const buildCommandTree = (command: Command, prefix: string = ""): string => {
                    let tree = `${prefix}${guild_config.other.prefix}${command.parent_command ? `${command.parent_command} ` : ""}${command.name}\n`;
                    if (command.subcommands && command.subcommands.list.length > 0) {
                        const subcommands = command.subcommands.list;
                        subcommands.forEach((subcommand, index) => {
                            const isLast = index === subcommands.length - 1;
                            const subPrefix = `${prefix}${isLast ? "    ╰ " : "    ├ "}`;
                            tree += buildCommandTree(subcommand, subPrefix);
                        });
                    }
                    return tree;
                };

                let commandTree = "```\n";
                commands.forEach((commandEntry) => {
                    commandTree += buildCommandTree(commandEntry.command);
                });
                commandTree += "```";

                action.reply(invoker, { content: commandTree, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    pipe_data: {
                        data: {
                            input_text: commandTree,
                        }
                    }
                });
            }
            const command: Command | undefined = await commandManager.default.get(args.command.replace(guild_config.other.prefix, "").split(" ")[0]);
            const requestedSubcommand: string = args.command.replace(guild_config.other.prefix, "").split(" ")[1];
            if (!command) {
                action.reply(invoker, { content: `couldn't find command: \`${args.command}\`` });
                return new CommandResponse({
                    error: true,
                    message: `couldn't find command: \`${args.command}\``,
                });
            }

            const createCommandEmbed = (command: Command) => {
                const embed = createThemeEmbed(Theme.CURRENT);
                embed.setTitle(guild_config.other.prefix + (command.parent_command ? command.parent_command + " " : "") + command.name);
                const options = command.options.filter((option) => option.type !== CommandOptionType.Subcommand && option.type !== CommandOptionType.SubcommandGroup);
                let embedDescription = `${command.long_description}

__TAGS:__ ${command.tags.join(", ") || "N/A"}
__PIPABLE TO:__ ${command.pipable_to.join(", ") || "N/A"}
__ALIASES:__ ${command.aliases.map(alias => guild_config.other.prefix + (command.parent_command ? command.parent_command + " " : "") + alias).join(", ") || "N/A"} ${command.argument_order ? `\n__ARGUMENT ORDER:__ ${command.argument_order}` : ""} ${command.root_aliases?.length > 0 ? `\n__ROOT ALIASES:__ ${command.root_aliases.map(alias => guild_config.other.prefix + alias).join("\n")}` : ""}
__EXAMPLE USE${typeof command.example_usage !== "string" ? "S:__\n" + (command.example_usage as string[]).map(example => example.replace("p/", guild_config.other.prefix)).join("\n") : ":__ " + command.example_usage.replace("p/", guild_config.other.prefix)}`;
                if (options.length > 0) {
                    embedDescription += "\n\n**__OPTIONS:__**\n";
                    options.forEach((option) => {
                        embedDescription += `${option.name} ${option.required ? "- REQUIRED OPTION:" : ":"}\n${option.long_description}${option.choices && option.choices.length > 0 ? `\nCHOICES: ${option.choices.map((choice: any) => choice.name).join(", ")}` : ""}\n`;
                    });
                }
                embed.setDescription(embedDescription);
                return embed;
            };

            if (command.subcommands && command.subcommands.list.length > 1) {
                const subcommands = command.subcommands.list;
                const pages = subcommands.map((subcommand: any) => createCommandEmbed(subcommand));
                const requestedPageIndex = subcommands.findIndex((subcommand: any) => subcommand.name === requestedSubcommand);
                const pagedMenu = new PagedMenu(pages);
                const initialPage = requestedPageIndex !== -1 ? pages[requestedPageIndex] : pages[0];
                pagedMenu.currentPage = requestedPageIndex !== -1 ? requestedPageIndex : 0;
                const message = await action.reply(invoker, { embeds: [initialPage], components: [pagedMenu.getActionRow()], ephemeral: guild_config.other.use_ephemeral_replies });
                pagedMenu.setActiveMessage(message as Message<true>);
            } else {
                const embed = createCommandEmbed(command);
                action.reply(invoker, { embeds: [embed], ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    pipe_data: {
                        data: {
                            input_text: embed.toJSON().description,
                        }
                    }
                });
            }
        }
    }
);

export default command;