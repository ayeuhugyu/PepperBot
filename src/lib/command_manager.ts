import { Collection } from "discord.js";
import fs from "fs";
import { Command, ValidationCheck } from "./classes/command";
import * as log from "./log";

export class CommandManager {
    commands = {
        base: new Collection<string, Command>(),
        aliases: new Collection<string, Command>(),
        normal_aliases: new Collection<string, Command>()
    };

    get(name: string): Command | undefined {
        return (
            this.commands.base.get(name) ||
            this.commands.aliases.get(name) ||
            this.commands.normal_aliases.get(name)
        );
    }

    async getCommands() {
        if (this.commands.base.size > 0) return; // avoids circular dependency

        const startOfAll = performance.now();
        const commandFiles = fs
            .readdirSync("src/commands")
            .filter((file) => file.endsWith(".ts"));

        Promise.all(commandFiles.map(async (file) => {
            
        }));

        for (const file of commandFiles) {
            const start = performance.now();
            let imported;
            try {
                imported = await import(`../commands/${file}`);
            } catch (error) {
                log.error(`failed to import ${file}: ${error}`);
                continue;
            }

            if (!imported.default) {
                log.error(`command ${file} has no default export`);
                continue;
            }

            const cmd: Command = imported.default;

            if (this.commands.base.has(cmd.name)) {
                log.error(`duplicate command name ${cmd.name}; skipping cache`);
                continue;
            }

            if (
                cmd.validation_errors.length > 0 &&
                cmd.validation_errors.some((error: ValidationCheck) => error.unrecoverable)
            ) {
                log.error(
                    `unrecoverable validation errors found in ${cmd.name}; skipping cache; errors: ${cmd.validation_errors
                        .map((error: ValidationCheck) => error.message)
                        .join(", ")}`
                );
                continue;
            }

            // Cache the command
            this.commands.base.set(cmd.name, cmd);

            // Cache any aliases
            if (cmd.aliases) {
                for (const alias of cmd.aliases) {
                    if (this.commands.aliases.has(alias)) {
                        log.error(`duplicate alias ${alias} for command ${cmd.name}; skipping alias`);
                        continue;
                    }
                    this.commands.aliases.set(alias, cmd);
                }
            }

            // Cache normal aliases for subcommands (todo: support subcommands of subcommands)
            if (cmd.subcommands && cmd.subcommands.length > 0) {
                for (const subcommand of cmd.subcommands) {
                    for (const alias of subcommand.normal_aliases) {
                        if (this.commands.normal_aliases.has(alias) || this.commands.base.has(alias)) {
                            log.error(`duplicate normal alias ${alias} for command ${cmd.name}; skipping alias`);
                            continue;
                        }
                        this.commands.normal_aliases.set(alias, cmd);
                    }
                }
            }

            log.info(`cached command ${cmd.name} in ${(performance.now() - start).toFixed(3)}ms`);
        }
        log.info(`cached all commands in ${(performance.now() - startOfAll).toFixed(3)}ms`);
    }
}

const manager = new CommandManager();
await manager.getCommands();

export default manager;
