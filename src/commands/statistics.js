import statistics from "../lib/statistics.js";
import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import * as globals from "../lib/globals.js";
import { AdvancedPagedMenuBuilder } from "../lib/types/menuBuilders.js";
import default_embed from "../lib/default_embed.js";

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
    const fields = [{ name: "", inline: true }, { name: "", inline: true }, { name: "", inline: true }];
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
        
        const commandUsageEmbed = default_embed();
        commandUsageEmbed.setTitle("Usage");
        commandUsageEmbed.setDescription(
            "GPT Messages: " + gpt
        );
        const commandUsageHumanReadable = Object.keys(commandUsage).map((commandName) => {
            return `${commandName}: ${commandUsage[commandName]}\n`;
        });
        const commandUsageFields = splitTextToThreeFields(commandUsageHumanReadable)
        commandUsageEmbed.addFields(...commandUsageFields);

        const hourlyUsageEmbed = default_embed();
        hourlyUsageEmbed.setTitle("Hourly Usage");
        const hourlyUsageHumanReadable = Object.keys(hourlyUsage).map((hour) => {
            return `${hourToHumanReadable(hour)}: ${hourlyUsage[hour]}\n`;
        });
        const hourlyUsageFields = splitTextToThreeFields(hourlyUsageHumanReadable)
        hourlyUsageEmbed.addFields(...hourlyUsageFields);
        
        const executionTimeEmbed = default_embed();
        executionTimeEmbed.setTitle("Execution Time");
        const executionTimeHumanReadable = Object.keys(executionTime).map((commandName) => {
            const times = executionTime[commandName];
            const average = times.reduce((a, b) => a + b, 0) / times.length;
            return `${commandName}: ${average.toFixed(2)}ms\n`;
        });
        const executionTimeFields = splitTextToThreeFields(executionTimeHumanReadable)
        executionTimeEmbed.addFields(...executionTimeFields);

        const menu = new AdvancedPagedMenuBuilder();
        menu.full.addPage(commandUsageEmbed);
        menu.full.addPage(hourlyUsageEmbed);
        menu.full.addPage(executionTimeEmbed);

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
