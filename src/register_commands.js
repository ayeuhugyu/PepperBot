import { REST, Routes } from "discord.js";
import { client } from "./bot.js";
import * as log from "./lib/log.js";
import fs from "fs";
import process from "node:process";

BigInt.prototype.toJSON = function () {
    return this.toString();
};

async function getCommands() {
    const commandFiles = fs
        .readdirSync("src/commands/")
        .filter((file) => file.endsWith(".js"));
    let commands = [];
    for (const file of commandFiles) {
        const filePath = `./commands/${file}`;
        import(filePath)
            .then((command) => {
                const data = command.default.data.toJSON();
                //data.type = command.default.data.type || 1;
                if (!(data.whitelist && data.whitelist.length > 0)) {
                    commands.push(data);
                }
            })
            .catch((err) => {
                log.error(err);
            });
    }
    return commands;
}

const commands = await getCommands();

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// and deploy your commands!
async function deployToGuild(guild) {
    return new Promise((resolve, reject) => {
        try {
            if (!guild.id) {
                guild = { name: "idConvertedGuild", id: guild };
            }
            log.info(`refreshing ${commands.length} application (/) commands. for guild ${guild.name} (${guild.id})`);
            const data = rest.put(
                Routes.applicationGuildCommands(client.user.id, guild.id),
                { body: commands }
            );
            log.info(`reloaded ${data.length} application (/) commands. for guild ${guild.name} (${guild.id})`);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

async function undeployFromGuild(guild) {
    return new Promise((resolve, reject) => {
        try {
            if (!guild.id) {
                guild = { name: "idConvertedGuild", id: guild };
            }
            log.info(`deleting ${commands.length} application (/) commands. for guild ${guild.name} (${guild.id})\n`);
            const data = rest.put(
                Routes.applicationGuildCommands(client.user.id, guild.id),
                { body: [] }
            );
            log.info(`deleted ${data.length} application (/) commands. for guild ${guild.name} (${guild.id})\n`);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

async function register(g) {
    try {
        if (g === "global") {
            const data = await rest.put(
                Routes.applicationCommands(client.user.id),
                {
                    body: commands,
                }
            );
            return;
        }
        if (g) {
            await deployToGuild(g);
            return;
        }
        await Promise.all(
            client.guilds.cache.map(async (guild) => {
                await deployToGuild(guild);
            })
        );
        /*
        const data = await rest.put(
            Routes.applicationCommands(client.user.id),
            {
                body: commands,
            }
        );*/
        return;
    } catch (error) {
        log.error(error);
    }
}

async function unregister(g) {
    try {
        if (g === "global") {
            const data = await rest.put(
                Routes.applicationCommands(client.user.id),
                {
                    body: [],
                }
            );
            return;
        }
        if (g) {
            await undeployFromGuild(g);
            return;
        }
        if (g === "global") {
            const data = await rest.put(
                Routes.applicationCommands(client.user.id),
                {
                    body: [],
                }
            );
            return;
        }
        await Promise.all(
            client.guilds.cache.map(async (guild) => {
                await undeployFromGuild(guild);
            })
        );

        return;
    } catch (error) {
        log.error(error);
    }
}
export { register, unregister };
