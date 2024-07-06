import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import {
    Collection,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";
import guildConfigs from "../lib/guildConfigs.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const buttons = {
    configureGuild: new ButtonBuilder()
        .setCustomId("configureGuild")
        .setLabel("guild")
        .setStyle(ButtonStyle.Primary),
    cancel: new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("cancel")
        .setStyle(ButtonStyle.Danger),
};
const ActionRow = new ActionRowBuilder();
ActionRow.addComponents(buttons.configureGuild, buttons.cancel);

const configurators = {
    cancel: async function configureGuild(
        message,
        sent,
        bInteraction,
        fromInteraction
    ) {
        action.editMessage(sent, {
            content: "cancelled",
            ephemeral: true,
            components: [],
        });
    },
    configureGuild: async function configureGuild(
        message,
        sent,
        bInteraction,
        fromInteraction
    ) {
        action.editMessage(sent, {
            content: "guild config thing yklkalskdjalksjlkdj",
            ephemeral: true,
            components: [],
        });
    },
};

const data = new CommandData();
data.setName("configure");
data.setDescription("starts the Configuration Wizard:tm:");
data.setPermissions([PermissionFlagsBits.Administrator]);
data.setPermissionsReadable("Administrator");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["config"]);
const command = new Command(
    data,
    async function getArguments(message) {
        const args = new Collection();
        return args;
    },
    async function execute(message, args, fromInteraction) {
        const sent = await action.reply(message, {
            content: "what is being configured",
            ephemeral: true,
            components: [ActionRow],
        });
        const collector = await sent.createMessageComponentCollector({
            time: 60_000,
        });
        let stopped = false;
        collector.on("collect", (interaction) => {
            if (!interaction.user.id === message.author.id) {
                action.reply(message, {
                    content: "you aint the right person",
                    ephemeral: true,
                });
                return;
            }
            if (!configurators[interaction.customId]) {
                action.reply(interaction, {
                    content: "that's not a valid option",
                    ephemeral: true,
                });
                return;
            }
            stopped = true;
            collector.stop();
            const configurator = configurators[interaction.customId];
            configurator(message, sent, interaction, fromInteraction);
        });
        collector
            .on("end", () => {
                if (stopped) return;
                action.editMessage(sent, {
                    content: "collector expired",
                    components: [],
                });
            })
            .catch(console.error);
    },
    []
);

export default command;
