import { REST, Routes } from "discord.js";
import { config } from "dotenv";
config();
import { client } from "./bot.js";
import * as log from "./lib/log.js";
import fs from "fs";
import process from "node:process";

let imported = false;

BigInt.prototype.toJSON = function () {
    return this.toString();
};

let commands

export async function getCommands() {
    import("./lib/commands.js").then((commandsObject) => {
        commands = commandsObject.default.commandsWithoutAliases.map((command) => {
            return command.data.toJSON();
        });
    });
}

if (!imported) { // avoids circular dependency
    imported = true;
    getCommands();
}

//setTimeout(() => {
    //console.log(commands);
//}, 3000);

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

export async function refreshGuildCommands(guildId, shouldVoid) {
    return new Promise(async (resolve, reject) => {
        try {
            log.info(`Started ${shouldVoid ? "voiding" : "refreshing"} ${commands.length} application (/) commands for guild ${guildId}`);
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guildId),
                { body: shouldVoid ? [] : commands },
            );
            log.info(`Successfully ${shouldVoid ? "voided" : "reloaded"} ${commands.length} application (/) commands for guild ${guildId}`);
            resolve();
        } catch (error) {
            log.error(error);
            reject(error);
        }
    });
}

export async function refreshGlobalCommands(shouldVoid) {
    return new Promise(async (resolve, reject) => {
        try {
            log.info(`Started ${shouldVoid ? "voiding" : "refreshing"} ${commands.length} application (/) commands globally`);
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: shouldVoid ? [] : commands },
            );
            log.info(`Successfully ${shouldVoid ? "voided" : "reloaded"} ${commands.length} application (/) commands globally`);
            resolve();
        } catch (error) {
            log.error(error);
            reject(error);
        }
    });
}

