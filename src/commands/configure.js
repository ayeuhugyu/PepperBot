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
    TextInputStyle,
    embedLength,
    messageLink,
} from "discord.js";
import fs from "fs";
import chalk from "chalk";
import * as log from "../lib/log.js";
import guildConfigs from "../lib/guildConfigs.js";
import * as globals from "../lib/globals.js";
import * as theme from "../lib/theme.js";
import { androidpublisher } from "googleapis/build/src/apis/androidpublisher/index.js";
import { datastream } from "googleapis/build/src/apis/datastream/index.js";

const config = globals.config;

const buttons = {
    changeGuildConfig: new ButtonBuilder()
        .setCustomId("changeGuildConfig")
        .setLabel("📝 Edit")
        .setStyle(ButtonStyle.Success),
    increaseDetailsIndex: new ButtonBuilder()
        .setCustomId("increaseDetailsIndex")
        .setLabel("🔼")
        .setStyle(ButtonStyle.Secondary),
    decreaseDetailsIndex: new ButtonBuilder()
        .setCustomId("decreaseDetailsIndex")
        .setLabel("🔽")
        .setStyle(ButtonStyle.Secondary),
    reset: new ButtonBuilder()
        .setCustomId("reset")
        .setLabel("🔄 Reset")
        .setStyle(ButtonStyle.Danger),
    formattingGuide: new ButtonBuilder()
        .setCustomId("formattingGuide")
        .setLabel("📜 Formatting")
        .setStyle(ButtonStyle.Primary),
};
const guildConfiguratorActionRow = new ActionRowBuilder();
guildConfiguratorActionRow.addComponents(buttons.changeGuildConfig);
const detailsActionRow = new ActionRowBuilder();
detailsActionRow.addComponents(
    buttons.increaseDetailsIndex,
    buttons.decreaseDetailsIndex,
    buttons.changeGuildConfig,
    buttons.formattingGuide
);

const guildConfiguratorModal = new ModalBuilder()
    .setTitle("Guild Configuration")
    .setCustomId("guildConfiguratorModal");

const keyTextInput = new TextInputBuilder()
    .setPlaceholder("enter a valid key")
    .setLabel("key")
    .setStyle(TextInputStyle.Short)
    .setCustomId("key");
const valueTextInput = new TextInputBuilder()
    .setPlaceholder("enter a value to set the key to in JSON format")
    .setLabel("value")
    .setStyle(TextInputStyle.Short)
    .setCustomId("value");
const resetTextInput = new TextInputBuilder()
    .setPlaceholder("confirm or cancel")
    .setLabel("you sure?")
    .setStyle(TextInputStyle.Short)
    .setCustomId("resetTextInput");

const resetConfirmModal = new ModalBuilder()
    .setTitle("Confirmation")
    .setCustomId("resetConfirmModal");

const keyTextInputActionRow = new ActionRowBuilder();
keyTextInputActionRow.addComponents(keyTextInput);
const valueTextInputActionRow = new ActionRowBuilder();
valueTextInputActionRow.addComponents(valueTextInput);
const resetTextInputActionRow = new ActionRowBuilder();
resetTextInputActionRow.addComponents(resetTextInput);

guildConfiguratorModal.addComponents(
    keyTextInputActionRow,
    valueTextInputActionRow
);
resetConfirmModal.addComponents(resetTextInputActionRow);

let activeConfigurators = {};

function refresh(sent, detailsEmbed, gconfig, gid) {
    const translatedGuildConfig = translateGuildConfigToString(gconfig);
    if (!sent) {
        if (activeConfigurators[gid]) {
            action.editMessage(activeConfigurators[gid].message, {
                content: `this is your current guild config. use the buttons in the details embed or the command to change it.\n${translatedGuildConfig}`,
                embeds: [detailsEmbed || activeConfigurators[gid].detailsEmbed],
                components: [detailsActionRow],
                ephemeral: gconfig.useEphemeralReplies,
            });
        } else {
            log.warn("attempt to refresh gconfig message that doesn't exist");
            return;
        }
    }
    action.editMessage(sent, {
        content: `this is your current guild config. use the buttons in the details embed or the command to change it.\nyou can use \`${
            gconfig.prefix || config.generic.prefix
        }configure indexNumber value\` to change it, or the internal name (listed in italics in the details embed below) instead of index number. the index number is the number in grey appearing next to the part of the guild config.\n${translatedGuildConfig}`,
        embeds: [detailsEmbed || activeConfigurators[gid].detailsEmbed],
        components: [detailsActionRow],
        ephemeral: gconfig.useEphemeralReplies,
    });
}

function parseUserInputValue(value, type, arraytype) {
    switch (type) {
        case "boolean":
            return (
                value.toLowerCase() === "yes" ||
                value.toLowerCase() === "true" ||
                value.toLowerCase() === "on"
            );
        case "array":
            if (arraytype === "string") {
                return JSON.parse(
                    `[${value.split(",").map((item) => `"${item.trim()}"`)}]`
                );
            }
            return JSON.parse(`[${value}]`);
        case "string":
            return value;
        case "number":
            return parseInt(value);
        case "object":
            return JSON.parse(`{${value}}`);
        default:
            return JSON.parse(value);
    }
}

function changeGuildConfig(
    interaction,
    key,
    value,
    sent,
    guildConfig,
    guildConfigItemsIndexes,
    detailsEmbed,
    gid
) {
    const parsedNumericKey = parseInt(key);
    const JSONObjectIndexKey = key;
    let guildConfigItemKey = undefined;
    let valueHasBeenChanged = false;
    if (
        !valueHasBeenChanged &&
        parsedNumericKey &&
        guildConfigItemsIndexes[parsedNumericKey - 1]
    ) {
        const item = guildConfigItemsIndexes[parsedNumericKey - 1];
        if (!item) {
            action.reply(interaction, {
                content: `invalid numeric index: ${parsedNumericKey}`,
                ephemeral: guildConfig.useEphemeralReplies,
            });
            return;
        }
        if (typeof guildConfig[item.key] === "undefined") {
            action.reply(interaction, {
                content: `how did you even do that. somehow, you found a value inside of the item indexes that isn't a value inside of the guild config despite it being generated from it??? idfk how you even did that man wtf. ig if you wanna try to debug it, the item, guildConfig, and guildConfigItemsIndexes have been logged under the debug level, good fucking luck man.`,
                ephemeral: guildConfig.useEphemeralReplies,
            });
            log.debug(item, guildConfig, guildConfigItemsIndexes);
            return;
        }
        guildConfigItemKey = item.key;
        valueHasBeenChanged = true;
    }
    if (
        !valueHasBeenChanged &&
        JSONObjectIndexKey &&
        typeof guildConfig[JSONObjectIndexKey] !== "undefined"
    ) {
        guildConfigItemKey = JSONObjectIndexKey;
        valueHasBeenChanged = true;
    }
    if (guildConfigItemKey && guildConfig[guildConfigItemKey] !== undefined) {
        let parsedValue;
        try {
            parsedValue = parseUserInputValue(
                value,
                gconfigInfo[guildConfigItemKey].type,
                gconfigInfo[guildConfigItemKey].arraytype
            );
        } catch (e) {
            log.error(e);
            action.reply(interaction, {
                content: "your value appears to be formatted incorrectly.",
                ephemeral: guildConfig.useEphemeralReplies,
            });
            return;
        }
        if (typeof parsedValue == "undefined") {
            action.reply(interaction, {
                content: "your value appears to be formatted incorrectly.",
                ephemeral: guildConfig.useEphemeralReplies,
            });
            return;
        }
        // exceptions
        if (guildConfigItemKey == "disabledCommands") {
            if (parsedValue.includes("configure")) {
                action.reply(interaction, {
                    content:
                        "you can't disable the configure command as that would prevent you from changing it back",
                    ephemeral: guildConfig.useEphemeralReplies,
                });
                return;
            }
        }
        if (guildConfigItemKey === "configLockedToServerOwner") {
            if (interaction.author.id !== interaction.guild.ownerId) {
                action.reply(interaction, {
                    content: "you must be the server owner to change this key",
                    ephemeral: guildConfig.useEphemeralReplies,
                });
                return;
            }
        }
        if (guildConfigItemKey === "blacklistedCommandChannelIds") {
            if (parsedValue.includes(interaction.channel.id)) {
                action.reply(interaction, {
                    content:
                        "you can't blacklist the channel you're configuring in from having commands used in it.",
                    ephemeral: guildConfig.useEphemeralReplies,
                });
                return;
            }
        }
        if (guildConfigItemKey === "autoCrosspostChannels") {
            let shouldreturn = false;
            parsedValue.forEach((channelId) => {
                try {
                    interaction.guild.channels.fetch(channelId).then((channel) => {
                        if (!channel.type == 5) {
                            action.reply(interaction, {
                                content: `the channel with the ID ${channelId} is not an announcement channel`,
                                ephemeral: guildConfig.useEphemeralReplies,
                            });
                            shouldreturn = true;
                        }
                    })
                } catch (e) {
                    action.reply(interaction, {
                        content: `the channel with the ID ${channelId} doesn't exist or I can't see it`,
                        ephemeral: guildConfig.useEphemeralReplies,
                    });
                    shouldreturn = true;
                }
                if (shouldreturn) {
                    return;
                }
            });
            if (shouldreturn) {
                return;
            }
        }
        if (guildConfigItemKey === "theme") {
            if (!theme.themes[parsedValue.toUpperCase().replaceAll(" ", "_")]) {
                action.reply(interaction, {
                    content: `the theme ${parsedValue.toUpperCase} doesn't exist`,
                    ephemeral: guildConfig.useEphemeralReplies,
                });
                return;
            } else {
                parsedValue = theme.themes[parsedValue.toUpperCase().replaceAll(" ", "_")];
            }
        }
        if (interaction.deferUpdate) {
            interaction.deferUpdate();
        } else if (interaction.react) {
            interaction.react("✅");
        } else {
            action.reply(interaction, {
                content: "✅",
                ephemeral: guildConfig.useEphemeralReplies,
            });
        }
        guildConfig[guildConfigItemKey] = parsedValue;
        guildConfigs.write(interaction.guild.id, guildConfig);
    } else {
        action.reply(interaction, {
            content: "that key doesn't exist in the guild config",
            ephemeral: guildConfig.useEphemeralReplies,
        });
        return;
    }
    refresh(sent, detailsEmbed, guildConfig, gid);
}
function translateValue(value, nocolor) {
    let objectAcc = "\n"; // for some reason you can't define these in case blocks
    let objectLength = 0;
    let objectIteration = 0;
    let isLastIteration = false;
    switch (typeof value) {
        case "boolean":
            if (value) {
                return nocolor ? "TRUE" : chalk.green("TRUE");
            } else {
                return nocolor ? "FALSE" : chalk.red("FALSE");
            }
        case "number":
            return nocolor ? value.toString() : chalk.yellow(value.toString());
        case "string":
            return nocolor ? value : chalk.blue(value);
        case "object":
            objectLength = Object.entries(value).length;
            for (const [key, vl] of Object.entries(value)) {
                objectIteration++;
                isLastIteration = objectIteration == objectLength;
                objectAcc += nocolor
                    ? `      ${key}: ${vl}${isLastIteration ? "" : "\n"}`
                    : `      ${chalk.yellow(key)}: ${chalk.blue(vl)}${
                          isLastIteration ? "" : chalk.reset("\n")
                      }`;
            }
            if (Array.isArray(value)) {
                if (value.length == 0) {
                    return nocolor ? "[]" : "[2;30m[0m[2;30m[][0m";
                }
            }
            return objectAcc;
        default:
            return value;
    }
}
const gconfigInfo = guildConfigs.info;
function translateGuildConfigToString(gconfig) {
    let acc = "```ansi\n";
    let indexNumber = 0;
    for (const [key, value] of Object.entries(gconfig)) {
        const cleanname = gconfigInfo[key].cleanname || key;
        const cleanvalue = translateValue(value);
        acc += `[2;30m[0m[2;30m[${indexNumber + 1}][0m ${cleanname}: ${cleanvalue}\n`;
        indexNumber++;
    }
    acc += "```";
    return acc;
}

const data = new CommandData();
data.setName("configure");
data.setDescription("allows you to change a guild's configuration");
data.setPermissions([PermissionFlagsBits.Administrator]);
data.setPermissionsReadable("Administrator");
data.setCanRunFromBot(true);
;
data.setAliases(["config", "cfg", "gconfig", "guildconfig", "serverconfig"]);
data.setDisabledContexts(["dm"]);
data.addStringOption((option) =>
    option.setName("key").setDescription("the key to change").setRequired(false)
);
data.addStringOption((option) =>
    option
        .setName("value")
        .setDescription(
            "a JSON formatted string to set the key to; must be valid JSON and match the key's type"
        )
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const args = new Collection();
        args.set("key", message.content.split(" ")[1]);
        if (args.get("key")) {
            args.set(
                "value",
                message.content.slice(
                    message.content.indexOf(args.get("key")) +
                        args.get("key").length +
                        1
                )
            );
        }
        return args;
    },
    async function execute(message, args, fromInteraction, messageGuildConfig) {
        if (!message.guild) {
            action.reply(message, {
                content: "this command can only be run in a guild",
                ephemeral: messageGuildConfig.useEphemeralReplies,
            });
            return;
        }
        const translatedGuildConfig =
            translateGuildConfigToString(messageGuildConfig);
        let detailsIndex = 0;
        let guildConfigItemsIndexes = [];
        for (const [key, value] of Object.entries(messageGuildConfig)) {
            guildConfigItemsIndexes.push({ key: key, value: value });
        }
        if (args.get("key")) {
            changeGuildConfig(
                message,
                args.get("key"),
                args.get("value"),
                undefined,
                messageGuildConfig,
                guildConfigItemsIndexes,
                undefined,
                message.guild.id
            );
            return;
        }
        const translatedGuildConfigMessage = await action.reply(message, {
            content: `loading...`,
            ephemeral: messageGuildConfig.useEphemeralReplies,
        });

        const detailsEmbed = theme.createThemeEmbed(messageGuildConfig.theme || theme.themes.CURRENT);
        detailsEmbed.setTitle("loading...");
        const collectorID = message.guild.id;
        function refreshDetails() {
            guildConfigItemsIndexes = [];
            for (const [key, value] of Object.entries(messageGuildConfig)) {
                guildConfigItemsIndexes.push({ key: key, value: value });
            }
            const item = guildConfigItemsIndexes[detailsIndex];
            if (!item) {
                return;
            }
            const key = item.key;
            const value = item.value;
            const itemInfo = gconfigInfo[key];
            const cleankey = itemInfo.cleanname || key;
            detailsEmbed.setTitle(`${cleankey} *(${key})*`);
            detailsEmbed.setDescription(
                `current value: ${translateValue(
                    value,
                    true
                )}\ndefault value: ${translateValue(
                    itemInfo.default,
                    true
                )}\ntype: ${itemInfo.type}\ndescription: ${
                    itemInfo.description
                }`
            );
            action.editMessage(translatedGuildConfigMessage, {
                content: translatedGuildConfigMessage.content,
                embeds: [detailsEmbed],
                components: [detailsActionRow],
                ephemeral: messageGuildConfig.useEphemeralReplies,
            });
            activeConfigurators[collectorID] = {
                message: translatedGuildConfigMessage,
                detailsEmbed: detailsEmbed,
            };
        }
        await refreshDetails();
        activeConfigurators[collectorID] = {
            message: translatedGuildConfigMessage,
            detailsEmbed: detailsEmbed,
        };
        refresh(
            translatedGuildConfigMessage,
            detailsEmbed,
            messageGuildConfig,
            message.guild.id
        );
        const collector =
            await translatedGuildConfigMessage.createMessageComponentCollector({
                time: 240_000,
            });
        collector.on("collect", (interaction) => {
            if (interaction.user.id !== message.author.id) {
                action.reply(message, {
                    content: "you aint the right person",
                    ephemeral: messageGuildConfig.useEphemeralReplies,
                });
                return;
            }
            if (interaction.customId === "increaseDetailsIndex") {
                detailsIndex--; // not sure why these are reversed but they are
                if (detailsIndex < 0) {
                    detailsIndex = guildConfigItemsIndexes.length - 1;
                }
                refreshDetails();
                interaction.deferUpdate();
                return;
            }
            if (interaction.customId === "decreaseDetailsIndex") {
                detailsIndex++;

                if (detailsIndex >= guildConfigItemsIndexes.length) {
                    detailsIndex = 0;
                }
                refreshDetails();
                interaction.deferUpdate();
                return;
            }
            if (interaction.customId === "changeGuildConfig") {
                if (
                    messageGuildConfig.configLockedToServerOwner &&
                    message.author.id !== message.guild.ownerId
                ) {
                    action.reply(interaction, {
                        content:
                            "this guild's configuration is locked to the server owner",
                        ephemeral: messageGuildConfig.useEphemeralReplies,
                    });
                    return;
                }
                interaction.showModal(guildConfiguratorModal);
                const filter = (interaction) =>
                    interaction.customId === "guildConfiguratorModal";
                interaction
                    .awaitModalSubmit({ filter, time: 120_000 })
                    .then((interaction) => {
                        const key = interaction.fields.getTextInputValue("key");
                        const value =
                            interaction.fields.getTextInputValue("value");
                        changeGuildConfig(
                            interaction,
                            key,
                            value,
                            translatedGuildConfigMessage,
                            messageGuildConfig,
                            guildConfigItemsIndexes,
                            detailsEmbed
                        );
                    });
            }
            if (interaction.customId === "formattingGuide") {
                action.reply(interaction, {
                    content: `here's a formatting guide for all of the guild config types:
\`\`\`ansi
bools (boolean) are either ${chalk.green("TRUE")} or ${chalk.red(
                        "FALSE"
                    )}. it is ${chalk.green(
                        "TRUE"
                    )} if you input "${chalk.green("yes")}", "${chalk.green(
                        "true"
                    )}", or "${chalk.green(
                        "on"
                    )}", and if you input anything else it is ${chalk.red(
                        "FALSE"
                    )}.

for ${chalk.yellow("numbers")} you literally just input the number

for ${chalk.blue(
                        "strings"
                    )} you literally just input the string, keep in mind channel IDs are handled as strings but are really just a number

for arrays each ${chalk.blue(
                        "value"
                    )} is seperated by a comma. a list containing "${chalk.blue(
                        "test"
                    )}", "${chalk.blue("west")}", and "${chalk.blue(
                        "zest"
                    )}" would be formatted like this: \n${chalk.blue(
                        "test"
                    )}, ${chalk.blue("west")}, ${chalk.blue("zest")}
\`\`\`
                    `,
                    ephemeral: messageGuildConfig.useEphemeralReplies,
                });
            }
        });
        
        collector.on("end", () => {
            delete activeConfigurators[collectorID];
            action.editMessage(translatedGuildConfigMessage, {
                content: translatedGuildConfigMessage.content,
                embeds: [detailsEmbed],
                components: [],
            });
        });
    },
    []
);

export default command;