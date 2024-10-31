import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import {
    Collection,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} from "discord.js";
import * as theme from "../lib/theme.js";
import fs from "fs";
import { client } from "../bot.js";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";
import guildConfigs from "../lib/guildConfigs.js";

const config = globals.config;

const data = new CommandData();
data.setName("explore");
data.setDescription(
    "view servers pepperbot is in, or join a server if you want to"
);
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
;
data.setAliases(["servers"]);
data.addStringOption((option) =>
    option
        .setName("server")
        .setDescription(
            "server to list (id, listed next to server in the list)"
        )
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix0
        args.set(
            "server",
            message.content
                .slice(prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        const embed = await theme.createThemeEmbed(theme.themes[gconfig.theme] || theme.themes.CURRENT);
        let guilds = await client.shard.fetchClientValues("guilds.cache");
        let hiddenGuilds = Object.entries(guildConfigs.guildConfigs)
            .filter(
                ([guildId, guildConfig]) => guildConfig.exploreVisible === false
            )
            .map(([guildId, guildConfig]) => guildId);

        if (!args.get("server")) {
            // display servers list
            let guildList = "";
            let guildSize = 0;
            guilds.forEach((guildsCache) => {
                guildSize += guildsCache.length;
                guildsCache.forEach((guild) => {
                    if (!hiddenGuilds.includes(guild.id)) {
                        guildList += `${guild.name} - ${guild.id}\n`;
                    }
                });
            });
            embed.setTitle(
                `${guildSize} servers ${
                    hiddenGuilds.length > 0
                        ? `(${hiddenGuilds.length} hidden)`
                        : ""
                }`
            );
            embed.setDescription(guildList);
            action.reply(message, { embeds: [embed], ephemeral: gconfig.useEphemeralReplies });
            return;
        }
        if (args.get("server")) {
            // display server info
            if (hiddenGuilds.includes(args.get("server"))) {
                action.reply(message, {
                    content:
                        "this server is hidden, so i can't display info for it",
                    ephemeral: gconfig.useEphemeralReplies,
                });
                return;
            }
            let guild = message.client.guilds.cache.get(args.get("server"));
            if (!guild) {
                guilds.forEach((guildsCache) => {
                    if (guildsCache.find((g) => g.id == args.get("server"))) {
                        guild = guildsCache.get(args.get("server"));
                    }
                });
                if (!guild) {
                    action.reply(message, {
                        content: "server not found",
                        ephemeral: gconfig.useEphemeralReplies,
                    });
                    return;
                }
            }

            const inviteButton = new ButtonBuilder();
            inviteButton.setLabel("Create Invite");
            inviteButton.setStyle(ButtonStyle.Primary);
            inviteButton.setCustomId(`invite`);
            const actionRow = new ActionRowBuilder();
            actionRow.addComponents(inviteButton);

            embed.setTitle(`${guild.name} - ${guild.id}`);
            let text = "";
            text += `owned by: <@${guild.ownerId}>`;
            text += `\ncreated at: <t:${parseInt(
                guild.createdTimestamp / 1000,
                10
            )}>`;
            text += `\nmember count: ${guild.memberCount}`;
            text += `\nregion: ${guild.region ?? "Not specified"}`;
            text += `\nchannels: ${guild.channels.cache.size}`;

            embed.setDescription(text);
            embed.setImage(guild.iconURL({ dynamic: true }));
            const response = await action.reply(message, {
                embeds: [embed],
                components: [actionRow],
                ephemeral: gconfig.useEphemeralReplies,
            });
            try {
                const confirmation = await response.awaitMessageComponent({
                    time: 120_000,
                });
                if (confirmation.customId === "invite") {
                    confirmation.reply({
                        content: "creating invite... please wait...",
                        ephemeral: gconfig.useEphemeralReplies,
                    });
                    const channel = guild.channels.cache.find(
                        (channel) => channel.type == 0
                    );
                    const invite = await guild.invites.create(channel, {
                        maxAge: 240,
                        maxUses: 10,
                        reason: "PepperBot Explore Command; Invite will disable after 10 uses or in 4 minutes.",
                        unique: false,
                    });
                    confirmation.editReply({
                        content: invite.url,
                        ephemeral: gconfig.useEphemeralReplies,
                    });
                }
            } catch (e) {
                return;
            }
        }
    }
);

export default command;
