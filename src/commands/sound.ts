import { Attachment, Collection, GuildMember, Message, User } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import type { CommandInvoker } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { addSound, getSound, listSounds } from "../lib/custom_sound_manager";
import { fixFileName, textToAttachment } from "../lib/attachment_manager";
import * as voice from "../lib/classes/voice";
import { CommandTag, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import { tablify } from "../lib/string_helpers";
import { createAudioResource } from "@discordjs/voice";

const list = new Command({
        name: 'list',
        description: 'lists sounds',
        long_description: 'lists all the sounds available',
        tags: [CommandTag.Voice],
        pipable_to: [CommandTag.TextPipable],
        aliases: ['ls'],
        root_aliases: ["listsounds"],
        options: [],
        example_usage: "p/sound list",
        argument_order: "",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ invoker, guild_config, args }) {
        const sounds = await listSounds();
        let reply = "sounds: ";
        let attachment
        if (sounds.length < 10) {
            reply += "```";
            sounds.forEach(sound => {
                reply += `\n${sound.name}`;
            });
            reply += "```";
        } else {
            const rows: string[][] = [];
            const columnCount = 2;
            for (let i = 0; i < sounds.length; i += columnCount) {
                rows.push(sounds.slice(i, i + columnCount).map(sound => sound.name));
            }

            const columns = ["1", "2"];
            const text = tablify(columns, rows, {
                no_header: true,
                column_separator: "  "
            });
            attachment = textToAttachment(text, "sounds.txt");
        }
        action.reply(invoker, {
            content: reply,
            ephemeral: guild_config.other.use_ephemeral_replies,
            files: attachment ? [attachment] : [],
        });
        return new CommandResponse({ pipe_data: { input_text: reply }});
    }
);

const play = new Command({
        name: 'play',
        description: 'plays a sound',
        long_description: 'plays the requested sound',
        tags: [CommandTag.Voice],
        pipable_to: [],
        aliases: [],
        root_aliases: ["playsound"],
        options: [
            new CommandOption({
                name: 'sound',
                description: 'the sound to play',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        example_usage: "p/sound play foo.mp3",
        argument_order: "<sound>",
        requiredPermissions: ["Connect", "Speak"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["sound"]),
    async function execute ({ invoker, guild_config, args }) {
        if (!args.sound) {
            action.reply(invoker, {
                content: "you need to specify a sound to play",
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                error: true,
                message: "you need to specify a sound to play",
            });
        }
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
        const sound = await getSound(args.sound);
        if (!sound) {
            action.reply(invoker, {
                content: `the sound \`${fixFileName(args.sound)}\` does not exist`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            })
            return new CommandResponse({
                error: true,
                message: `the sound \`${fixFileName(args.sound)}\` does not exist`,
            });
        }
        const voiceManager = await voice.getVoiceManager(invoker.guild);
        if (!voiceManager.connected && (invoker.member instanceof GuildMember) && invoker.member?.voice.channel) {
            voiceManager.connect(invoker.member.voice.channel);
        }
        if (!voiceManager) {
            action.reply(invoker, {
                content: `neither of us are in a voice channel, use ${guild_config.other.prefix}vc join to make me join one`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                error: true,
                message: `neither of us are in a voice channel, use ${guild_config.other.prefix}vc join to make me join one`,
            });
        }
        const resource = createAudioResource(sound.path)
        if (!resource) {
            action.reply(invoker, {
                content: `failed to create audio resource for \`${sound.name}\``,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                error: true,
                message: `failed to create audio resource for \`${sound.name}\``,
            });
        }
        voiceManager.play(resource)
        await action.reply(invoker, {
            content: `playing \`${sound.name}\`...`
        });
    }
);

const add = new Command({
        name: 'add',
        description: 'adds a sound',
        long_description: 'adds a sound to the bot',
        tags: [CommandTag.Voice],
        pipable_to: [],
        aliases: [],
        root_aliases: ['addsound'],
        options: [
            new CommandOption({
                name: 'sound',
                description: 'the sound to add',
                type: CommandOptionType.Attachment,
                required: true,
            })
        ],
        example_usage: "p/sound add <attach your sound file>",
        argument_order: "<sound>",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.FirstAttachment, ["sound"]),
    async function execute ({ invoker, guild_config, args }) {
        if (!args.sound) {
            action.reply(invoker, {
                content: "you need to attach a sound to add",
                ephemeral: guild_config.other.use_ephemeral_replies,
            })
            return new CommandResponse({
                error: true,
                message: "you need to attach a sound to add",
            });
        }
        const inputsound: Attachment = args.sound
        const existingSound = await getSound(inputsound.name);
        if (existingSound) {
            action.reply(invoker, {
                content: `the sound \`${inputsound.name}\` already exists`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            })
            return new CommandResponse({
                error: true,
                message: `the sound \`${inputsound.name}\` already exists`,
            });
        }
        const sent = await action.reply(invoker, {
            content: `downloading ${fixFileName(inputsound.name)}...`
        });
        if (!sent) return;
        await addSound(invoker.guildId, invoker.author.id, inputsound.url, fixFileName(inputsound.name));
        action.edit(sent, {
            content: `added sound ${fixFileName(inputsound.name)}`
        });
        return new CommandResponse({});
    }
);

const get = new Command({
        name: 'get',
        description: 'returns a sound',
        long_description: 'returns the requested sound',
        tags: [CommandTag.Voice],
        pipable_to: [],
        root_aliases: ["getsound"],
        options: [
            new CommandOption({
                name: 'sound',
                description: 'the sound to get',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        example_usage: "p/sound get foo.mp3",
        argument_order: "<sound>",
        requiredPermissions: ["AttachFiles"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["sound"]),
    async function execute ({ invoker, guild_config, args }) {
        if (!args.sound) {
            action.reply(invoker, {
                content: "you need to specify a sound to get",
                ephemeral: guild_config.other.use_ephemeral_replies,
            })
            return new CommandResponse({
                error: true,
                message: "you need to specify a sound to get",
            });
        }
        const sound = await getSound(args.sound);
        if (!sound) {
            action.reply(invoker, {
                content: `the sound \`${fixFileName(args.sound)}\` does not exist`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            })
            return new CommandResponse({
                error: true,
                message: `the sound \`${fixFileName(args.sound)}\` does not exist`,
            });
        }
        const sent = await action.reply(invoker, {
            content: `uploading...`
        });
        if (!sent) return;
        action.edit(sent, {
            content: `${sound.name}:`,
            files: [sound.path]
        });
        return new CommandResponse({});
    }
);

const command = new Command(
    {
        name: 'sound',
        description: 'various commands relating to custom sounds',
        long_description: 'allows you to manage custom sounds, such as uploading, listing, and playing them',
        tags: [CommandTag.Voice],
        pipable_to: [],
        argument_order: "<subcommand>",
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [get, add, play, list],
        },
        options: [],
        example_usage: "p/sound get hello.mp3",
        aliases: [],
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, guild_config, args }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use any of the following subcommands:\n\`${guild_config.other.prefix}sound get\`: get a sound\n\`${guild_config.other.prefix}sound add\`: add a sound\n\`${guild_config.other.prefix}sound list\`: list all sounds\n\`${guild_config.other.prefix}sound play\`: play a sound`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        await action.reply(invoker, {
            content: `this command does nothing if you don't supply a subcommand. use any of the following subcommands:\n\`${guild_config.other.prefix}sound get\`: get a sound\n\`${guild_config.other.prefix}sound add\`: add a sound\n\`${guild_config.other.prefix}sound list\`: list all sounds\n\`${guild_config.other.prefix}sound play\`: play a sound`,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
    }
);

export default command;