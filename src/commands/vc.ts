import { ChannelType, Collection, GuildMember, Message, StageChannel, VoiceChannel } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import * as voice from "../lib/voice";
import { Channel } from "diagnostics_channel";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandCategory, SubcommandDeploymentApproach, CommandOptionType } from "../lib/classes/command_enums";


const leave = new Command(
    {
        name: 'leave',
        description: 'leave a voice channel',
        long_description: 'make the bot leave the current voice channel',
        category: CommandCategory.Voice,
        example_usage: "p/vc leave",
        allow_external_guild: false,
    },
    async function getArguments () {
        return undefined;
    },
    async function execute ({ invoker, guild_config }) {
        const voiceManager = voice.getVoiceManager(invoker.guild?.id || "");
        if (voiceManager) {
            if (!voice.checkMemberPermissionsForVoiceChannel(invoker.member as GuildMember, voiceManager.channel as VoiceChannel | StageChannel)) {
                action.reply(invoker, {
                    content: "you don't have permission to make me leave the voice channel",
                    ephemeral: guild_config.other.use_ephemeral_replies
                })
                return new CommandResponse({});
            }
            action.reply(invoker, {
                content: "left voice channel <#" + voiceManager.channel?.id + ">",
                ephemeral: guild_config.other.use_ephemeral_replies
            })
            voice.leaveVoiceChannel(invoker.guild?.id || "");
        } else {
            action.reply(invoker, {
                content: "im not in a voice channel",
                ephemeral: guild_config.other.use_ephemeral_replies
            })
        }
        return new CommandResponse({});
    }
);

const join = new Command(
    {
        name: 'join',
        description: 'join a voice channel',
        long_description: 'make the bot join a specific voice channel',
        category: CommandCategory.Voice,
        example_usage: "p/vc join general",
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
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["channel"]),
    async function execute({ invoker, args, guild_config }) {
        if ((args.channel instanceof VoiceChannel) || (args.channel instanceof StageChannel)) {
            if (!voice.checkMemberPermissionsForVoiceChannel(invoker.member as GuildMember, args.channel as VoiceChannel | StageChannel)) {
                action.reply(invoker, {
                    content: "you don't have permission to make me join the voice channel",
                    ephemeral: guild_config.other.use_ephemeral_replies
                })
                return new CommandResponse({});
            }
            voice.joinVoiceChannel(args.channel as VoiceChannel);
            action.reply(invoker, {
                content: "joined voice channel: <#" + (args.channel as VoiceChannel).id + ">",
                ephemeral: guild_config.other.use_ephemeral_replies
            })
            return new CommandResponse({});
        }
        if (typeof args.channel === "string") {
            let channel;
            try {
                channel = invoker.guild?.channels.cache.find(channel => channel.name.toLowerCase().startsWith(args.channel.toLowerCase()));
                if (!channel) {
                    channel = await invoker.guild?.channels.fetch(args.channel);
                }
            } catch (err) {
                action.reply(invoker, {
                    content: "channel not found: " + args.channel,
                    ephemeral: guild_config.other.use_ephemeral_replies
                })
                return new CommandResponse({});
            }
            if (channel && (channel instanceof VoiceChannel || channel instanceof StageChannel)) {
                if (!voice.checkMemberPermissionsForVoiceChannel(invoker.member as GuildMember, channel as VoiceChannel | StageChannel)) {
                    action.reply(invoker, {
                        content: "you don't have permission to make me join the voice channel",
                        ephemeral: guild_config.other.use_ephemeral_replies
                    })
                    return new CommandResponse({});
                }
                voice.joinVoiceChannel(channel as VoiceChannel);
                action.reply(invoker, {
                    content: "joined voice channel: <#" + (channel as VoiceChannel).id + ">",
                    ephemeral: guild_config.other.use_ephemeral_replies
                })
                return new CommandResponse({});
            }
        }
        if (!args.channel && invoker?.member instanceof GuildMember && invoker.member.voice.channel) {
            if (!voice.checkMemberPermissionsForVoiceChannel(invoker.member as GuildMember, invoker.member.voice.channel)) {
                action.reply(invoker, {
                    content: "you don't have permission to make me join the voice channel",
                    ephemeral: guild_config.other.use_ephemeral_replies
                })
                return new CommandResponse({});
            }
            voice.joinVoiceChannel(invoker.member.voice.channel);
            action.reply(invoker, {
                content: "joined voice channel: <#" + invoker.member.voice.channel.id + ">",
                ephemeral: guild_config.other.use_ephemeral_replies
            })
            return new CommandResponse({});
        }
        if (!args.channel) {
            action.reply(invoker, {
                content: "please supply a voice channel",
                ephemeral: guild_config.other.use_ephemeral_replies
            })
            return new CommandResponse({});
        }
    }
);

const command = new Command(
    {
        name: 'vc',
        description: 'join / leave a vc',
        long_description: 'make the bot join or leave a specific voice channel',
        category: CommandCategory.Voice,
        example_usage: "p/vc join",
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [join, leave],
            self: "vc",
        },
        allow_external_guild: false,
        options: [
            new CommandOption({
                name: 'subcommand',
                description: 'the subcommand to run',
                type: CommandOptionType.String,
                required: true,
                choices: [
                    { name: 'join', value: 'join' },
                    { name: 'leave', value: 'leave' }
                ]
            }),
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
                content: "invalid subcommand: " + args.subcommand,
                ephemeral: guild_config.other.use_ephemeral_replies,
            })
            return;
        }
        action.reply(invoker, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: guild_config.other.use_ephemeral_replies
        })
    }
);

export default command;