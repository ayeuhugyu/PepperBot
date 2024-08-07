import * as voice from "../lib/voice.js";
import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";
import * as globals from "../lib/globals.js";

const config = globals.config;

const data = new CommandData();
data.setName("joinvc");
data.setDescription("join a voice channel");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["join", "joincall", "call", "vc"]);
data.addChannelOption((option) =>
    option
        .setName("channel")
        .setDescription("channel to join")
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        let args = new Collection();
        if (message.mentions.channels.first()) {
            args.set("channel", message.mentions.channels.first());
        } else {
            if (
                message.guild.channels.cache.get(
                    message.content
                        .slice(config.generic.prefix.length + commandLength)
                        .trim()
                )
            ) {
                args.set(
                    "channel",
                    await message.guild.channels.fetch(
                        message.content
                            .slice(config.generic.prefix.length + commandLength)
                            .trim()
                    )
                );
            } else {
                const channel = message.guild.channels.cache.find((channel) =>
                    channel.name.toLowerCase().startsWith(
                        message.content
                            .slice(config.generic.prefix.length + commandLength)
                            .trim()
                            .toLowerCase()
                    )
                );
                if (channel) {
                    args.set("channel", channel);
                }
            }
        }
        if (
            !args.get("channel") ||
            !args.get("channel").type ||
            (args.get("channel").type &&
                args.get("channel").type != 2 &&
                args.get("channel").type != 13)
        ) {
            args.set("channel", message.member.voice.channel);
        }
        if (!args.get("channel")) {
            args = false;
        }
        return args;
    },
    async function execute(message, args) {
        if (typeof args == "boolean" || !args) {
            action.reply(message, {
                content: "channel does not exist, or is not a voice channel",
                ephemeral: true,
            });
            return;
        }
        if (args.get("channel")) {
            if (
                args.get("channel").type != 2 &&
                args.get("channel").type != 13
            ) {
                args = false;
            }
        }
        if (!args.get("channel")) {
            args._hoistedOptions.push({
                name: "channel",
                type: 7,
                value: message.member.voice.channel,
                channel: message.member.voice.channel,
            });
        }
        if (args.get("channel")) {
            voice.joinVoiceChannel(args.get("channel"));
            action.reply(message, {
                content: `joined <#${args.get("channel").id}>`,
                ephemeral: true,
            });
        } else {
            action.reply(message, {
                content: "specify or join a channel, you baffoon!",
                ephemeral: true,
            });
        }
    }
);

export default command;
