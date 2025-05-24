import { GuildMember, Message } from "discord.js";
import { Command, CommandAccess, CommandInput, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import { getQueue, QueueManager } from "../lib/music/queue";
import { CustomSound, getSound } from "../lib/custom_sound_manager";
import { fetchMediaInfo } from "../lib/downloaders";
import { embedVideoOrSound } from "../lib/music/embed";
import { Container, TextDisplay } from "../lib/classes/components";
import * as voice from "../lib/classes/voice";
import { inspect } from "util";
import { Video } from "../lib/music/media";
import { fixFileName } from "../lib/attachment_manager";

function findItemIndexInQueue(queue: QueueManager, search: string): number | undefined {
    // Index search
    const index = parseInt(search);
    if (!isNaN(index) && index >= 0 && index < queue.items.length) {
        return index;
    }
    // Title search
    const item = queue.items.find((item) => {
        if (item instanceof Video) {
            return item.title.toLowerCase().includes(search.toLowerCase());
        } else if (item instanceof CustomSound) {
            return item.name.toLowerCase().includes(fixFileName(search.toLowerCase().replace("sound:", "").replace("file://", "")));
        }
    });
    if (item) {
        return queue.items.indexOf(item);
    }
    // URL search
    const urlItem = queue.items.find((item) => {
        if (item instanceof Video) {
            return item.url.toLowerCase().includes(search.toLowerCase());
        }
    });
    if (urlItem) {
        return queue.items.indexOf(urlItem);
    }
    // No match found
    return undefined;
}

const silence = new Command(
    {
        name: 'silence',
        description: 'silences the queue',
        long_description: 'silences the queue; this will stop the queue from producing log messages in the voice channel. to actually stop playing music, use the stop command.',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/queue silence",
        aliases: ["mute"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, args, guild_config, invoker_type }) {
        if (!invoker.guild) {
            action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        const queue = getQueue(invoker.guild);
        if (queue.items.length === 0) {
            action.reply(invoker, { content: "queue is empty", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        queue.silence();
        if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) action.reply(invoker, { content: "silenced queue", ephemeral: guild_config.other.use_ephemeral_replies })
    }
)

const stop = new Command(
    {
        name: 'stop',
        description: 'stops the queue',
        long_description: 'stops the queue',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/queue stop",
        aliases: ["end"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, args, guild_config, invoker_type }) {
        if (!invoker.guild) {
            action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        const queue = getQueue(invoker.guild);
        if (queue.items.length === 0) {
            action.reply(invoker, { content: "queue is empty", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        queue.stop();
        if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) action.reply(invoker, { content: "queue stopped", ephemeral: guild_config.other.use_ephemeral_replies })
    }
)

const swap = new Command(
    {
        name: 'swap',
        description: 'swaps two items in the queue',
        long_description: 'swaps two items in the queue; can be a video, playlist, or custom sound',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'item1',
                description: 'the first item to swap',
                long_description: 'the first item to swap; can be a video, playlist, or custom sound (using file://soundname or sound:soundname)',
                type: CommandOptionType.String,
                required: true
            }),
            new CommandOption({
                name: 'item2',
                description: 'the second item to swap',
                long_description: 'the second item to swap; can be a video, playlist, or custom sound (using file://soundname or sound:soundname)',
                type: CommandOptionType.String,
                required: true
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: ["p/queue swap 1 2", "p/queue swap https://www.youtube.com/watch?v=-J0H5ah1G7A and https://www.youtube.com/watch?v=GxxHToC2qOg", "p/queue swap sound:my_sound.mp3 sound:my_other_sound.mp3"],
        argument_order: "<item1> <item2>",
        aliases: ["exchange"]
    },
    async function getArguments({ invoker, guild_config, invoker_type }) { // this actually does need a custom getArguments function for once
        const message = invoker as Message;
        const args: Record<string, string> = {}
        // using "and" or "with"
        const andSplit = message.content.split(/ and | with /);
        if (andSplit.length > 1) {
            args.item1 = andSplit[0].trim();
            args.item2 = andSplit[1].trim();
        }
        // using commas
        const commaSplit = message.content.split(",");
        if (commaSplit.length > 1 && !args.item1 && !args.item2) {
            args.item1 = commaSplit[0].trim();
            args.item2 = commaSplit[1].trim();
        }
        // using spaces
        const spaceSplit = message.content.split(" ");
        if (spaceSplit.length > 2 && !args.item1 && !args.item2) {
            args.item1 = spaceSplit[0].trim();
            args.item2 = spaceSplit[1].trim();
        }
        return args;
    },
    async function execute ({ invoker, args, guild_config, invoker_type }) {
        if (!invoker.guild) {
            action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        const queue = getQueue(invoker.guild);
        if (queue.items.length === 0) {
            action.reply(invoker, { content: "queue is empty", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        const item1 = args.item1;
        const item2 = args.item2;
        if (!item1 || !item2) {
            action.reply(invoker, { content: "please provide two items to swap in the queue", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "please provide two items to swap in the queue",
            });
        }
        const index1 = findItemIndexInQueue(queue, item1);
        const index2 = findItemIndexInQueue(queue, item2);

        if (index1 === undefined && index2 === undefined) {
            action.reply(invoker, { content: `could not find either item \`${item1}\` or \`${item2}\` in the queue`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
            error: true,
            message: `could not find either item \`${item1}\` or \`${item2}\` in the queue`,
            });
        }
        if (index1 === undefined) {
            action.reply(invoker, { content: `could not find item \`${item1}\` in the queue`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
            error: true,
            message: `could not find item \`${item1}\` in the queue`,
            });
        }
        if (index2 === undefined) {
            action.reply(invoker, { content: `could not find item \`${item2}\` in the queue`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
            error: true,
            message: `could not find item \`${item2}\` in the queue`,
            });
        }
        queue.swap(index1, index2);
        if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) action.reply(invoker, { content: `swapped \`${item1}\` and \`${item2}\``, ephemeral: guild_config.other.use_ephemeral_replies })
    }
)

const shuffle = new Command(
    {
        name: 'shuffle',
        description: 'shuffles the queue',
        long_description: 'shuffles the queue; this will randomize the order of the items in the queue',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/queue shuffle",
        aliases: ["randomize"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, args, guild_config, invoker_type }) {
        if (!invoker.guild) {
            action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        const queue = getQueue(invoker.guild);
        if (queue.items.length === 0) {
            action.reply(invoker, { content: "queue is empty", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        queue.shuffle();
        if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) action.reply(invoker, { content: "queue shuffled", ephemeral: guild_config.other.use_ephemeral_replies })
    }
)

const previous = new Command(
    {
        name: 'previous',
        description: 'goes to the previous item in the queue',
        long_description: 'goes to the previous item in the queue',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'amount',
                description: 'the amount of items to go back',
                long_description: 'the amount of items to go back; defaults to 1',
                type: CommandOptionType.Integer,
                required: false
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: ["p/queue previous", "p/queue previous 2"],
        argument_order: "<amount?>",
        aliases: ["prev", "unskip", "back"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["amount"]),
    async function execute ({ invoker, args, guild_config, invoker_type }) {
        if (!invoker.guild) {
            action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        const queue = getQueue(invoker.guild);
        if (queue.items.length === 0) {
            action.reply(invoker, { content: "queue is empty", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        const amount = parseInt(args.amount || "1");
        if (isNaN(amount) || amount <= 0) {
            action.reply(invoker, { content: "please provide a valid amount to go back", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "please provide a valid amount to go back",
            });
        }
        queue.previous(amount);
        if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) action.reply(invoker, { content: `went back \`${amount}\` item${(amount === 1) ? "" : "s"}`, ephemeral: guild_config.other.use_ephemeral_replies })
    }
)

const skip = new Command(
    {
        name: 'skip',
        description: 'skips the current item in the queue',
        long_description: 'skips the current item in the queue; can be a video, playlist, or custom sound',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'amount',
                description: 'the amount of items to skip',
                long_description: 'the amount of items to skip; defaults to 1',
                type: CommandOptionType.Integer,
                required: false
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: ["p/queue skip", "p/queue skip 2"],
        argument_order: "<amount?>",
        aliases: ["next"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["amount"]),
    async function execute ({ invoker, args, guild_config, invoker_type }) {
        if (!invoker.guild) {
            action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        const queue = getQueue(invoker.guild);
        if (queue.items.length === 0) {
            action.reply(invoker, { content: "queue is empty", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        const amount = parseInt(args.amount || "1");
        if (isNaN(amount) || amount <= 0) {
            action.reply(invoker, { content: "please provide a valid amount to skip", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "please provide a valid amount to skip",
            });
        }
        queue.next(amount);
        if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) action.reply(invoker, { content: `skipped \`${amount}\` item${(amount === 1) ? "" : "s"}`, ephemeral: guild_config.other.use_ephemeral_replies })
    }
)

const remove = new Command(
    {
        name: 'remove',
        description: 'removes an item from the queue',
        long_description: 'removes an item from the queue; can be a video, playlist, or custom sound',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'item',
                description: 'the item to remove from the queue',
                long_description: 'the item to remove from the queue; can be a video, playlist, or custom sound (using file://soundname or sound:soundname)',
                type: CommandOptionType.String,
                required: true
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: ["p/queue remove 1", "p/queue remove https://www.youtube.com/watch?v=ABS-mlep5rY", "p/queue remove sound:my_sound.mp3", ""],
        argument_order: "<item>",
        aliases: ["delete", "del", "rm"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["item"]),
    async function execute ({ invoker, args, guild_config, invoker_type }) {
        if (!invoker.guild) {
            action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        const queue = getQueue(invoker.guild);
        if (queue.items.length === 0) {
            action.reply(invoker, { content: "queue is empty", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        const item = args.item;
        if (!item) {
            action.reply(invoker, { content: "please provide an item to remove from the queue", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "please provide an item to remove from the queue",
            });
        }
        const index = findItemIndexInQueue(queue, item);
        if (index === undefined) {
            action.reply(invoker, { content: `could not find item \`${item}\` in the queue, try just using the index listed next to it using \`${guild_config.other.prefix}queue view\`.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `could not find item \`${item}\` in the queue, try just using the index listed next to it using \`${guild_config.other.prefix}queue view\`.`,
            });
        }
        queue.removeItem(index);
        if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) action.reply(invoker, { content: `removed \`${item}\` from the queue`, ephemeral: guild_config.other.use_ephemeral_replies })
    }
)

const play = new Command(
    {
        name: 'play',
        description: 'start the queue',
        long_description: 'starts the queue. if given an index, it will start from that index.',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        example_usage: ["p/queue play", "p/queue play 0", "p/queue play at 1"],
        argument_order: "<index?>",
        aliases: ["start", "begin"],
        options: [
            new CommandOption({
                name: 'index',
                description: 'the index to start the queue from',
                long_description: 'the index to start the queue from; if not given, it will start from the beginning',
                type: CommandOptionType.Integer,
                required: false
            })
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["index"]),
    async function execute ({ args, invoker, guild_config, invoker_type }) {
        if (!invoker.guild) {
            action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "this command can only be used in a guild",
            });
        }
        const queue = getQueue(invoker.guild);
        if (queue.items.length === 0) {
            action.reply(invoker, { content: "queue is empty", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "queue is empty",
            });
        }

        const voiceManager = voice.getVoiceManager(invoker.guild);
        if (!voiceManager.connected) {
            if (invoker.member && invoker.member instanceof GuildMember) {
                if (invoker.member.voice.channel) {
                    voiceManager.connect(invoker.member.voice.channel);
                }
            }
        }
        if (!voiceManager.connected) {
            action.reply(invoker, { content: `neither of us are in a voice channel; use \`${guild_config.other.prefix}vc join\` to make me join one OR join one and run this command again to be automatically joined`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `neither of us are in a voice channel; use \`${guild_config.other.prefix}vc join\` to make me join one OR join one and run this command again to be automatically joined`,
            });
        }

        queue.voiceManager = voiceManager;
        queue.channel = voiceManager.channel;

        const index = parseInt(args.index.toString().replace("at", "").trim());
        if (!isNaN(index) && index >= 0 && index < queue.items.length) {
            queue.currentIndex = index - 1; // -1 because the embed they will be reading from will be 1 indexed
        } else if (args.index) {
            const itemIndex = findItemIndexInQueue(queue, args.index);
            if (itemIndex !== undefined) {
                queue.currentIndex = itemIndex - 1; // -1 because the embed they will be reading from will be 1 indexed
            } else {
                action.reply(invoker, { content: `could not find item \`${args.index}\` in the queue`, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: `could not find item \`${args.index}\` in the queue`,
                });
            }
        }
        queue.play();
        if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) action.reply(invoker, { content: "queue started", ephemeral: guild_config.other.use_ephemeral_replies })
    }
)

const add = new Command(
    {
        name: 'add',
        description: 'adds an item to the queue',
        long_description: 'adds an item to the queue; can be a video, playlist, or custom sound',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'item',
                description: 'the item to add to the queue',
                long_description: 'the item to add to the queue; can be a video, playlist, or custom sound (using file://soundname or sound:soundname). file attachments work too.',
                type: CommandOptionType.String,
                required: true
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: ["p/queue add https://www.youtube.com/watch?v=ABS-mlep5rY", "p/queue add sound:my_sound.mp3", ""],
        argument_order: "<item>",
        aliases: ["queue"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["item"]),
    async function execute ({ invoker, args, guild_config, invoker_type }) {
        if (!invoker.guild) {
            action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        const queue = getQueue(invoker.guild);
        let item = args.item;
        if (!args || !item) {
            if (invoker_type === InvokerType.Message) {
                if ((invoker as Message).attachments.size > 0) {
                    const attachment = (invoker as Message).attachments.first();
                    if (!attachment) {
                        action.reply(invoker, { content: "please provide an item to add to the queue", ephemeral: guild_config.other.use_ephemeral_replies });
                        return new CommandResponse({
                            error: true,
                            message: "please provide an item to add to the queue",
                        });
                    }
                    item = attachment.url;
                }
            } else {
                action.reply(invoker, { content: "please provide an item to add to the queue", ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: "please provide an item to add to the queue",
                });
            }
            if (!item) {
                // if we still don't have a url after checking attachments
                action.reply(invoker, { content: "please provide an item to add to the queue", ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: "please provide an item to add to the queue",
                });
            }
        }
        const voiceManager = voice.getVoiceManager(invoker.guild);
        if (!voiceManager.connected) {
            if (invoker.member && invoker.member instanceof GuildMember) {
                if (invoker.member.voice.channel) {
                    voiceManager.connect(invoker.member.voice.channel);
                }
            }
        }
        if (!voiceManager.connected) {
            action.reply(invoker, { content: `neither of us are in a voice channel; use \`${guild_config.other.prefix}vc join\` to make me join one OR join one and run this command again to be automatically joined`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `neither of us are in a voice channel; use \`${guild_config.other.prefix}vc join\` to make me join one OR join one and run this command again to be automatically joined`,
            });
        }

        queue.voiceManager = voiceManager;
        queue.channel = voiceManager.channel;

        if (!item.startsWith("http")) {
            let soundName = item;
            if (item.startsWith("sound:")) soundName = soundName.replace("sound:", "");
            if (item.startsWith("file://")) soundName = soundName.replace("file://", "");
            const customSound = await getSound(fixFileName(soundName));
            if (!customSound) {
                action.reply(invoker, { content: `could not find custom sound \`${fixFileName(soundName)}\``, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: `could not find custom sound \`${fixFileName(soundName)}\``,
                });
            }
            if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) action.reply(invoker, { content: `added \`${customSound.name}\` to the queue`, ephemeral: guild_config.other.use_ephemeral_replies })
            queue.addItem(customSound);
            return;
        }
        let currentContent = `-# routing...`;
        const sent = await action.reply(invoker, {
            components: [
                new TextDisplay({
                    content: currentContent,
                })
            ],
            components_v2: true,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
        if (!sent) return;

        // Fetch info using new downloader system
        let lastLog = "";
        const logFunc = (msg: string) => {
            if (msg && msg !== lastLog && msg.replaceAll("\n", " ").trim().length > 0) {
                lastLog = msg;
                currentContent += `\n-# ${msg.replaceAll("\n", " ").trim()}`;
                action.edit(sent, {
                    components: [
                        new TextDisplay({
                            content: currentContent,
                        })
                    ],
                    components_v2: true,
                    ephemeral: guild_config.other.use_ephemeral_replies,
                });
            }
        };

        const editLatest = (msg: string) => {
            if (msg && msg !== lastLog && msg.replaceAll("\n", " ").trim().length > 0) {
            lastLog = msg;
            // Replace the last line (after the last '\n-# ') with the new message
            const lines = currentContent.split('\n');
            let lastIdx = lines.length - 1;
            // Find the last line that starts with '-# '
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].startsWith('-# ')) {
                lastIdx = i;
                break;
                }
            }
            lines[lastIdx] = `-# ${msg.replaceAll("\n", " ").trim()}`;
            currentContent = lines.join('\n');
            action.edit(sent, {
                components: [
                new TextDisplay({
                    content: currentContent,
                })
                ],
                components_v2: true,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            }
        }

        let media = await fetchMediaInfo(item, logFunc, editLatest);
        if (!media) {
            currentContent += `\nfailed to get media info; no result returned`;
            await action.edit(sent, {
                components: [
                    new TextDisplay({
                        content: currentContent,
                    })
                ],
                components_v2: true,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                error: true,
                message: currentContent,
            });
        }
        queue.addItem(media);
        if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) {
            await action.edit(sent, {
                components: [
                    new TextDisplay({
                        content: currentContent,
                    }),
                    new Container({
                        components: [embedVideoOrSound(media, true)]
                    })
                ],
                components_v2: true,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
        } else {
            await action.deleteMessage(sent as Message<true>);
        }
    }
)

const clear = new Command(
    {
        name: 'clear',
        description: 'clears the queue',
        long_description: 'removes every item from the current queue',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/queue clear",
        aliases: ["empty", "clearqueue"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, args, guild_config, invoker_type }) {
        if (!invoker.guild) {
            action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        const queue = getQueue(invoker.guild);
        if (queue.items.length === 0) {
            action.reply(invoker, { content: "queue is already empty", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        queue.clear();
        if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) action.reply(invoker, { content: "queue cleared", ephemeral: guild_config.other.use_ephemeral_replies })
        // the queue will send a status message saying the queue was cleared, so it doesnt matter if we dont send a message if its in the same exact channel.
    }
);

const viewCommandExecution = async function (input: Omit<CommandInput<{}, Record<string, any>, any, true, any extends InvokerType.Message ? Record<string, any> & {} : { [x: string]: undefined; }>, "enrich">) {
    const { invoker, args, guild_config } = input;
    if (!invoker.guild) {
        action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies })
        return;
    }
    const queue = getQueue(invoker.guild);
    if (queue.items.length === 0) {
        action.reply(invoker, { content: "queue is empty", ephemeral: guild_config.other.use_ephemeral_replies })
        return;
    }
    action.reply(invoker, {
        content: `\`\`\`ansi\n${inspect(queue.items, { colors: true, depth: 3 })}\n\`\`\``,
        ephemeral: guild_config.other.use_ephemeral_replies,
    })
}

const viewCommand = new Command(
    {
        name: 'view',
        description: 'views the current queue',
        long_description: 'views the current queue; can be a video, playlist, or custom sound',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/queue view",
        aliases: ["list", "show", "l"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    viewCommandExecution
);

const command = new Command(
    {
        name: 'queue',
        description: 'description',
        long_description: 'description',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [viewCommand, add, play, stop, clear, skip, previous, remove, swap, shuffle, silence],
        },
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/queue view",
        aliases: ["q", "songlist"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute (input) {
        const { invoker, args, guild_config } = input;
        const subcommand = args.subcommand;
        if (subcommand) {
            action.reply(invoker, `subcommand ${subcommand} doesn't exist`);
            return new CommandResponse({
                error: true,
                message: `subcommand ${subcommand} doesn't exist`,
            });
        }
        if (!invoker.guild) {
            action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }
        viewCommandExecution(input);
    }
);

export default command;