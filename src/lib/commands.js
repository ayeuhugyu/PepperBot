import { Collection } from "discord.js";
import fs from "fs";
import * as log from "./log.js";
import { file } from "googleapis/build/src/apis/file/index.js";

const commands = new Collection();
const commandsWithoutAliases = new Collection();
const commandSubCommandAliases = new Collection();

async function getCommands() {
    const allstart = performance.now();
    let highest = { file: undefined, time: 0 }
    let lowest = { file: undefined, time: Infinity }
    const commandFiles = fs
        .readdirSync("src/commands")
        .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        try {
            const thisstart = performance.now()
            const command = await import(`../commands/${file}`);
            if (
                commands.find(
                    (cmd) => command.default.data.name == cmd.data.name
                )
            ) {
                log.fatal(
                    `command '${command.default.data.name}' is unable to be processed due to posessing a duplicate name as another command`
                );
                continue;
            }
            if (
                command.default.data.aliases &&
                command.default.data.aliases.length > 0
            ) {
                command.default.data.aliases.forEach((value) => {
                    commands.set(value, command.default);
                });
            }
            if (command.default.subcommands && command.default.subcommands.length > 0) {
                command.default.subcommands.forEach((subcommand) => {
                    if (subcommand.data.normalAliases && subcommand.data.normalAliases.length > 0) {
                        subcommand.data.normalAliases.forEach((value) => {
                            commandSubCommandAliases.set(value, { parentCommand: command.default.execute, subcommand: subcommand, parentCommandNonExecution: command.default }); // added parentCommandNonExecution later, not sure where parentCommand is used so instead of breaking things and trying to fix them i just do it like this. don't care that its not optimal.
                        });
                    }
                });
            }
            commands.set(command.default.data.name, command.default);
            const data = command.default.data.toJSON();
            commands.set(data.name, command.default);
            commandsWithoutAliases.set(data.name, command.default);
            const endtime = performance.now();
            log.info(`cached ${file} in ${(endtime - thisstart).toFixed(3)}ms`);
            if (endtime - thisstart > highest.time) {
                highest = { file: file, time: endtime - thisstart }
            }
            if (endtime - thisstart < lowest.time) {
                lowest = { file: file, time: endtime - thisstart }
            }
        } catch (err) {
            log.error(err);
            log.error(`failed to load command: ${file}`);
            continue;
        }
    }
    log.info(`cached commands in ${(performance.now() - allstart).toFixed(3)}ms, with the longest command (${highest.file}) taking ${highest.time.toFixed(3)} and the shortest command (${lowest.file}) taking ${lowest.time.toFixed(3)}`);
}

await getCommands();

export default {
    commands: commands,
    commandsWithoutAliases: commandsWithoutAliases,
    commandSubCommandAliases: commandSubCommandAliases,
};
