import statistics from "../lib/statistics.js";
import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import * as globals from "../lib/globals.js";
import { AdvancedPagedMenuBuilder } from "../lib/types/menuBuilders.js";
import * as theme from "../lib/theme.js";

const config = globals.config;

function hourToHumanReadable(hour) {
    if (hour < 12) {
        return `${hour} AM`;
    } else if (hour === 12) {
        return `${hour} PM`;
    } else {
        return `${hour - 12} PM`;
    }
}

function splitTextToThreeFields(text) {
    const fields = [{ name: "​", inline: true }, { name: "​", inline: true }, { name: "​", inline: true }]; // names are zero width spaces
    const lines = text.split("\n");
    let currentFieldId = 0;
    for (const line of lines) {
        const field = fields[currentFieldId];
        if (!field.value) {
            field.value = "";
        }
        field.value += line + "\n";
        currentFieldId++;
        if (currentFieldId > 2) {
            currentFieldId = 0;
        }
    }
    return fields;
}

const data = new CommandData();
data.setName("statistics");
data.setDescription("shows some statistics about bot usage");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
;
data.setAliases(["stats"]);
const command = new Command(
    data,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        const stats = statistics.statistics;
        const commandUsage = stats.commandUsage;
        const hourlyUsage = stats.hourlyUsage;
        const executionTime = stats.executionTime;
        const gpt = stats.gpt;
        
        const commandUsageEmbed = theme.createThemeEmbed(theme.themes[gconfig.theme] || theme.themes.CURRENT);
        commandUsageEmbed.setTitle("Usage");
        commandUsageEmbed.setDescription(`
            GPT Messages: ${gpt}
            Text Command Usage: ${stats.commandTypeUsage.text}
            Slash Command Usage: ${stats.commandTypeUsage.slash}
            `);
        const commandUsageHumanReadable = Object.keys(commandUsage).map((commandName) => {
            return `${commandName}: ${commandUsage[commandName]}`;
        });
        const commandUsageFields = splitTextToThreeFields(commandUsageHumanReadable.join("\n"))
        commandUsageEmbed.addFields(commandUsageFields[0], commandUsageFields[1], commandUsageFields[2]);

        const hourlyUsageEmbed = theme.createThemeEmbed(theme.themes[gconfig.theme] || theme.themes.CURRENT);
        hourlyUsageEmbed.setTitle("Hourly Usage");
        const hourlyUsageHumanReadable = Object.keys(hourlyUsage).map((hour) => {
            return `${hourToHumanReadable(hour)}: ${hourlyUsage[hour]}`;
        });
        const hourlyUsageFields = splitTextToThreeFields(hourlyUsageHumanReadable.join("\n"))
        hourlyUsageEmbed.addFields(hourlyUsageFields[0], hourlyUsageFields[1], hourlyUsageFields[2]);
        
        const executionTimeEmbed = theme.createThemeEmbed(theme.themes[gconfig.theme] || theme.themes.CURRENT);
        executionTimeEmbed.setTitle("Execution Time");
        const executionTimeHumanReadable = Object.keys(executionTime).map((commandName) => {
            const times = executionTime[commandName];
            const average = times.reduce((a, b) => a + b, 0) / times.length;
            return `${commandName}: ${average.toFixed(2)}ms`;
        });
        const executionTimeFields = splitTextToThreeFields(executionTimeHumanReadable.join("\n"));
        executionTimeEmbed.addFields(executionTimeFields[0], executionTimeFields[1], executionTimeFields[2]);

        const usersEmbed = theme.createThemeEmbed(theme.themes[gconfig.theme] || theme.themes.CURRENT);
        usersEmbed.setTitle("Users");
        let guilds = message.client.application.approximateGuildCount || "unknown"
        let guildUsers = 0
        let installUsers = message.client.application.approximateUserInstallCount || "unknown"

        let guildsData = await message.client.shard.fetchClientValues("guilds.cache");
        guildsData.forEach((guildsCache) => {
            guildsCache.forEach((guild) => {
                guildUsers += guild.memberCount
            });
        });

        usersEmbed.setDescription(
            `apprx. guild count: ${guilds}\n` +
            `users in guilds count: ${guildUsers}\n` +
            `apprx. user installs: ${installUsers}`
        );

        const menu = new AdvancedPagedMenuBuilder();
        menu.full.addPage(commandUsageEmbed);
        menu.full.addPage(hourlyUsageEmbed);
        menu.full.addPage(executionTimeEmbed);
        menu.full.addPage(usersEmbed);

        const sentMessage = await action.reply(message, {
            embeds: [menu.pages[menu.currentPage]],
            components: [menu.actionRow],
            ephemeral: gconfig.useEphemeralReplies,
        });

        if (!sentMessage) return;
        return menu.full.begin(sentMessage, 120_000, menu);
    }
);

export default command;
