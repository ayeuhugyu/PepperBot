import { Collection } from "discord.js";
import fs from "fs";
import { Command } from "./classes/command";
import * as log from "./log";

const commands = new Collection<string, Command>();

async function getCommands() {
    if (commands.size > 0) return; // avoids circular dependency
    const startOfAll = performance.now();
    const commandFiles = fs
        .readdirSync("src/commands")
        .filter(file => file.endsWith(".ts"));
    for (const file of commandFiles) {
        const start = performance.now();
        const command = await import(`../commands/${file}`);
        commands.set(command.default.name, command.default);
        log.info(`cached command ${command.default.name} in ${(performance.now() - start).toFixed(3)}ms`);
    }
    log.info(`cached all commands in ${(performance.now() - startOfAll).toFixed(3)}ms`);
}

getCommands();  

export default commands;