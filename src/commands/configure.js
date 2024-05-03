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
    ButtonInteraction,
} from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";
import guildConfigs from "../lib/guildConfigs.js";
import * as globals from "../lib/globals.js";

// command incomplete, do not remove whitelist yet

const config = globals.config;

const configureguilddata = new SubCommandData();
configureguilddata.setName("guild");
configureguilddata.setDescription("adjust guild configs");
configureguilddata.setPermissions([PermissionFlagsBits.Administrator]);
configureguilddata.setPermissionsReadable("Administrator");
configureguilddata.setWhitelist(["440163494529073152"]);
configureguilddata.setCanRunFromBot(true);

const configureguild = new SubCommand(
    configureguilddata,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set("_SUBCOMMAND", message.content.split(" ")[1].trim());
        return args;
    },
    async function execute(message, args, fromInteraction) {
        const modal = new ModalBuilder();
        modal.setTitle("Guild Configuration");
        modal.setCustomId("guildconfig");
        const gconfig = guildConfigs.getGuildConfig(message.guild.id);
        if (!gconfig) {
            action.reply(message, "failed to get guild config");
            return;
        }
        for (const key in gconfig) {
            if (!(key === "functions")) {
                const value = gconfig[key];
                const actionRow = new ActionRowBuilder();
                const textInput = new TextInputBuilder()
                    .setPlaceholder(value)
                    .setTitle(key);
                actionRow.addComponents(textInput);
                modal.addActionRow(actionRow);
            } else {
                for (const funcKey in value) {
                    const funcValue = value[funcKey];
                    const funcActionRow = new ActionRowBuilder();
                    const funcTextInput = new TextInputBuilder()
                        .setPlaceholder(funcValue)
                        .setTitle(funcKey);
                    funcActionRow.addComponents(funcTextInput);
                    modal.addActionRow(funcActionRow);
                }
            }
        }
        const buttonActionRow = new ActionRowBuilder();
        const openButton = new ButtonBuilder()
            .setCustomId("open")
            .setLabel("Open Configuration Menu")
            .setStyle(ButtonStyle.Success);
        buttonActionRow.addComponents(saveButton);
        action.reply(message, {
            content:
                "discord doesn't currently support showing modals on messages, so please just click this button",
            components: [buttonActionRow],
        });

        async function onCollect(interaction) {
            if (interaction instanceof ButtonInteraction)
                await interaction.deferUpdate();
            else await action.reply(interaction, "modaled!");
            await interaction.showModal(modal);
            await interaction.awaitModalResponse().then(interaction => {
                action.reply(interaction, "writing configs..");
                const responses = interaction.getResponses();
                for (const response of responses) {
                    if (response.getCustomId() === "guildconfig") {
                        const guildConfig = guildConfigs.getGuildConfig(
                            message.guild.id
                        );
                        const responses = response.getResponses();
                        for (const response of responses) {
                            guildConfig[response.getTitle()] = response.getValue();
                        }
                        guildConfigs.setGuildConfig(message.guild.id, guildConfig);
                    }
                }
            });
        }

        if (fromInteraction) {
            onCollect(fromInteraction);
            return;
        }

        const filter = (interaction) =>
            interaction.customId === "open" &&
            interaction.user.id === message.author.id;
        const collector = message.createMessageComponentCollector({
            filter,
            time: 60_000,
        });

        collector.on("collect", onCollect);

        collector.on("end", () => {
            message.edit({
                content:
                    "to avoid memory leaks, this collector has been stopped. run the command again to get the button back.",
                components: [],
            }); // Remove the button if no one clicked it
        });
    }
);

const data = new CommandData();
data.setName("configure");
data.setDescription("configure a certain aspect of the bot");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["config"]);
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("subcommand to run")
        .setRequired(true)
        .addChoices({ name: "guild", value: "guild" })
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "ARGUMENT",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (!args.get("_SUBCOMMAND")) {
            action.reply(message, "provide a subcommand to run you baffoon!");
            return;
        }
        action.reply(
            message,
            `unknown editable-configuration: \`${args.get("_SUBCOMMAND")}\``
        );
    },
    [configureguild]
);

export default command;
