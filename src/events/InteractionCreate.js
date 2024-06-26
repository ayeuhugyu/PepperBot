import { Events, Collection } from "discord.js";
import * as fs from "fs";
import * as log from "../lib/log.js";
import * as action from "../lib/discord_action.js";
import commandsObject from "../lib/commands.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const commands = commandsObject.commandsWithoutAliasesExecutions;

async function chatInputCommand(interaction) {
    interaction.author = interaction.user;
    interaction.content = "";
    interaction.options.getOriginal = interaction.options.get;
    interaction.options.get = function (arg) {
        try {
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
                "attempt to get undefined value || erorr getting option value"
            );
            return undefined;
        }
    };
    let blackliststring = fs.readFileSync(config.paths.blacklist_file, "utf-8");
    let blacklists = JSON.parse(blackliststring);
    if (blacklists.includes(interaction.author.id)) {
        interaction.reply(`blacklisted lmfao`);
        return;
    }
    const command = interaction.commandName;

    if (!commands.has(command)) {
        action.reply(`invalid command: ${command}, baffoon!`);
        return;
    }
    const commandFn = commands.get(command);
    await commandFn(interaction, interaction.options, true).catch((err) => {
        log.error(err);
    });
    let logmsg = `command received: ${command} from: ${interaction.author.username} (${interaction.author}) `;
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
    log.info(logmsg);
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
