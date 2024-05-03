import events from "node:events"
import { Collection } from "discord.js";

const commands = new Collection();
const commandsWithoutAliases = new Collection();

async function getCommands() {
    const commandFiles = fs
        .readdirSync("src/commands")
        .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command = await import(`../commands/${file}`);
        try {
            if (
                command.default.data.aliases &&
                command.default.data.aliases.length > 0
            ) {
                command.default.data.aliases.forEach((value) => {
                    commands.set(value, command.default);
                });
            }
            commands.set(command.default.data.name, command.default);
            const data = command.default.data.toJSON();
            commands.set(data.name, command.default);
            commandsWithoutAliases.set(data.name, command.default);
        } catch (err) {
            log.error(err);
            log.error(`failed to load command: ${file}, likely missing data`);
        }
    }
}

const emitter = new events.EventEmitter();

export default {
    commands: commands,
    commandExecutions: commands.map((command) => command.execute),
    commandsWithoutAliases: commandsWithoutAliases,
    commandsWithoutAliasesExecutions: commandsWithoutAliases.map((command) => command.execute),
    emitter: emitter,
    on: emitter.on,
    once: emitter.once,
    refresh: async (command) => {
        const commandFile = await import(`../commands/${command}.js`);
        try {
            if (
                commandFile.default.data.aliases &&
                commandFile.default.data.aliases.length > 0
            ) {
                commandFile.default.data.aliases.forEach((value) => {
                    commands.set(value, commandFile.default);
                });
            }
            commands.set(commandFile.default.data.name, commandFile.default);
            const data = commandFile.default.data.toJSON();
            commands.set(data.name, commandFile.default);
            commandsWithoutAliases.set(data.name, commandFile.default);
            this.emitter.emit("refresh", this);
        } catch (err) {
            log.error(err);
            log.error(
                `failed to load command: ${command}, likely missing data`
            );
        }
    },
    refreshAll: async () => {
        await getCommands()
        this.emitter.emit("refresh", this);
    }
};
