import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, CommandEntryType } from "../lib/classes/command_enums";
import type { CommandManager } from "../lib/command_manager";
import { ActionRow, Button, ButtonStyle, Container, Separator, TextDisplay } from "../lib/classes/components";
import { GuildConfig } from "../lib/guild_config_manager";
import { getAlias } from "../lib/alias_manager";
import { ComponentType, Message } from "discord.js";

function buildColumns(commands: CommandManager["mappings"], guild_config: GuildConfig) {
    const columnCount = 4;
    const columnData: string[][] = Array.from({ length: columnCount }, () => []);

    // Fill columns round-robin
    let idx = 0
    commands.forEach((command) => {
        const colIdx = idx % columnCount;
        columnData[colIdx].push(guild_config.other.prefix + command.name);
        idx++;
    });

    // Find max rows and max width per column
    const maxRows = Math.max(...columnData.map(col => col.length));
    const colWidths = columnData.map(col =>
        col.reduce((max, item) => Math.max(max, item.length), 0)
    );

    // Build rows
    const rows: string[] = [];
    for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
        const row = columnData.map((col, colIdx) => {
            const item = col[rowIdx] ?? "";
            return item.padEnd(colWidths[colIdx], " ");
        }).join("  ");
        rows.push(row);
    }

    return rows.join("\n");
}

function createCommandTree(invoker: CommandInvoker, commandManager: CommandManager, guild_config: GuildConfig): Container {
    const commands = commandManager.mappings.filter(commandEntry => {
        const { whitelisted, blacklisted } = commandEntry.command.access.test(invoker);
        return (commandEntry.type === CommandEntryType.Command) || (!whitelisted || blacklisted);
    });

    const subcommandlessColumns = buildColumns(commands, guild_config);

    const container = new Container({
        components: [
            new TextDisplay({
                content: `# Commands List\n-# excluding commands you cannot use`
            }),
            new Separator(),
            new TextDisplay({
                content: `\`\`\`\n${subcommandlessColumns}\`\`\``
            }),
            new Separator(),
            new TextDisplay({
                content: `run ${guild_config.other.prefix}help <command> to see more details about a specific command.\nalternatively, visit the website for a more graphical representation. [link will be here]` // TODO: replace with guide page link when done
            })
        ]
    });
    return container
}

async function fetchCommand(invoker: CommandInvoker, guild_config: GuildConfig, commandManager: CommandManager, commandName: string): Promise<Command | undefined> {
    const normalizedCommandName = commandName.toLowerCase().startsWith(guild_config.other.prefix)
        ? commandName.slice(guild_config.other.prefix.length)
        : commandName.toLowerCase();
    const mainCommandName = normalizedCommandName.split(" ")[0];
    const aliasedCommandName = await getAlias(invoker.author.id, normalizedCommandName);
    let finalCommandName = mainCommandName;
    if (aliasedCommandName) {
        finalCommandName = aliasedCommandName.value.split(" ")[0];
    }
    let command = commandManager.get(finalCommandName)
    if (!command) {
        await action.reply(invoker, { content: `couldn't find command: \`${commandName}\`, run \`${guild_config.other.prefix}help\` to see all available commands.`})
        return;
    }

    const subcommandName = aliasedCommandName?.value.split(" ")[1] || normalizedCommandName.split(" ")[1]; // in theory some commands could use a custom subcommand fetcher thing that isnt just the second word but eh idrc
    const commandHasSubcommands = command.subcommands && command.subcommands.list.length > 0
    if (subcommandName) {
        if (commandHasSubcommands) {
            const subcommand = command.subcommands!.list.find(sub => (sub.name === subcommandName) || (sub.aliases?.includes(subcommandName)))
            if (!subcommand) {
                await action.reply(invoker, { content: `command ${command.name} has no subcommand named \`${subcommandName}\`; run \`${guild_config.other.prefix}help ${command.name}\` to see all available subcommands.`})
                return;
            }
            command = subcommand
        }
    }

    return command;
}

const optionTypesTable: Record<number, string> = {
    [CommandOptionType.String]: "string",
    [CommandOptionType.Integer]: "integer",
    [CommandOptionType.Boolean]: "boolean",
    [CommandOptionType.User]: "user",
    [CommandOptionType.Channel]: "channel",
    [CommandOptionType.Role]: "role",
    [CommandOptionType.Mentionable]: "mentionable",
    [CommandOptionType.Number]: "number",
    [CommandOptionType.Attachment]: "attachment"
};

async function embedCommand(command: Command, invoker: CommandInvoker, guild_config: GuildConfig, commandManager: CommandManager, currentSubcommandIndex?: number): Promise<Container[]> {
    let componentsCount = 0;

    const userAccessData = command.access.test(invoker);
    const userHasAccess = userAccessData.whitelisted && !userAccessData.blacklisted;

    const commandPrefix = `${guild_config.other.prefix}${(command.parent_command) ? (command.parent_command + " ") : ""}`

    const aliases: string[] = [];
    command.root_aliases?.forEach((alias) => aliases.push(guild_config.other.prefix + "**" + alias + "**"));
    command.aliases.forEach((alias) => aliases.push(commandPrefix + "**" + alias + "**"));

    const titleEmbed = new Container({
        components: [
            new TextDisplay({
                content: `# ${commandPrefix}${command.name}${userHasAccess ? "" : "\n-# you do not have permission to use this command"}${(aliases.length > 0) ? "\naliases: " + aliases.join(", ") : ""}`
            }),
            new Separator(),
            new TextDisplay({
                content: command.long_description
            }),
        ]
    });

    componentsCount += 4

    const examplesEmbed = new Container({
        components: [
            new TextDisplay({
                content: `### Example Usage`
            }),
            new Separator(),
            new TextDisplay({
                content: ((typeof command.example_usage === "string") ? command.example_usage.replace("p/", guild_config.other.prefix) : command.example_usage.map((example, index) => `[${index + 1}]: ${example.replace("p/", guild_config.other.prefix)}\n`).join("")) + `\nargument order: ${commandPrefix}${command.name} ${command.argument_order}`
            }),
        ]
    });

    componentsCount += 4

    const optionsEmbeds: Container[] = [];
    command.options.forEach((option) => {
        if (option.type === CommandOptionType.Subcommand) return
        const components = [
            new TextDisplay({
                content: `### <${option.name}>: ${optionTypesTable[option.type]}${(option.required || option.long_requirements) ? `\n-# required option ${option.long_requirements ?? ""}` : ""}`
            }),
            new Separator(),
            new TextDisplay({
                content: `${option.long_description}`
            }),
        ]
        if (option.choices && option.choices.length > 0) {
            const descriptionTextDisplay = components[components.length - 1] as TextDisplay;
            descriptionTextDisplay.content = `**Choices:**\n${option.choices.map((choice, index) => `⁢   [${index + 1}] ${choice.name}`).join("\n")}` // invisible character before the spaces to prevent discord from collapsing the spaces
        }
        if (option.channel_types && option.channel_types.length > 0) {
            components.push(new Separator());
            components.push(new TextDisplay({
                content: `### Channel Types:\n${option.channel_types.map((type) => `⁢   ${type}`).join("\n")}` // same invisible character shit as above
            }));
            componentsCount += 2
        }
        optionsEmbeds.push(new Container({
            components: components.filter(c => c !== undefined)
        }));
        componentsCount += 4
    });

    let commandWithSubcommands = command
    if (command.parent_command) {
        commandWithSubcommands = commandManager.get(command.parent_command) as Command
    }
    let subcommandsEmbed = undefined
    if ((commandWithSubcommands.subcommands?.list.length ?? 0) > 0) {
        // Determine current subcommand index if not provided
        let subcommandIndex = currentSubcommandIndex;
        if (subcommandIndex === undefined) {
            if (command.parent_command) {
                subcommandIndex = commandWithSubcommands.subcommands!.list.findIndex(sub => sub.name === command.name);
            } else {
                subcommandIndex = 0;
            }
        }

        const totalSubcommands = commandWithSubcommands.subcommands!.list.length;
        const isFirstSubcommand = subcommandIndex === 0;
        const isLastSubcommand = subcommandIndex === totalSubcommands - 1;

        subcommandsEmbed = new Container({
            components: [
                new TextDisplay({
                    content: "### Subcommands"
                }),
                new Separator(),
                new TextDisplay({
                    content: commandWithSubcommands.subcommands!.list.map((subcommand, index) => {
                        const isCurrentSubcommand = index === subcommandIndex
                        return `${isCurrentSubcommand ? "**" : ""}${guild_config.other.prefix}${commandWithSubcommands.name} ${subcommand.name}${isCurrentSubcommand ? "**" : ""}`
                    }).join("\n")
                }),
                new ActionRow({
                    components: [
                        new Button({
                            style: ButtonStyle.Primary,
                            label: "Previous",
                            custom_id: "previous_subcommand",
                            disabled: isFirstSubcommand
                        }),
                        new Button({
                            style: ButtonStyle.Primary,
                            label: "Next",
                            custom_id: "next_subcommand",
                            disabled: isLastSubcommand
                        }),
                    ]
                })
            ]
        })
        componentsCount += 7
    }

    componentsCount += 4 // preemtively add MetaEmbed's count so it appears correctly inside of it

    const MetaEmbed = new Container({
        components: [
            new TextDisplay({
                content: `### Meta Information`
            }),
            new Separator(),
            new TextDisplay({
                content: `tags: ${command.tags.join(", ")}\npipable to: ${command.not_pipable ? "N/A" : ((command.pipable_to.length > 0) ? command.pipable_to.join(", ") : "N/A")}\ncomponents in this message: ${componentsCount}`
            }),
        ]
    });

    const embeds = [titleEmbed, examplesEmbed, ...optionsEmbeds, MetaEmbed];
    if (subcommandsEmbed) embeds.push(subcommandsEmbed);

    return embeds;
}

async function createCommandInfo(invoker: CommandInvoker, commandManager: CommandManager, guild_config: GuildConfig, commandName: string): Promise<CommandResponse | undefined> {
    const command = await fetchCommand(invoker, guild_config, commandManager, commandName);
    if (!command) return; // the fetching function has already handled error replies, no need to do them here.

    // Check if this is a command with subcommands
    let commandWithSubcommands = command;
    if (command.parent_command) {
        commandWithSubcommands = commandManager.get(command.parent_command) as Command;
    }

    const hasSubcommands = (commandWithSubcommands.subcommands?.list.length ?? 0) > 0;
    let currentSubcommandIndex = 0;

    if (hasSubcommands) {
        // Find the current subcommand index
        const currentSubcommandName = command.parent_command ? command.name : null;
        if (currentSubcommandName) {
            currentSubcommandIndex = commandWithSubcommands.subcommands!.list.findIndex(sub => sub.name === currentSubcommandName);
            if (currentSubcommandIndex === -1) currentSubcommandIndex = 0;
        }
    }

    // Function to generate embeds for a specific subcommand (or main command)
    const generateEmbedsForCommand = async (targetCommand: Command, subcommandIndex?: number) => {
        return await embedCommand(targetCommand, invoker, guild_config, commandManager, subcommandIndex);
    };

    const initialEmbeds = await generateEmbedsForCommand(command, currentSubcommandIndex);
    const sent = await action.reply(invoker, {
        components: initialEmbeds,
        components_v2: true,
        ephemeral: guild_config.other.use_ephemeral_replies,
        fetchReply: true
    }) as Message;

    // Only set up collector if there are subcommands and we have a valid message
    if (hasSubcommands && sent && typeof sent !== 'boolean') {
        const collector = sent.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 600_000, // 10 minutes
            filter: (i) => i.customId === 'previous_subcommand' || i.customId === 'next_subcommand'
        });

        collector.on('collect', async (interaction) => {
            if (!interaction.isButton()) return;

            // Check if the user who clicked is the same as the command invoker
            const userId = invoker.author.id;
            if (interaction.user.id !== userId) {
                await interaction.reply({ content: "Only the command invoker can navigate through subcommands.", ephemeral: true });
                return;
            }

            let newSubcommandIndex = currentSubcommandIndex;

            if (interaction.customId === 'previous_subcommand' && currentSubcommandIndex > 0) {
                newSubcommandIndex = currentSubcommandIndex - 1;
            } else if (interaction.customId === 'next_subcommand' && currentSubcommandIndex < commandWithSubcommands.subcommands!.list.length - 1) {
                newSubcommandIndex = currentSubcommandIndex + 1;
            }

            // Update current index and generate new embeds
            if (newSubcommandIndex !== currentSubcommandIndex) {
                currentSubcommandIndex = newSubcommandIndex;
                const newTargetCommand = commandWithSubcommands.subcommands!.list[currentSubcommandIndex];
                const newEmbeds = await generateEmbedsForCommand(newTargetCommand, currentSubcommandIndex);

                // Use action.edit to update the message instead of interaction.update
                await action.edit(sent, { components: newEmbeds, components_v2: true });
                await interaction.deferUpdate();
            } else {
                await interaction.deferUpdate();
            }
        });

        collector.on('end', async () => {
            // Disable the buttons when the collector expires
            try {
                const finalCommand = hasSubcommands && currentSubcommandIndex < commandWithSubcommands.subcommands!.list.length
                    ? commandWithSubcommands.subcommands!.list[currentSubcommandIndex]
                    : command;
                const finalEmbeds = await generateEmbedsForCommand(finalCommand, currentSubcommandIndex);

                // Remove the buttons by filtering out ActionRow components with navigation buttons
                const disabledEmbeds = finalEmbeds.map(embed => {
                    if (embed instanceof Container) {
                        const filteredComponents = embed.components.filter(comp => {
                            if (comp instanceof ActionRow) {
                                const hasNavigationButtons = comp.components.some(button =>
                                    button instanceof Button &&
                                    (button.custom_id === 'previous_subcommand' || button.custom_id === 'next_subcommand')
                                );
                                return !hasNavigationButtons;
                            }
                            return true;
                        });
                        return new Container({ components: filteredComponents });
                    }
                    return embed;
                });

                await action.edit(sent, { components: disabledEmbeds, components_v2: true });
            } catch (error) {
                // Ignore errors when editing expired messages
            }
        });
    }
}

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
                long_description: 'the specific command and/or subcommand to get help for',
                type: CommandOptionType.String,
                required: false
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        argument_order: "<command>",
        example_usage: ["p/help", "p/help test", "p/help git log"],
        aliases: ["commands"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["command"]),
    async function execute ({ invoker, args, guild_config }) {
        const commandManager = (await import('../lib/command_manager')).default;
        const commandName = args.command?.toLowerCase()
        if (!commandName) {
            const embed = createCommandTree(invoker, commandManager, guild_config);
            action.reply(invoker, { components: [embed], components_v2: true, ephemeral: guild_config.other.use_ephemeral_replies })
        } else {
            return createCommandInfo(invoker, commandManager, guild_config, commandName); // this function handles replies and collection of interactions and shit all by itself
        }
    }
);

export default command;