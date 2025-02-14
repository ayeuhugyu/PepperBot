import { ChannelType, Collection, GuildMember, Message, StageChannel, VoiceChannel } from "discord.js";
import { Command, CommandCategory, CommandOption, CommandOptionType, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import * as voice from "../lib/voice";
import { Channel } from "diagnostics_channel";

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
    async function execute ({ message, guildConfig }) {
        const voiceManager = voice.getVoiceManager(message.guild?.id || "");
        if (voiceManager) {
            if (!voice.checkMemberPermissionsForVoiceChannel(message.member as GuildMember, voiceManager.channel as VoiceChannel | StageChannel)) {
                action.reply(message, {
                    content: "you don't have permission to make me leave the voice channel",
                    ephemeral: guildConfig.other.use_ephemeral_replies
                })
                return new CommandResponse({});
            }
            action.reply(message, {
                content: "left voice channel <#" + voiceManager.channel?.id + ">",
                ephemeral: guildConfig.other.use_ephemeral_replies
            })
            voice.leaveVoiceChannel(message.guild?.id || "");
        } else {
            action.reply(message, {
                content: "im not in a voice channel",
                ephemeral: guildConfig.other.use_ephemeral_replies
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
    async function getArguments({ message, self, guildConfig }) {
        message = message as Message;
        const args = new Collection();
        const commandLength = `${guildConfig.other.prefix}${self.name}`.length;
        const channel = message.content.slice(commandLength)?.trim();
        args.set('channel', channel);
        return args;
    },
    async function execute({ message, args, guildConfig }) {
        if ((args?.get("channel") instanceof VoiceChannel) || (args?.get("channel") instanceof StageChannel)) {
            if (!voice.checkMemberPermissionsForVoiceChannel(message.member as GuildMember, args?.get("channel") as VoiceChannel | StageChannel)) {
                action.reply(message, {
                    content: "you don't have permission to make me join the voice channel",
                    ephemeral: guildConfig.other.use_ephemeral_replies
                })
                return new CommandResponse({});
            }
            voice.joinVoiceChannel(args?.get("channel") as VoiceChannel);
            action.reply(message, {
                content: "joined voice channel: <#" + (args?.get("channel") as VoiceChannel).id + ">",
                ephemeral: guildConfig.other.use_ephemeral_replies
            })
            return new CommandResponse({});
        }
        if (typeof args?.get("channel") === "string") {
            let channel;
            try {
                channel = message.guild?.channels.cache.find(channel => channel.name.toLowerCase().startsWith(args?.get("channel").toLowerCase()));
                if (!channel) {
                    channel = await message.guild?.channels.fetch(args?.get("channel"));
                }
            } catch (err) {
                action.reply(message, {
                    content: "channel not found: " + args?.get("channel"),
                    ephemeral: guildConfig.other.use_ephemeral_replies
                })
                return new CommandResponse({});
            }
            if (channel && (channel instanceof VoiceChannel || channel instanceof StageChannel)) {
                if (!voice.checkMemberPermissionsForVoiceChannel(message.member as GuildMember, channel as VoiceChannel | StageChannel)) {
                    action.reply(message, {
                        content: "you don't have permission to make me join the voice channel",
                        ephemeral: guildConfig.other.use_ephemeral_replies
                    })
                    return new CommandResponse({});
                }
                voice.joinVoiceChannel(channel as VoiceChannel);
                action.reply(message, {
                    content: "joined voice channel: <#" + (channel as VoiceChannel).id + ">",
                    ephemeral: guildConfig.other.use_ephemeral_replies
                })
                return new CommandResponse({});
            }
        }
        if (!args?.get("channel") && message?.member instanceof GuildMember && message.member.voice.channel) {
            if (!voice.checkMemberPermissionsForVoiceChannel(message.member as GuildMember, message.member.voice.channel)) {
                action.reply(message, {
                    content: "you don't have permission to make me join the voice channel",
                    ephemeral: guildConfig.other.use_ephemeral_replies
                })
                return new CommandResponse({});
            }
            voice.joinVoiceChannel(message.member.voice.channel);
            action.reply(message, {
                content: "joined voice channel: <#" + message.member.voice.channel.id + ">",
                ephemeral: guildConfig.other.use_ephemeral_replies
            })
            return new CommandResponse({});
        }
        if (!args?.get("channel")) {
            action.reply(message, {
                content: "please supply a voice channel",
                ephemeral: guildConfig.other.use_ephemeral_replies
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
        subcommands: [join, leave],
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
    async function getArguments ({ message, self, guildConfig }) {
        message = message as Message;
        const args = new Collection();
        const commandLength = `${guildConfig.other.prefix}${self.name}`.length;
        const search = message.content.slice(commandLength)?.trim();
        args.set('subcommand', search.split(" ")[0]);
        return args;
    },
    async function execute ({ message, args, piped_data, will_be_piped, guildConfig }) {
        if (args?.get("subcommand")) {
            action.reply(message, {
                content: "invalid subcommand: " + args?.get("subcommand"),
                ephemeral: guildConfig.other.use_ephemeral_replies,
            })
            return;
        }
        action.reply(message, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: guildConfig.other.use_ephemeral_replies
        })
    }
);

export default command;