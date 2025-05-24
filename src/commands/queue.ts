import { GuildMember, Message } from "discord.js";
import { Command, CommandAccess, CommandInput, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import { getQueue, QueueManager, QueueState } from "../lib/music/queue";
import { CustomSound, getSound } from "../lib/custom_sound_manager";
import { fetchMediaInfo } from "../lib/downloaders";
import { embedVideoOrSound } from "../lib/music/embed";
import { Button, ButtonStyle, Container, Separator, TextDisplay, ActionRow } from "../lib/classes/components";
import * as voice from "../lib/classes/voice";
import { inspect } from "util";
import { Video } from "../lib/music/media";
import { fixFileName } from "../lib/attachment_manager";
import PagedMenu from "../lib/classes/pagination_v2";
import * as log from "../lib/log";

function findItemIndexInQueue(queue: QueueManager, search: string): number | undefined {
    // URL search
    const urlItem = queue.items.find((item) => {
        if (item instanceof Video) {
            return item.url.toLowerCase().includes(search.toLowerCase());
        }
    });
    if (urlItem) {
        return queue.items.indexOf(urlItem);
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
    // Index search
    const index = parseInt(search);
    if (!isNaN(index) && index >= 0 && index < queue.items.length) {
        return index - 1; // -1 because the embed they will be reading from will be 1 indexed
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
        example_usage: [
            "p/queue swap 1 2",
            "p/queue swap https://www.youtube.com/watch?v=-J0H5ah1G7A and https://www.youtube.com/watch?v=GxxHToC2qOg",
            "p/queue swap sound:my_sound.mp3 sound:my_other_sound.mp3"
        ],
        argument_order: "<item1> <item2>",
        aliases: ["exchange"]
    },
    function getArguments({ invoker, command_name_used, guild_config }) {
        invoker = invoker as CommandInvoker<InvokerType.Message>;
        const args: Record<string, string | undefined> = {};
        const commandLength = `${guild_config.other.prefix}${command_name_used}`.length;
        let content = invoker.content.slice(commandLength)?.trim();

        // using "and" or "with"
        let andSplit = content.split(/ and | with /);
        if (andSplit.length > 1) {
            args.item1 = andSplit[0].trim();
            args.item2 = andSplit[1].trim();
            return args;
        }
        // using commas
        let commaSplit = content.split(",");
        if (commaSplit.length > 1) {
            args.item1 = commaSplit[0].trim();
            args.item2 = commaSplit[1].trim();
            return args;
        }
        // using spaces
        let spaceSplit = content.split(" ");
        if (spaceSplit.length > 1) {
            args.item1 = spaceSplit[0].trim();
            args.item2 = spaceSplit[1].trim();
            return args;
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
        long_description: 'skips the current item in the queue; can be a video, playlist, or custom sound. You can also use "to <item>" to skip directly to a specific item.',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'amount',
                description: 'the amount of items to skip, or "to <item>" to skip to a specific item',
                long_description: 'the amount of items to skip; defaults to 1. You can also use "to <item>" to skip directly to a specific item.',
                type: CommandOptionType.String,
                required: false
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: [
            "p/queue skip",
            "p/queue skip 2",
            "p/queue skip to 5",
            "p/queue skip to sound:mysound"
        ],
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
        let amountArg = args.amount || "1";
        if (typeof amountArg === "string" && amountArg.trim().toLowerCase().startsWith("to")) {
            // skip to a specific item
            let itemStr = amountArg.replace("to ", "").trim();
            if (!itemStr) {
                action.reply(invoker, { content: "please specify an item to skip to", ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: "please specify an item to skip to",
                });
            }
            const index = findItemIndexInQueue(queue, itemStr);
            if (index === undefined) {
                action.reply(invoker, { content: `could not find item \`${itemStr}\` in the queue`, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: `could not find item \`${itemStr}\` in the queue`,
                });
            }
            // skip to index (index is 0-based, queue.currentIndex is 0-based)
            const skipAmount = index - queue.currentIndex;
            if (skipAmount === 0) { // skipping negative amounts is actually fine
                action.reply(invoker, { content: `item \`${itemStr}\` the current item`, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: `item \`${itemStr}\` is the current item`,
                });
            }
            if (skipAmount > 0) {
                queue.next(skipAmount);
            } else {
                queue.previous(-skipAmount); // negative skipAmount because the function re-negates it
            }
            if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) {
                action.reply(invoker, { content: `skipped to \`${itemStr}\``, ephemeral: guild_config.other.use_ephemeral_replies });
            }
            return;
        }
        const amount = parseInt(amountArg);
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
        description: 'removes an item or a range of items from the queue',
        long_description: 'removes an item or a range of items from the queue; can be a video, playlist, or custom sound. You can specify a range using "to", "-", "through", or "between ... and ...". "between" will only remove items strictly between the two specified items.',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'item',
                description: 'the item or range to remove from the queue',
                long_description: 'the item or range to remove from the queue; can be a video, playlist, or custom sound (using file://soundname or sound:soundname), or a range like "1 to 10", "sound:my_sound.mp3 - 10", or "between 1 and 3".',
                type: CommandOptionType.String,
                required: true
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: [
            "p/queue remove 1",
            "p/queue remove https://www.youtube.com/watch?v=ABS-mlep5rY",
            "p/queue remove sound:my_sound.mp3",
            "p/queue remove 1 to 5",
            "p/queue remove Unexpectancy, Pt. 1 through It's Pizza Time!",
            "p/queue remove sound:my_sound.mp3 - 10",
            "p/queue remove between 1 and 3"
        ],
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

        // Check for "between ... and ..." syntax
        let between = false;
        let startStr: string | undefined, endStr: string | undefined;
        let betweenMatch = item.match(/between\s+(.+?)\s+and\s+(.+)/i);
        let rangeMatch = null;
        if (betweenMatch) {
            between = true;
            startStr = betweenMatch[1].trim();
            endStr = betweenMatch[2].trim();
        } else {
            // Check for range syntax: "A to B" or "A - B" or "A through B"
            rangeMatch = item.match(/^(.+?)(?:\s*(?:to|through|-)\s*)(.+)$/i);
            if (rangeMatch) {
                startStr = rangeMatch[1].trim();
                endStr = rangeMatch[2].trim();
            }
        }

        if (between || rangeMatch) {
            const startIdx = findItemIndexInQueue(queue, startStr!);
            const endIdx = findItemIndexInQueue(queue, endStr!);

            if (startIdx === undefined || endIdx === undefined) {
                action.reply(invoker, { content: `could not find item(s) \`${startStr}\` or \`${endStr}\` in the queue, try using the index listed next to it using \`${guild_config.other.prefix}queue view\`.`, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: `could not find item(s) \`${startStr}\` or \`${endStr}\` in the queue, try using the index listed next to it using \`${guild_config.other.prefix}queue view\`.`,
                });
            }

            let min = Math.min(startIdx, endIdx);
            let max = Math.max(startIdx, endIdx);

            if (between) {
                min = min + 1;
                max = max - 1;
                if (min > max) {
                    action.reply(invoker, { content: `no items found strictly between \`${startStr}\` and \`${endStr}\` in the queue.`, ephemeral: guild_config.other.use_ephemeral_replies });
                    return new CommandResponse({
                        error: true,
                        message: `no items found strictly between \`${startStr}\` and \`${endStr}\` in the queue.`,
                    });
                }
                queue.removeItem(min, max);
                if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) {
                    action.reply(invoker, { content: `removed items strictly between \`${startStr}\` and \`${endStr}\` from the queue`, ephemeral: guild_config.other.use_ephemeral_replies });
                }
                return;
            } else {
                queue.removeItem(min, max);
                if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) {
                    action.reply(invoker, { content: `removed items from \`${startStr}\` to \`${endStr}\` from the queue`, ephemeral: guild_config.other.use_ephemeral_replies });
                }
                return;
            }
        }

        // Single item removal
        const index = findItemIndexInQueue(queue, item);
        if (index === undefined) {
            action.reply(invoker, { content: `could not find item \`${item}\` in the queue, try just using the index listed next to it using \`${guild_config.other.prefix}queue view\`.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `could not find item \`${item}\` in the queue, try just using the index listed next to it using \`${guild_config.other.prefix}queue view\`.`,
            });
        }
        queue.removeItem(index);
        if (!(queue.channel === invoker.channel) && !(invoker_type === InvokerType.Interaction)) {
            action.reply(invoker, { content: `removed \`${item}\` from the queue`, ephemeral: guild_config.other.use_ephemeral_replies });
        }
    }
)

const play = new Command(
    {
        name: 'play',
        description: 'start the queue',
        long_description: 'starts the queue. if given an index or item, it will start from that item.',
        tags: [CommandTag.Voice, CommandTag.Music],
        pipable_to: [],
        example_usage: [
            "p/queue play",
            "p/queue play 1",
            "p/queue play at sound:my_sound.mp3"
        ],
        argument_order: "<item?>",
        aliases: ["start", "begin"],
        options: [
            new CommandOption({
                name: 'item',
                description: 'the item or index to start the queue from',
                long_description: 'the item or index to start the queue from; can be a number, url, or custom sound name',
                type: CommandOptionType.String,
                required: false
            })
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["item"]),
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

        let itemArg = args.item;
        if (itemArg && typeof itemArg === "string") {
            itemArg = itemArg.replace(/^at\s+/i, "").trim();
            const itemIndex = findItemIndexInQueue(queue, itemArg);
            if (itemIndex !== undefined) {
                queue.currentIndex = itemIndex - 1; // -1 because the embed is 1-indexed
            } else {
                action.reply(invoker, { content: `could not find item \`${itemArg}\` in the queue`, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: `could not find item \`${itemArg}\` in the queue`,
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
        example_usage: [
            "p/queue add https://www.youtube.com/watch?v=ABS-mlep5rY",
            "p/queue add sound:my_sound.mp3",
            "p/queue add <attachment>"
        ],
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

let currentPageInPageManagers: Record<string, number> = {};

const controlButtons = [
    new Button({
        custom_id: "queue_prev_song",
        style: ButtonStyle.Secondary,
        label: "⏮️",
    }),
    new Button({
        custom_id: "queue_stop",
        style: ButtonStyle.Secondary,
        label: "⏹️",
    }),
    new Button({
        custom_id: "queue_play",
        style: ButtonStyle.Secondary,
        label: "▶️",
    }),
    new Button({
        custom_id: "queue_skip_song",
        style: ButtonStyle.Secondary,
        label: "⏭️",
    }),
];

function embedQueue(queue: QueueManager, page?: number) {
    let pages: (Container | ActionRow)[][] = [];
    let currentPage: (ReturnType<typeof embedVideoOrSound> | Separator)[] = []
    let itemsOnPage = 0;
    const itemsPerPage = 3;

    if (queue.items.length === 0) {
        pages = [[new Container({
            components: [
                new TextDisplay({
                    content: "queue is empty",
                })
            ]
        })]]
    } else {
        queue.items.forEach((item, index) => {
            const embed = embedVideoOrSound(item, (queue.state === QueueState.Playing && queue.currentIndex === index), index);
            if (itemsOnPage >= itemsPerPage) {
                pages.push([
                    new Container({
                        components: currentPage
                    }),
                    new ActionRow({
                        components: controlButtons
                    })
                ]);
                currentPage = [];
                itemsOnPage = 0;
            }
            currentPage.push(embed);
            if (index < queue.items.length - 1 && itemsOnPage < itemsPerPage - 1) currentPage.push(new Separator());
            itemsOnPage++;
        });
        if (currentPage.length > 0) {
            pages.push([
                new Container({
                    components: currentPage
                }),
                new ActionRow({
                    components: controlButtons
                })
            ]);
        }
    }

    log.debug(queue, pages)

    const pageManager = new PagedMenu(pages);
    if (typeof page === "number" && page >= 0 && page < pages.length) {
        pageManager.currentPage = page;
    }
    return pageManager;
}

const viewCommandExecution = async function (input: Omit<CommandInput<{}, Record<string, any>, any, true, any extends InvokerType.Message ? Record<string, any> & {} : { [x: string]: undefined; }>, "enrich">) {
    const { invoker, args, guild_config } = input;
    if (!invoker.guild) {
        action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies })
        return;
    }
    const queue = getQueue(invoker.guild);
    const guildId = invoker.guild.id;
    const page = currentPageInPageManagers[guildId] ?? 0;
    let pageManager = embedQueue(queue, page);

    const sent = await action.reply(invoker, {
        components: [...pageManager.pages[pageManager.currentPage ?? 0], pageManager.getActionRow()],
        components_v2: true,
    });
    if (!sent) return;
    pageManager.setActiveMessage(sent as Message<true>);
    const collector = sent.createMessageComponentCollector({
        filter: (i) => {
            return i.customId.startsWith("queue_");
        },
        time: 30 * 60 * 1000,
    });
    collector.on("collect", async (i) => {
        switch (i.customId) {
            case "queue_prev_song":
                queue.previous(1);
                break;
            case "queue_stop":
                queue.stop();
                break;
            case "queue_play":
                queue.play();
                break;
            case "queue_skip_song":
                queue.next(1);
                break;
        }
        await i.deferUpdate();
    });

    // Save current page on page change
    pageManager.onPageChange = (newPage: number) => {
        currentPageInPageManagers[guildId] = newPage;
    };

    // Always remove previous listeners before adding a new one to avoid duplicates
    queue.emitter.removeAllListeners("refresh");
    queue.emitter.on("refresh", async () => {
        const refreshedPage = currentPageInPageManagers[guildId] ?? 0;
        // Stop the old paged menu before creating a new one
        pageManager.stop();
        const refreshedPageManager = embedQueue(queue, refreshedPage);
        if (pageManager.activeMessage) {
            await action.edit(pageManager.activeMessage, {
                components: [
                    ...refreshedPageManager.pages[refreshedPageManager.currentPage ?? 0],
                    refreshedPageManager.getActionRow()
                ],
                components_v2: true,
            });
            // Update page change handler
            refreshedPageManager.setActiveMessage(pageManager.activeMessage as Message<true>);
            refreshedPageManager.onPageChange = (newPage: number) => {
                currentPageInPageManagers[guildId] = newPage;
            };
        }
        // Update the reference to the new page manager
        pageManager = refreshedPageManager;
    });
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