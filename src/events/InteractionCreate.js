import { Events, Collection } from "discord.js";
import * as fs from "fs";
import * as log from "../lib/log.js";
import * as action from "../lib/discord_action.js";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

const commands = new Collection();
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
                commands.set(value, command.default.execute);
            });
        }
        commands.set(command.default.data.name, command.default.execute);
        const data = command.default.data.toJSON();
        commands.set(data.name, command.default.execute);
    } catch (err) {
        log.error(err);
        log.error(`failed to load command: ${file}, likely missing data`);
    }
}

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
            if (option.type === 7) {
                return option.channel;
            } else if (option.type === 11) {
                return option.attachment;
            } else {
                return option.value;
            }
        } catch {
            log.warn(
                "attempt to get undefined value || erorr getting option value"
            );
            return null;
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
