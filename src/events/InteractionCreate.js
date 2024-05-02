import { Events, Collection } from "discord.js";
import * as fs from "fs";
import * as log from "../lib/log.js";
import * as action from "../lib/discord_action.js";
import commandsObject from "../lib/commands.js"

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

const commands = commandsObject.commandsWithoutAliasesExecutions;

commandsObject.on("refresh", newCommandsObject => {
    commands = newCommandsObject.commandsWithoutAliasesExecutions;
})

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

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            chatInputCommand(interaction);
        }
    },
};
