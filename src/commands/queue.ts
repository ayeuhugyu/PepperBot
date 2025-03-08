import { Collection, GuildMember, Message } from "discord.js";
import { Command, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { GPTFormattedCommandInteraction, GPTProcessor, respond } from "../lib/gpt";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, CommandOptionType, InvokerType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import * as voice from "../lib/voice";
import { getInfo, Playlist, Queue, Response, ResponseType, Video, VideoError } from "../lib/classes/queue_manager";
import { Readable } from "stream";
import { GuildConfig } from "../lib/guild_config_manager";
import { getSound } from "../lib/custom_sound_manager";

let queues: Queue[] = [];

async function getQueue(invoker: CommandInvoker, guild_config: GuildConfig): Promise<Response<false, Queue> | Response<true, string>> {
    let queue = queues.find(q => q.guild_id === invoker.guildId);
    if (queue) {
        const voice_manager = await voice.getVoiceManager(invoker.guildId || "");
        if (voice_manager) queue.voice_manager = voice_manager;
    }
    if (!invoker.guildId) {
        return { type: ResponseType.Error, data: "you must be in a guild to use this command" };
    }
    if (!queue) {
        let connectionManager = await voice.getVoiceManager(invoker.guildId || "");
        if (!connectionManager && (invoker.member instanceof GuildMember) && invoker.member?.voice.channel) {
            connectionManager = await voice.joinVoiceChannel((invoker.member.voice.channel));
        }
        if (!connectionManager) {
            return { type: ResponseType.Error, data: `neither of us are in a voice channel, use ${guild_config.other.prefix}vc join to make me join one` };
        }
        queue = new Queue(invoker.guildId, connectionManager);
        queues.push(queue);
    }
    return { type: ResponseType.Success, data: queue };
}

function queueToMessage(queue: Queue): Partial<action.MessageInput> {
    return { content: `queue: ${queue.items.map((q, i) => `${i + 1}. ${q instanceof Video ? q.title : q.name}`).join("\n")}` };
}

const previous = new Command(
    {
        name: 'previous',
        description: 'go to the previous song',
        long_description: 'goes to the previous song',
        tags: [CommandTag.Voice],
        pipable_to: [],
        example_usage: "p/queue previous",
        argument_order: "",
        aliases: [],
        options: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ args, invoker, guild_config, invoker_type }) {
        const queueResponse = await getQueue(invoker, guild_config);
        if (queueResponse.type === ResponseType.Error) {
            action.reply(invoker, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const queue = queueResponse.data;
        queue.previous();
        action.reply(invoker, { content: "went to the previous song", ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const skip = new Command(
    {
        name: 'skip',
        description: 'skip the current song',
        long_description: 'skips the current song',
        tags: [CommandTag.Voice],
        pipable_to: [],
        example_usage: "p/queue skip",
        argument_order: "",
        aliases: ["next"],
        options: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ args, invoker, guild_config, invoker_type }) {
        const queueResponse = await getQueue(invoker, guild_config);
        if (queueResponse.type === ResponseType.Error) {
            action.reply(invoker, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const queue = queueResponse.data;
        queue.next(true);
        action.reply(invoker, { content: "skipped the current song", ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const remove = new Command(
    {
        name: 'remove',
        description: 'remove a song from the queue',
        long_description: 'removes a song from the queue',
        tags: [CommandTag.Voice],
        pipable_to: [],
        example_usage: "p/queue remove 1",
        argument_order: "<index>",
        aliases: [],
        options: [
            new CommandOption({
                name: 'index',
                description: 'the index of the song to remove',
                type: CommandOptionType.Integer,
                required: true,
            })
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["index"]),
    async function execute ({ args, invoker, guild_config, invoker_type }) {
        if (!args || !args.index) {
            action.reply(invoker, { content: "please provide an index", ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        if (isNaN(parseInt(args.index))) {
            action.reply(invoker, { content: "index must be a number", ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const index = parseInt(args.index) - 1;
        const queueResponse = await getQueue(invoker, guild_config);
        if (queueResponse.type === ResponseType.Error) {
            action.reply(invoker, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const queue = queueResponse.data;
        if (index < 0 || index >= queue.items.length) {
            action.reply(invoker, { content: "index out of range", ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        queue.remove(index);
        action.reply(invoker, { content: `removed index ${args.index}`, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const clear = new Command(
    {
        name: 'clear',
        description: 'clear the queue',
        long_description: 'clears the queue',
        tags: [CommandTag.Voice],
        pipable_to: [],
        example_usage: "p/queue clear",
        argument_order: "",
        aliases: [],
        options: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ args, invoker, guild_config, invoker_type }) {
        const queueResponse = await getQueue(invoker, guild_config);
        if (queueResponse.type === ResponseType.Error) {
            action.reply(invoker, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const queue = queueResponse.data;
        queue.clear();
        action.reply(invoker, { content: "cleared the queue", ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const stop = new Command(
    {
        name: 'stop',
        description: 'stop the queue',
        long_description: 'stops the queue',
        tags: [CommandTag.Voice],
        pipable_to: [],
        example_usage: "p/queue stop",
        argument_order: "",
        aliases: [],
        options: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ args, invoker, guild_config, invoker_type }) {
        const queueResponse = await getQueue(invoker, guild_config);
        if (queueResponse.type === ResponseType.Error) {
            action.reply(invoker, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const queue = queueResponse.data;
        queue.stop();
        action.reply(invoker, { content: "stopped the queue", ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const play = new Command(
    {
        name: 'play',
        description: 'begins the queue',
        long_description: 'starts the queue at whatever the last index was',
        tags: [CommandTag.Voice],
        pipable_to: [],
        example_usage: "p/queue add https://www.youtube.com/watch?v=PShGNy9SSpg",
        argument_order: "<url>",
        aliases: [],
        options: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["url"]),
    async function execute ({ args, invoker, guild_config, invoker_type }) {
        const queueResponse = await getQueue(invoker, guild_config);
        if (queueResponse.type === ResponseType.Error) {
            action.reply(invoker, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const queue = queueResponse.data;
        queue.play();
        action.reply(invoker, { content: "began queue at index " + queue.current_index, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const add = new Command(
    {
        name: 'add',
        description: 'add a url to the queue',
        long_description: 'validates and adds a url to the music queue',
        tags: [CommandTag.Voice],
        pipable_to: [],
        example_usage: "p/queue add https://www.youtube.com/watch?v=PShGNy9SSpg",
        argument_order: "<url>",
        aliases: [],
        options: [
            new CommandOption({
                name: 'url',
                description: 'the url of the video to add',
                type: CommandOptionType.String,
                required: true,
            })
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["url"]),
    async function execute ({ args, invoker, guild_config, invoker_type }) {
        if (!args || !args.url) {
            if (invoker_type === InvokerType.Message) {
                if ((invoker as Message).attachments.size > 0) {
                    const attachment = (invoker as Message).attachments.first();
                    if (!attachment) {
                        action.reply(invoker, { content: "please provide a url", ephemeral: guild_config.other.use_ephemeral_replies });
                        return;
                    }
                    args.url = attachment.url;
                }
            } else {
                action.reply(invoker, { content: "please provide a url", ephemeral: guild_config.other.use_ephemeral_replies });
                return;
            }
        }

        let url = args.url;
        if (url.startsWith("http://") || url.startsWith("https://")) {
            if (url.startsWith("<") && url.endsWith(">")) {
                url = url.slice(1, -1);
            }
            url = url.replaceAll("\"", "");

            const sent = await action.reply(invoker, {
                content: `getting info for video...`
            });

            const item = await getInfo(url).catch((e: Response<true, VideoError>) => { return e });
            if (item.type === ResponseType.Error) {
                action.edit(sent, { content: `error getting info: ${item.data.message}\n-#\`${item.data.full_error}\``, ephemeral: guild_config.other.use_ephemeral_replies });
                return;
            }
            const data = item.data;
            const queueResponse = await getQueue(invoker, guild_config);
            if (queueResponse.type === ResponseType.Error) {
                action.edit(sent, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
                return;
            }
            const queue = queueResponse.data;
            queue.add(data);
            if (data instanceof Video) {
                action.edit(sent, { content: `added \`${data.title}\` to the queue` });
            }
            if (data instanceof Playlist) {
                action.edit(sent, { content: `added ${data.videos.length} videos to the queue` });
            }
        } else {
            if (url.startsWith("file://")) {
                url = url.slice(7);
            }
            const sound = await getSound(args.url);
            if (!sound) {
                action.reply(invoker, {
                    content: `the sound \`${args.url}\` does not exist`,
                    ephemeral: guild_config.other.use_ephemeral_replies,
                })
                return new CommandResponse({});
            }
            const queueResponse = await getQueue(invoker, guild_config);
            if (queueResponse.type === ResponseType.Error) {
                action.reply(invoker, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
                return;
            }
            const queue = queueResponse.data;
            queue.add(sound);
            action.reply(invoker, { content: `added \`${sound.name}\` to the queue` });
        }
    }
);

const view = new Command(
    {
        name: 'view',
        description: 'view the music queue',
        long_description: 'view the current music queue',
        tags: [CommandTag.Voice],
        pipable_to: [], // todo: text pipablility
        example_usage: "p/queue view",
        argument_order: "",
        aliases: [],
        options: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ args, invoker, guild_config, invoker_type }) {
        const queueResponse = await getQueue(invoker, guild_config);
        if (queueResponse.type === ResponseType.Error) {
            action.reply(invoker, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const queue = queueResponse.data;
        let message = queueToMessage(queue);
        message.ephemeral = guild_config.other.use_ephemeral_replies;
        action.reply(invoker, message);
    }
);

const command = new Command(
    {
        name: 'queue',
        description: 'manage the music queue',
        long_description: 'allows you to add and remove songs, start, and view the current music queue',
        tags: [CommandTag.Voice],
        pipable_to: [],
        example_usage: "p/queue view",
        argument_order: "depends on subcommand",
        aliases: ["playlist"],
        options: [],
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [view, add, play, stop, clear, remove, skip, previous]
        }
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ args, invoker, guild_config, invoker_type }) {
        if (args.subcommand) {
            action.reply(invoker, { content: `\`${args.subcommand}\` isn't a valid subcommand`, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const queueResponse = await getQueue(invoker, guild_config);
        if (queueResponse.type === ResponseType.Error) {
            action.reply(invoker, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const queue = queueResponse.data;
        let message = queueToMessage(queue);
        message.ephemeral = guild_config.other.use_ephemeral_replies;
        action.reply(invoker, message);
    }
);

export default command;