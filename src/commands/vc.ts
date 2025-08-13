import { ChannelType, Collection, GuildMember, Message, StageChannel, VoiceBasedChannel, VoiceChannel } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import * as voice from "../lib/classes/voice";
import { CommandAccessTemplates, getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, SubcommandDeploymentApproach, CommandOptionType, InvokerType } from "../lib/classes/command_enums";
import { textToAttachment } from "../lib/attachment_manager";
import { inspect } from "util";
import { re } from "mathjs";


const leave = new Command(
    {
        name: 'leave',
        description: 'leave a voice channel',
        long_description: 'make the bot leave the current voice channel',
        tags: [CommandTag.Voice],
        example_usage: "p/vc leave",
        root_aliases: ["leavevc", "lvc", "fuckoff"],
        allow_external_guild: false,
        requiredPermissions: ["Connect", "Speak"],
    },
    async function getArguments () {
        return undefined;
    },
    async function execute ({ invoker, guild_config }) {
        if (!invoker.guild) {
            action.reply(invoker, {
                content: "this command can't be used outside of a guild",
                ephemeral: guild_config.other.use_ephemeral_replies
            });
            return new CommandResponse({
                error: true,
                message: "this command can't be used outside of a guild"
            })
        }
        const voiceManager = voice.getVoiceManager(invoker.guild);
        if (voiceManager) {
            if (!voice.checkMemberPermissionsForVoiceChannel(invoker.member as GuildMember, voiceManager.channel as VoiceChannel | StageChannel)) {
                action.reply(invoker, {
                    content: "you don't have permission to make me leave the voice channel",
                    ephemeral: guild_config.other.use_ephemeral_replies
                })
                return new CommandResponse({
                    error: true,
                    message: "you don't have permission to make me leave the voice channel",
                });
            }
            const previousChannel = voiceManager.channel
            const managerResponse = voiceManager.disconnect();

            if (!managerResponse.success) {
                action.reply(invoker, {
                    content: managerResponse.message,
                    ephemeral: guild_config.other.use_ephemeral_replies
                })
            }
            action.reply(invoker, {
                content: "left voice channel <#" + previousChannel?.id + ">",
                ephemeral: guild_config.other.use_ephemeral_replies
            })
        } else {
            action.reply(invoker, {
                content: "im not in a voice channel",
                ephemeral: guild_config.other.use_ephemeral_replies
            })
            return new CommandResponse({
                error: true,
                message: "im not in a voice channel",
            });
        }
        return new CommandResponse({});
    }
);

const debug = new Command(
    {
        name: 'debug',
        description: 'returns a bunch of debug data about the voice manager',
        long_description: 'returns a bunch of debug data about the voice manager',
        tags: [CommandTag.Debug, CommandTag.WhitelistOnly],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.dev_only,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/vc debug",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, args, guild_config }) {
        let text = ``
        voice.VoiceManagers.forEach((manager) => {
            text += `-----${manager.guild.name} (${manager.guild.id})-----\n`
            text += `state: ${manager.state}\n`
            text += `connected: ${manager.connected}\n`
            text += `channel: ${manager.channel?.name} (${manager.channel?.id})\n`
            text += "\n"
        })
        action.reply(invoker, {
            content: `voice manager debug data:`,
            files: [textToAttachment(text, `debug.txt`)]
        })
    }
);

const join = new Command(
    {
        name: 'join',
        description: 'join a voice channel',
        long_description: 'make the bot join a specific voice channel',
        tags: [CommandTag.Voice],
        example_usage: "p/vc join general",
        allow_external_guild: false,
        root_aliases: ["joinvc", "jvc"],
        options: [
            new CommandOption({
                name: 'channel',
                description: 'the channel to join',
                long_description: 'the channel to join. this tries many backups: the channel name, the channel id, the channel being mentioned, the channel you\'re currently connected to, the channel inputted from slash commands, in that order.',
                type: CommandOptionType.Channel,
                required: false,
            })
        ],
        requiredPermissions: ["Connect", "Speak"],
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["channel"]),
    async function execute({ invoker, args, guild_config }) {
        if (!invoker.guild) {
            action.reply(invoker, {
                content: "this command can't be used outside of a guild",
                ephemeral: guild_config.other.use_ephemeral_replies
            });
            return new CommandResponse({
                error: true,
                message: "this command can't be used outside of a guild"
            })
        }
        const inputChannel = args.channel as string | VoiceBasedChannel | undefined
        let channel: VoiceBasedChannel | undefined;
        if (!inputChannel && (!(invoker.member instanceof GuildMember) && (invoker.member as unknown as GuildMember).voice.channel)) {
            action.reply(invoker, {
                content: `missing input channel`,
                ephemeral: guild_config.other.use_ephemeral_replies
            });
            return new CommandResponse({
                error: true,
                message: `missing input channel`
            })
        }
        if (typeof inputChannel == "string" && inputChannel.length > 0) { // for string inputs
            channel = invoker.guild.channels.cache.find((channel) => // search by channel name
                    ((channel.type === ChannelType.GuildVoice) || (channel.type === ChannelType.GuildStageVoice)) &&
                    (channel.name.toLowerCase().startsWith(inputChannel.toLowerCase()))
                ) as VoiceBasedChannel | undefined
            if (!channel) {
                channel = invoker.guild.channels.cache.find((channel) => // search by channel id
                    ((channel.type === ChannelType.GuildVoice) || (channel.type === ChannelType.GuildStageVoice)) &&
                    (channel.id == inputChannel)
                ) as VoiceBasedChannel | undefined
            }
        }
        if (inputChannel instanceof StageChannel || inputChannel instanceof VoiceChannel) { // for slash command inputs
            channel = inputChannel
        }
        if (!channel && (invoker instanceof Message)) { // if the channel is mentioned in the message
            const mentionedChannel = invoker.mentions.channels.first();
            if (mentionedChannel && (mentionedChannel.type === ChannelType.GuildVoice || mentionedChannel?.type === ChannelType.GuildStageVoice)) {
                channel = mentionedChannel
            }
        }

        if (!channel) {
            if ((invoker.member instanceof GuildMember) && invoker.member.voice.channel) {
                channel = invoker.member.voice.channel
            }
        }

        if (!channel) {
            action.reply(invoker, {
                content: `unable to find voice channel: \`${inputChannel || "undefined"}\`; \nyou need to input either a channel name, a channel id, a channel mention, a channel via slash commands, or be connected to the channel you want to be joined.`,
                ephemeral: guild_config.other.use_ephemeral_replies
            })
            return new CommandResponse({
                error: true,
                message: `unable to find voice channel: \`${inputChannel || "undefined"}\`; \nyou need to input either a channel name, a channel id, a channel mention, a channel via slash commands, or be connected to the channel you want to be joined.`
            })
        }
        if (!voice.checkMemberPermissionsForVoiceChannel(invoker.member as GuildMember, channel as VoiceBasedChannel)) {
            action.reply(invoker, {
                content: "you don't have permission to make me join the voice channel",
                ephemeral: guild_config.other.use_ephemeral_replies
            })
            return new CommandResponse({
                error: true,
                message: "you don't have permission to make me join the voice channel",
            });
        }

        const manager = voice.getVoiceManager(invoker.guild)
        const managerResponse = manager.connect(channel)
        if (!managerResponse.success) {
            action.reply(invoker, {
                content: managerResponse.message,
                ephemeral: guild_config.other.use_ephemeral_replies
            });
            return new CommandResponse({
                error: true,
                message: managerResponse.message
            });
        }
        action.reply(invoker, {
            content: `joined voice channel <#${channel.id}>`
        })
    }
);

const command = new Command(
    {
        name: 'vc',
        description: 'join / leave a vc',
        long_description: 'make the bot join or leave a specific voice channel',
        tags: [CommandTag.Voice],
        example_usage: "p/vc join",
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [join, leave, debug],
        },
        aliases: ["voice"],
        allow_external_guild: false,
        options: [
            new CommandOption({
                name: 'channel',
                description: 'the channel to join',
                type: CommandOptionType.Channel,
                required: false,
            })
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, args, piped_data, will_be_piped, guild_config }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use ${guild_config.other.prefix}help vc for a list of subcommands`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            })
            return new CommandResponse({
                error: true,
                message: `invalid subcommand: ${args.subcommand}; use ${guild_config.other.prefix}help vc for a list of subcommands`,
            });
        }
        action.reply(invoker, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: guild_config.other.use_ephemeral_replies
        })
    }
);

export default command;