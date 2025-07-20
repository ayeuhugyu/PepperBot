import { Router, Request, Response, NextFunction } from "express";
import commands from "../../lib/command_manager";
import { CommandEntryType, CommandOptionType } from "../../lib/classes/command_enums";
import * as log from "../../lib/log";

// Helper function to convert option types to readable names
function getOptionTypeName(type: any): string {
    const typeMap: Record<number, string> = {
        [CommandOptionType.String]: "string",
        [CommandOptionType.Integer]: "integer",
        [CommandOptionType.Boolean]: "boolean",
        [CommandOptionType.User]: "user",
        [CommandOptionType.Channel]: "channel",
        [CommandOptionType.Role]: "role",
        [CommandOptionType.Mentionable]: "mentionable",
        [CommandOptionType.Number]: "number",
        [CommandOptionType.Attachment]: "attachment",
        [CommandOptionType.Subcommand]: "subcommand",
        [CommandOptionType.SubcommandGroup]: "subcommand group"
    };
    return typeMap[type] || 'unknown';
}

export function createCommandsRoutes(): Router {
    const router = Router();

    // Commands list page
    router.get("/commands", async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get all unique commands from the manager
            const commandEntries = Array.from(commands.mappings.values());
            const uniqueCommands = [];

            // Filter to only get primary commands (not aliases) and store unique commands
            for (const entry of commandEntries) {
                if (entry.type === CommandEntryType.Command && !entry.command.is_sub_command) {
                    uniqueCommands.push({
                        name: entry.command.name,
                        description: entry.command.description,
                        long_description: entry.command.long_description,
                        hasSubcommands: entry.command.subcommands?.list && entry.command.subcommands.list.length > 0,
                        subcommandCount: entry.command.subcommands?.list?.length || 0,
                        isPublic: !Object.values(entry.command.access.whitelist).some(list => list.length > 0),
                        tags: entry.command.tags.map(tag => tag.replace('#', ''))
                    });
                }
            }

            // Sort commands alphabetically
            uniqueCommands.sort((a, b) => a.name.localeCompare(b.name));

            res.render("commands", {
                title: "commands",
                description: "PepperBot Commands",
                path: "/commands",
                stylesheet: "commands.css",
                commands: uniqueCommands,
                totalCommands: uniqueCommands.length
            });
        } catch (err) {
            next(err);
        }
    });

    // Detailed command views
    router.get("/commands/:command/:subcommand?", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const commandName = req.params.command;
            const subcommandName = req.params.subcommand;

            const commandEntry = commands.mappings.get(commandName);
            if (!commandEntry || commandEntry.type !== CommandEntryType.Command) {
                return res.status(404).render("error", {
                    title: "command not found",
                    description: "Command Not Found",
                    path: req.path,
                    stylesheet: "main.css",
                    error: "command not found",
                    code: 404
                });
            }

            const command = commandEntry.command;
            let targetCommand = command;
            let isSubcommand = false;

            // If subcommand is specified, find it
            if (subcommandName) {
                const subcommand = command.subcommands?.list?.find(sub =>
                    sub.name === subcommandName || sub.aliases?.includes(subcommandName)
                );

                if (!subcommand) {
                    return res.status(404).render("error", {
                        title: "subcommand not found",
                        description: "Subcommand Not Found",
                        path: req.path,
                        stylesheet: "main.css",
                        error: `subcommand '${subcommandName}' not found in command '${commandName}'`,
                        code: 404
                    });
                }

                targetCommand = subcommand;
                isSubcommand = true;
            }

            // Build pipability data
            const isPipable = !targetCommand.not_pipable && (targetCommand.pipable_to || []).length > 0;
            let pipableCommands: any[] = [];

            if (isPipable) {
                const allCommands = Array.from(commands.mappings.values());
                const pipableItems: string[] = [];

                for (const pipableTarget of targetCommand.pipable_to || []) {
                    if (pipableTarget.startsWith('#')) {
                        // It's a tag - find all commands with this tag
                        const tag = pipableTarget;
                        const commandsWithTag = allCommands
                            .filter(entry => entry.type === CommandEntryType.Command && !entry.command.is_sub_command)
                            .filter(entry => entry.command.tags.some(cmdTag => cmdTag === tag))
                            .map(entry => ({
                                name: entry.command.name,
                                description: entry.command.description
                            }));

                        if (commandsWithTag.length > 0) {
                            pipableItems.push(`${tag} (${commandsWithTag.length})\n${commandsWithTag.map(cmd => `  p/${cmd.name}`).join("\n")}`);
                        }
                    } else {
                        // It's a regular command name
                        const commandEntry = commands.mappings.get(pipableTarget);
                        if (commandEntry && commandEntry.type === CommandEntryType.Command) {
                            pipableItems.push(`p/${commandEntry.command.name}`);
                        }
                    }
                }
                pipableCommands = pipableItems;
            }

            // Format command data for the template
            const exampleUsage = Array.isArray(targetCommand.example_usage)
                ? targetCommand.example_usage
                : [targetCommand.example_usage].filter(Boolean);

            const commandData = {
                name: targetCommand.name,
                fullName: isSubcommand ? `${command.name} ${targetCommand.name}` : targetCommand.name,
                description: targetCommand.description,
                long_description: targetCommand.long_description,
                argument_order: targetCommand.argument_order,
                example_usage: exampleUsage.filter((ex) => ex.length > 0).length > 0 ? exampleUsage : ["missing example usage"],
                aliases: targetCommand.aliases.map((a) => targetCommand.parent_command ? `${targetCommand.parent_command} ${a}` : a) || [],
                displayAliases: targetCommand.aliases.length > 0,
                root_aliases: targetCommand.root_aliases || [],
                displayRootAliases: isSubcommand && targetCommand.root_aliases.length > 0,
                tags: targetCommand.tags?.map(tag => tag.replace('#', '')) || [],
                isSubcommand: isSubcommand,
                parentCommand: isSubcommand ? command.name : null,
                isPublic: !Object.values(command.access.whitelist).some(list => list.length > 0),
                allow_external_guild: command.allow_external_guild,
                nsfw: command.nsfw,
                not_pipable: targetCommand.not_pipable,
                pipable_to: targetCommand.pipable_to || [],
                isPipable: isPipable,
                pipableCommands: pipableCommands,
                input_types: command.input_types?.map(type =>
                    type === 'interaction' ? 'slash' : 'text'
                ) || [],
                contributors: command.contributors?.map(c => c.name) || [],
                options: targetCommand.options?.filter((opt) => opt.type !== CommandOptionType.Subcommand).map(opt => ({
                    name: opt.name,
                    description: opt.description,
                    long_description: opt.long_description,
                    type: getOptionTypeName(opt.type),
                    required: opt.required,
                    choices: opt.choices || [],
                    displayChoices: opt.choices.length > 0,
                    channel_types: opt.channel_types || [],
                    long_requirements: opt.long_requirements,
                    displayRequired: opt.long_requirements || opt.required || false,
                })) || [],
                optionsCount: targetCommand.options?.filter((opt) => opt.type !== CommandOptionType.Subcommand).length || 0,
                showOptions: targetCommand.options?.filter((opt) => opt.type !== CommandOptionType.Subcommand).length > 0,
                subcommands: !isSubcommand && command.subcommands?.list ?
                    command.subcommands.list.map(sub => ({
                        name: sub.name,
                        parentCommand: sub.parent_command,
                        description: sub.description,
                        long_description: sub.long_description,
                        hasSubcommands: sub.subcommands?.list && sub.subcommands.list.length > 0,
                        subcommandCount: sub.subcommands?.list?.length || 0,
                        isPublic: !Object.values(sub.access.whitelist).some(list => list.length > 0),
                        tags: sub.tags.map(tag => tag.replace('#', ''))
                    })) : [],
                subcommandsCount: !isSubcommand && command.subcommands?.list ? command.subcommands.list.length : 0,
                showSubcommands: !isSubcommand && command.subcommands?.list && command.subcommands.list.length > 0
            };

            res.render("command-detail", {
                title: `p/${commandData.fullName}`,
                description: `PepperBot ${isSubcommand ? 'Subcommand' : 'Command'}: ${commandData.fullName}`,
                path: req.path,
                stylesheet: "command-detail.css",
                command: commandData
            });
        } catch (err) {
            next(err);
        }
    });

    return router;
}
