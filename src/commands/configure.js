import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits, ModalBuilder, TextInputBuilder, ActionRowBuilder } from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";
import guildConfigs from "../lib/guildConfigs.js";

// command incomplete, do not remove whitelist yet

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

const configureguilddata = new CommandData();
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
        args.set(
            "_SUBCOMMAND",
            message.content.split(" ")[1].trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {
        const modal = new ModalBuilder()
        modal.setTitle("Guild Configuration")
        modal.setCustomId("guildconfig")
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
        .addChoices(
            { name: "guild", value: "guild" },
        )
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
        action.reply(message, `unknown editable-configuration: \`${args.get("_SUBCOMMAND")}\``)
    },
    [configureguild]
);

export default command;