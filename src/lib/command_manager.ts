import { Collection } from "discord.js";
import fs from "fs";
import { Command, ValidationCheck } from "./classes/command";
import * as log from "./log";

export class CommandManager {
    commands = {
        base: new Collection<string, Command>(),
        aliases: new Collection<string, Command>(),
        normal_aliases: new Collection<string, Command>()
    }
    get(name: string): Command | undefined {
        return this.commands.base.get(name) || this.commands.aliases.get(name);
    };
    async getCommands() {
        if (this.commands.base.size > 0) return; // avoids circular dependency
        const startOfAll = performance.now();
        const commandFiles = fs
            .readdirSync("src/commands")
            .filter(file => file.endsWith(".ts"));
        for (const file of commandFiles) {
            const start = performance.now();
            const command = await import(`../commands/${file}`);
            if (!command.default) {
                log.error(`command ${file} has no default export`);
                continue;
            }
            if (this.commands.base.has(command.default.name)) {
                log.error(`duplicate command name ${command.default.name}; skipping cache`);
                continue;
            }
            if (command.default.validation_errors.length > 0 && command.default.validation_errors.some((error: ValidationCheck) => error.unrecoverable)) {
                log.error(`unrecoverable validation errors found in ${command.default.name}; skipping cache; errors: ${command.default.validation_errors.map((error: ValidationCheck) => error.message).join(", ")}`);
                continue;
            }
            this.commands.base.set(command.default.name, command.default);
            if (command.default.aliases) {
                for (const alias of command.default.aliases) {
                    if (this.commands.aliases.has(alias)) {
                        log.error(`duplicate alias ${alias} for command ${command.default.name}; skipping alias`);
                        continue;
                    }
                    this.commands.aliases.set(alias, command.default);
                }
            }
            log.info(`cached command ${command.default.name} in ${(performance.now() - start).toFixed(3)}ms`);
        }
        log.info(`cached all commands in ${(performance.now() - startOfAll).toFixed(3)}ms`);
    }
}

const manager = new CommandManager();
await manager.getCommands();

export default manager;