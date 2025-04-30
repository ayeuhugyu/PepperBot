import { Collection, GuildMember, Message } from "discord.js";
import { Command, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { GPTFormattedCommandInteraction, GPTProcessor, respond } from "../lib/gpt";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, CommandOptionType, InvokerType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import * as voice from "../lib/voice";
import { getInfo, Playlist, Queue, Response, ResponseType, Video, VideoError, getQueue, embedVideoOrSound } from "../lib/classes/queue_manager";
import { Readable } from "stream";
import { GuildConfig } from "../lib/guild_config_manager";
import { CustomSound, getSound } from "../lib/custom_sound_manager";
import { createThemeEmbed, Theme } from "../lib/theme";
import PagedMenuV2 from "../lib/classes/pagination_v2";
import { Container, Section, Thumbnail, Separator, TextDisplay, Button, ButtonStyle } from "../lib/classes/components";

async function queueToMessage(queue: Queue, invoker: CommandInvoker): Promise<PagedMenuV2> {
    const items = queue.items;
    const title = new TextDisplay({
        content: `### [queue for ${invoker.guild?.name}](https://pepperbot.online/queue/${queue.guild_id})`,
    })
    let pages: PagedMenuV2['pages'] = [];
    let currentPage: undefined | Container = undefined;
    let itemsInPage = 0;

    items.forEach((item, index) => {
        const isCurrentIndex = index === queue.current_index;
        let section = embedVideoOrSound(item, isCurrentIndex, index);
        const page = currentPage || new Container({
            components: []
        });
        page.components.push(section);
        page.components.push(new Separator());
        itemsInPage++;
        if (itemsInPage >= 5) {
            page.components.pop(); // remove the last separator
            pages.push([title, page]);
            itemsInPage = 0;
            currentPage = undefined;
        } else {
            currentPage = page;
        }
    });
    if (currentPage) {
        pages.push(currentPage);
    }
    if (items.length === 0) {
        pages = [[title, new Container({
            components: [
                new TextDisplay({
                    content: "no items in queue"
                }),
            ]
        })]]
    }

    return new PagedMenuV2(pages);
}

const shuffle = new Command(
    {
        name: 'shuffle',
        description: 'shuffle all items in the queue',
        long_description: 'randomizes the order of all items in the queue',
        tags: [CommandTag.Voice],
        pipable_to: [],
        example_usage: "p/queue shuffle",
        argument_order: "",
        aliases: [],
        options: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ args, invoker, guild_config, invoker_type }) {
        const queueResponse = await getQueue(invoker, guild_config);
        if (queueResponse.type === ResponseType.Error) {
            action.reply(invoker, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: queueResponse.data,
            });
        }
        const queue = queueResponse.data;
        await queue.shuffle();
        if (invoker_type === InvokerType.Message && invoker.channelId === queue.voice_manager?.channel?.id) return; // dont reply because it will already have a response from the queue manager's event handling
        action.reply(invoker, { content: "shuffled the queue", ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

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
            return new CommandResponse({
                error: true,
                message: queueResponse.data,
            });
        }
        const queue = queueResponse.data;
        await queue.previous();
        if (invoker_type === InvokerType.Message && invoker.channelId === queue.voice_manager?.channel?.id) return; // dont reply because it will already have a response from the queue manager's event handling
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
            return new CommandResponse({
                error: true,
                message: queueResponse.data,
            });
        }
        const queue = queueResponse.data;
        await queue.next(true);
        if (invoker_type === InvokerType.Message && invoker.channelId === queue.voice_manager?.channel?.id) return; // dont reply because it will already have a response from the queue manager's event handling
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
            return new CommandResponse({
                error: true,
                message: "please provide an index",
            });
        }
        if (isNaN(parseInt(args.index))) {
            action.reply(invoker, { content: "index must be a number", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "index must be a number",
            });
        }
        const index = parseInt(args.index) - 1;
        const queueResponse = await getQueue(invoker, guild_config);
        if (queueResponse.type === ResponseType.Error) {
            action.reply(invoker, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: queueResponse.data,
            });
        }
        const queue = queueResponse.data;
        if (index < 0 || index >= queue.items.length) {
            action.reply(invoker, { content: "index out of range", ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        await queue.remove(index);
        if (invoker_type === InvokerType.Message && invoker.channelId === queue.voice_manager?.channel?.id) return; // dont reply because it will already have a response from the queue manager's event handling
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
            return new CommandResponse({
                error: true,
                message: queueResponse.data,
            });
        }
        const queue = queueResponse.data;
        await queue.clear();
        if (invoker_type === InvokerType.Message && invoker.channelId === queue.voice_manager?.channel?.id) return; // dont reply because it will already have a response from the queue manager's event handling
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
            return new CommandResponse({
                error: true,
                message: queueResponse.data,
            });
        }
        const queue = queueResponse.data;
        queue.stop();
        if (invoker_type === InvokerType.Message && invoker.channelId === queue.voice_manager?.channel?.id) return; // dont reply because it will already have a response from the queue manager's event handling
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
            return new CommandResponse({
                error: true,
                message: queueResponse.data,
            });
        }
        const queue = queueResponse.data;
        queue.play();
        if (invoker_type === InvokerType.Message && invoker.channelId === queue.voice_manager?.channel?.id) return; // dont reply because it will already have a response from the queue manager's event handling
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
                        return new CommandResponse({
                            error: true,
                            message: "please provide a url",
                        });
                    }
                    args.url = attachment.url;
                }
            } else {
                action.reply(invoker, { content: "please provide a url", ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: "please provide a url",
                });
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
                return new CommandResponse({
                    error: true,
                    message: item.data.message,
                });
            }
            const data = item.data;
            const queueResponse = await getQueue(invoker, guild_config);
            if (queueResponse.type === ResponseType.Error) {
                action.edit(sent, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
                return;
            }
            const queue = queueResponse.data;
            queue.add(data);
            if (invoker_type === InvokerType.Message && invoker.channelId === queue.voice_manager?.channel?.id) {
                action.deleteMessage(sent as Message<true>);
                return;
            }; // dont reply because it will already have a response from the queue manager's event handling
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
            const sound = await getSound(url);
            if (!sound) {
                action.reply(invoker, {
                    content: `the sound \`${args.url}\` does not exist`,
                    ephemeral: guild_config.other.use_ephemeral_replies,
                })
                return new CommandResponse({
                    error: true,
                    message: `the sound \`${args.url}\` does not exist`,
                });
            }
            const queueResponse = await getQueue(invoker, guild_config);
            if (queueResponse.type === ResponseType.Error) {
                action.reply(invoker, { content: queueResponse.data, ephemeral: guild_config.other.use_ephemeral_replies });
                return;
            }
            const queue = queueResponse.data;
            await queue.add(sound);
            if (invoker_type === InvokerType.Message && invoker.channelId === queue.voice_manager?.channel?.id) return; // dont reply because it will already have a response from the queue manager's event handling
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
        let pagedMenu = await queueToMessage(queue, invoker);
        const reply = await action.reply(invoker, { components: [...pagedMenu.pages[0], pagedMenu.getActionRow()], components_v2: true, ephemeral: guild_config.other.use_ephemeral_replies });
        pagedMenu.setActiveMessage(reply as Message<true>);
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
            list: [view, add, play, stop, clear, remove, skip, previous, shuffle]
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
        let pagedMenu = await queueToMessage(queue, invoker);
        const reply = await action.reply(invoker, { components: [...pagedMenu.pages[0], pagedMenu.getActionRow()], components_v2: true, ephemeral: guild_config.other.use_ephemeral_replies });
        pagedMenu.setActiveMessage(reply as Message<true>);
    }
);

export default command;