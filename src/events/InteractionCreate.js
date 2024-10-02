import { Events, Collection } from "discord.js";
import * as fs from "fs";
import * as log from "../lib/log.js";
import * as action from "../lib/discord_action.js";
import commandsObject from "../lib/commands.js";
import * as globals from "../lib/globals.js";
import statistics from "../lib/statistics.js";

const config = globals.config;

const commands = new Collection();
commandsObject.commandsWithoutAliases.forEach((value, key) => {
    commands.set(key, value.execute);
}); // idfk why this works and just using the execute function directly doesn't

async function chatInputCommand(interaction) {
    interaction.author = interaction.user;
    interaction.content = "";
    interaction.options.getOriginal = interaction.options.get;
    interaction.options.quickReference = {};
    interaction.options.get = function (arg) {
        try {
            if (interaction.options.quickReference[arg]) {
                return interaction.options.quickReference[arg];
            }
            if (arg === "_SUBCOMMAND") {
                arg = "subcommand";
            }
            const option = interaction.options.getOriginal(arg);
            switch (option.type) {
                case 7:
                    return option.channel;
                case 11:
                    return option.attachment;
                default:
                    return option.value;
            }
        } catch {
            log.warn(
                "attempt to get undefined value || error getting option value"
            );
            return undefined;
        }
    };
    interaction.options.set = function (arg, value) {
        interaction.options.quickReference[arg] = value;
    };
    let blackliststring = fs.readFileSync(
        "resources/data/blacklist.json",
        "utf-8"
    );
    let blacklists = JSON.parse(blackliststring);
    if (blacklists.includes(interaction.author.id)) {
        interaction.reply(`blacklisted lmfao`);
        return;
    }
    const command = interaction.commandName;

    if (!commands.has(command)) {
        action.reply(
            `hey there hackerman, stop tryna send invalid interactions.`
        );
        return;
    }
    log.info(`SLASH command requested by <@${interaction.user.id}>: p/${command}`);
    const commandFn = commands.get(command);
    const startCommand = performance.now()
    commandFn(interaction, interaction.options, true).catch((err) => {log.error(err)}).then((returned) => {
        let logmsg = `command received: ${command} in: ${(performance.now() - startCommand).toFixed(3)}ms from: ${interaction.author.username} (${interaction.author}) `;
        statistics.logCommandUsage(command, performance.now() - startCommand);
        log.info("wrote statistic to " + command)
        if (interaction.channel) {
            if (interaction.channel.type === 1) {
                logmsg += `in DM `;
            } else {
                logmsg += `in: ${interaction.channel.name} (${interaction.channel}) `;
            }
        }
        if (interaction.guild) {
            logmsg += `in guild: ${interaction.guild.name} (${interaction.guild}) `;
        }
        log.debug(logmsg);
    });
}

function getIsDisgraceful(message) {
    if (message.guild && message.guild.id == "1112819622505365556") {
        if (message.channel && message.channel.id == "1171660137946157146") {
            if (
                message.member.id !== "440163494529073152" &&
                message.member.id !== message.client.user.id
            ) {
                action.sendDM(message.user, { content: "Disgraceful." });
                action.deleteMessage(message);
                action.reply(message, {
                    content: "Disgraceful.",
                    ephemeral: true,
                });
                return true;
            }
        }
    }
    return false;
}

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const DNI = getIsDisgraceful(interaction);
        if (DNI) return;
        if (interaction.isChatInputCommand()) {
            chatInputCommand(interaction);
        }
    },
};
