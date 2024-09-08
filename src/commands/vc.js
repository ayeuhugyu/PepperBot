import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";
import * as voice from "../lib/voice.js";

const config = globals.config;

const leavedata = new SubCommandData();
leavedata.setName("leave");
leavedata.setDescription("leaves a vc");
leavedata.setPermissions([]);
leavedata.setPermissionsReadable("");
leavedata.setWhitelist([]);
leavedata.setCanRunFromBot(true);
leavedata.setNormalAliases(["leavevc", "leave", "leavecall", "fuckoff", "goaway"]);
leavedata.setDisabledContexts(["dm"])
const leave = new SubCommand(
    leavedata,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        const connection = await voice.getVoiceConnection(message.guild.id);
        if (connection) {
            const channel = await message.guild.channels.fetch(connection.joinConfig.channelId)
            if (!voice.checkMemberPermissionsForVoiceChannel(message.member, channel)) {
                return action.reply(message, { content: "you can't join this channel, so i won't let you force me to leave.", ephemeral: gconfig.useEphemeralReplies})
            }
            voice.leaveVoiceChannel(connection).catch((e) => {
                log.error(e);
            });
            action.reply(message, {
                content: `left voice channel <#${connection.joinConfig.channelId}>`,
                ephemeral: gconfig.useEphemeralReplies,
            });
        } else {
            action.reply(message, {
                content: "im not connected to a voice channel here mf",
                ephemeral: gconfig.useEphemeralReplies,
            });
        }
    }
);

const joindata = new SubCommandData();
joindata.setName("join");
joindata.setDescription("join a voice channel");
joindata.setPermissions([]);
joindata.setPermissionsReadable("");
joindata.setWhitelist([]);
joindata.setCanRunFromBot(true);
joindata.setNormalAliases(["joinvc", "join", "joincall", "call"]);
joindata.setDisabledContexts(["dm"])
joindata.addChannelOption((option) =>
    option
        .setName("channel")
        .setDescription("channel to join")
        .setRequired(false)
);
const join = new SubCommand(
    joindata,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        let args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        if (message.mentions.channels.first()) {
            args.set("channel", message.mentions.channels.first());
        } else {
            if (
                message.guild.channels.cache.get(message.content.slice(prefix.length + commandLength).trim())
            ) {
                args.set("channel", await message.guild.channels.fetch(message.content.slice(prefix.length + commandLength).trim()));
            } else {
                const channel = message.guild.channels.cache.find((channel) => channel.name.toLowerCase().startsWith(message.content.slice(prefix.length + commandLength).trim().toLowerCase()));
                if (channel) {
                    args.set("channel", channel);
                }
            }
        }
        if (
            !args.get("channel")
        ) {
            args.set("channel", message.member.voice.channel);
        }
        let requestedchannel = args.get("channel");
        if (args.get("channel")) {
            requestedchannel = args.get("channel").name;
        } else {
            requestedchannel = message.mentions.channels.first() || message.content.slice(prefix.length + commandLength) || "undefined";
        }
        args.set("requestedchannel", requestedchannel);
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (!args.get("channel")) {
            action.reply(message, { content: `channel \`${args.get("requestedchannel")}\` does not exist`, ephemeral: gconfig.useEphemeralReplies });
            return;
        }
        if (args.get("channel").type != 2 &&args.get("channel").type != 13) {
            action.reply(message, { content: `channel type \`${args.get("channel").type}\` of \`${args.get("requestedchannel")}\` is not a voice channel`, ephemeral: gconfig.useEphemeralReplies })
            return;
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
            if (!voice.checkMemberPermissionsForVoiceChannel(message.member, args.get("channel"))) {
                action.reply(message, {
                    content: "i won't join that voice channel because you don't have permissions to join it",
                    ephemeral: gconfig.useEphemeralReplies
                })
                return;
            }
            voice.joinVoiceChannel(args.get("channel"));
            action.reply(message, {
                content: `joined <#${args.get("channel").id}>`,
                ephemeral: gconfig.useEphemeralReplies,
            });
        } else {
            action.reply(message, {
                content: "specify or join a channel, you baffoon!",
                ephemeral: gconfig.useEphemeralReplies,
            });
        }
    }
);

const data = new CommandData();
data.setName("vc");
data.setDescription("leave / join a vc");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases();
data.setPrimarySubcommand(join)
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("subcommand to run")
        .setRequired(true)
        .addChoices(
            { name: "join", value: "join" },
            { name: "leave", value: "leave" },
        )
);
data.addChannelOption((option) =>
    option
        .setName("channel")
        .setDescription("channel to join")
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const args = new Collection();
        args.set("_SUBCOMMAND", message.content.split(" ")[1]);
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (args.get("_SUBCOMMAND")) {
            action.reply(message, {
                content: "invalid subcommand: " + args.get("_SUBCOMMAND"),
                ephemeral: gconfig.useEphemeralReplies
            })
            return;
        }
        action.reply(message, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: gconfig.useEphemeralReplies
        })
    },
    [join, leave] // subcommands
);

export default command;
