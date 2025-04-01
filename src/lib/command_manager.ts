import { REST, Routes, Collection } from "discord.js";
import fs from "fs";
import * as log from "./log";
import { client } from "../bot";
import { Command, ValidationCheck } from "./classes/command";
import { CommandEntryType, CommandTag, InvokerType } from "./classes/command_enums";
import { inspect } from "util";

/**
 * Greater indices have greater priority; that means the last element is the most prioritized.
 */
const COMMAND_ENTRY_TYPE_ORDERING = Object.seal([
    CommandEntryType.SubcommandRootAlias,
    CommandEntryType.CommandAlias,
    CommandEntryType.Command,
] as const);

interface CommandEntry {
    command: Command,
    type: CommandEntryType,
    name: string,
}

export class CommandManager {
    mappings = new Collection<string, CommandEntry>();
    get(name: string): Command | undefined {
        return this.mappings.get(name)?.command
    };

    withTag(tag: CommandTag): Command[] {
        const result: Command[] = [];
        const seen = new Set<Command>();

        for (const { command } of this.mappings.values()) {
            if (command.tags.includes(tag) && !seen.has(command)) {
                result.push(command);
                seen.add(command);
            }

            const subcommandDescendants = Array.from<Command>(command.subcommands?.list ?? []);
            while (subcommandDescendants.length > 0) {
                const subcommand = subcommandDescendants.pop()!;
                if (subcommand.tags.includes(tag) && !seen.has(subcommand)) {
                    result.push(subcommand);
                    seen.add(subcommand);
                }
                subcommandDescendants.push(...subcommand.subcommands?.list ?? []);
            }
        }

        return result;
    }

    getEntryType(name: string): CommandEntryType | undefined {
        return this.mappings.get(name)?.type
    }

    async load() {
        if (this.mappings.size > 0) return; // avoids circular dependency
        const start = performance.now();
        const files = fs
            .readdirSync("src/commands")
            .filter(file => file.endsWith(".ts"));

        for (const file of files) {
            const start = performance.now();
            let command
            try {
                command = (await import(`../commands/${file}`))?.default as unknown;
            } catch (e) {
                log.error(`failed to load command ${file}: `);
                log.error(e);
                continue;
            }
            if (!command) { log.error(`command ${file} has no default export`); continue; }
            if (!(command instanceof Command)) { log.error(`command ${file} has a default export that isn't a command`); continue; }

            if (command.validation_errors.length > 0 && command.validation_errors.some((error: ValidationCheck) => error.unrecoverable)) {
                log.error(`unrecoverable validation errors found in ${command.name}; skipping cache; errors: ${command.validation_errors.map((error: ValidationCheck) => error.message).join(", ")}`);
                continue;
            }

            this.assign(command, CommandEntryType.Command, command.name)

            for (const alias of command.aliases) {
                this.assign(command, CommandEntryType.CommandAlias, alias)
            }

            const subcommandDescendants = Array.from<Command>(command.subcommands?.list ?? []); // shallow clone so deeper instances can be appended as a queue

            while (subcommandDescendants.length !== 0) {
                const subcommand = subcommandDescendants.pop()!;

                for (const alias of subcommand.root_aliases) {
                    this.assign(subcommand, CommandEntryType.SubcommandRootAlias, alias);
                }

                subcommandDescendants.push(...subcommand.subcommands?.list ?? []);
            }

            log.info(`loaded command ${command.name} in ${(performance.now() - start).toFixed(3)}ms`);
        }

        log.info(`loaded all commands in ${(performance.now() - start).toFixed(3)}ms`);
    }

    /**
     * @param target target guild to deploy to. if undefined, deploy globally
     */
    async deploy(target?: string) {
        const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
        const json = Array.from(this.mappings.values())
            .filter(({ command, type }) => type === CommandEntryType.Command && command.input_types.includes(InvokerType.Interaction))
            .map(({ command }) => command.toJSON())

        const route = target
            ? Routes.applicationGuildCommands
            : Routes.applicationCommands;

        await rest.put(
            route(client.user!.id, target!),
            { body: json },
        );
    }

    /**
     * @param target target guild to deploy to. if undefined, deploy globally
     */
    async undeploy(target?: string) {
        const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
        const route = target
            ? Routes.applicationGuildCommands
            : Routes.applicationCommands;

        await rest.put(
            route(client.user!.id, target!),
            { body: [] },
        );
    }

    /**
     * @returns whether assignment was successful
     */
    private assign(command: Command, type: CommandEntryType, name: string) {
        const existing = this.mappings.get(name);
        if (existing) {
            const priority = COMMAND_ENTRY_TYPE_ORDERING.indexOf(type);
            const priorityExisting = COMMAND_ENTRY_TYPE_ORDERING.indexOf(existing.type);
            const lesserPriority = priorityExisting > priority;
            if (lesserPriority || (priorityExisting === priority)) {
                console.error(
                    `cannot add a ${type} w/ name "${name}" because it already exists as a ${existing.type}` +
                    (lesserPriority ? `, which takes priority.` : ".") + " keeping previous assignment"
                );
                return false;
            }
        };

        this.mappings.set(name, { command, type, name });
        return true
    }
}

const manager = new CommandManager();
await manager.load();

export default manager;
