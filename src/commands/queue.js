import * as action from "../lib/discord_action.js";
import default_embed from "../lib/default_embed.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { AdvancedPagedMenuBuilder } from "../lib/types/menuBuilders.js";
import { AudioPlayerQueueManager, queueStates } from "../lib/types/queue.js";
import ytdl from "ytdl-core";
import * as voice from "../lib/voice.js";
import {
    Collection,
    ButtonBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ButtonStyle,
    ButtonInteraction,
} from "discord.js";
import * as log from "../lib/log.js";
import { google } from "googleapis";
const youtube = google.youtube("v3");
import * as globals from "../lib/globals.js";
import process from "node:process";
import fs from "fs";
import * as files from "../lib/files.js";

const config = globals.config;

let queues = {};
let queueEmbeds = {};
let queuePageBuilders = {};

function convertISO8601ToHumanReadable(duration) {
    const match = duration.match(
        /P(?:([0-9]+)D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?/
    );
    const days = parseInt(match[1]) || 0;
    const hours = parseInt(match[2]) || 0;
    const minutes = parseInt(match[3]) || 0;
    const seconds = parseInt(match[4]) || 0;

    // Pad hours, minutes, and seconds with leading zeros if necessary
    const paddedHours = hours.toString().padStart(2, "0");
    const paddedMinutes = minutes.toString().padStart(2, "0");
    const paddedSeconds = seconds.toString().padStart(2, "0");
    let string = ``;
    if (days > 0) {
        string += `${days}:`;
    }
    return string + `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
}

async function getDuration(url) {
    try {
        const videoId = await ytdl.getURLVideoID(url);
        const response = await youtube.videos.list({
            auth: process.env.YOUTUBE_API_KEY,
            part: "contentDetails",
            id: videoId,
        });
        return convertISO8601ToHumanReadable(
            response.data.items[0].contentDetails.duration
        );
    } catch (error) {
        return false;
    }
}

async function refresh(queue, interaction, args, row, sentMessage) {
    let text;
    if (!sentMessage) {
        log.warn("returned from refresh due to sentMessage");
        return;
    }
    if (!interaction) {
        log.warn("returned from refresh due to interaction");
        return;
    }
    const embed = default_embed();
    if (queuePageBuilders[interaction.channel.id]) {
        const builder = queuePageBuilders[interaction.channel.id];
        builder.stop(builder);
    }

    if (queue.queues.length > 0 && queue.readableQueue.length > 0) {
        text = queue.readableQueue.map((item, index) => {
            if (queue.state === "playing" && index === queue.currentIndex) {
                return `**[${index + 1}] - ${item}**`;
            }
            return `[${index + 1}] - ${item}`;
        });
        text = text.join("\n");
        const lines = text.trim().split("\n");
        const chunks = [];

        for (let i = 0; i < lines.length; i += 15) {
            chunks.push(lines.slice(i, i + 15).join("\n"));
        }
        let title = "Queue";
        if (queue.state == "playing") {
            title += ` | Now Playing Song ${queue.currentIndex + 1}`;
            const duration = await getDuration(
                queue.queues[queue.currentIndex]
            );
            if (duration) {
                title += ` | Duration: ${duration}`;
            }
        }
        embed.setTitle(title);
        if (chunks.length > 1 && queue.readableQueue.length > 15) {
            const Menu = new AdvancedPagedMenuBuilder();
            chunks.forEach((chunks, index) => {
                const newEmbed = default_embed();
                newEmbed.setTitle(title);
                newEmbed.setDescription(chunks);
                Menu.full.addPage(newEmbed);
            }); // while this does technically work, its not exactly optimized to say the least, as it creates a new paged menu every time the queue is refreshed, which happens A LOT. this is a temporary solution until i can figure out a better way to do this.
            let components = [];
            if (row && row.components.length > 0) {
                components.push(row);
            }
            components.push(Menu.actionRow);
            sentMessage = await action.editMessage(sentMessage, {
                embeds: [Menu.pages[Menu.currentPage]],
                components: components,
            });
            if (!sentMessage) return;
            await Menu.full.begin(sentMessage, 1200_000, Menu);
            queuePageBuilders[sentMessage.channel.id] = Menu.full;
        } else {
            if (embed) {
                embed.setDescription(text);
                action.editMessage(sentMessage, {
                    embeds: [embed],
                    components: [row],
                });
            }
        }
    } else {
        if (!embed) return;
        embed.setTitle("Queue");
        embed.setDescription("queue is empty");
        if (!sentMessage) return;
        action.editMessage(sentMessage, {
            embeds: [embed],
            components: [row],
        });
    }
}

async function isUsableUrl(url) {
    if (!url) {
        return {
            result: false,
            issue: "no url supplied",
        };
    }
    const pattern = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/;
    const isValidYoutubeUrl = pattern.test(url);
    if (!isValidYoutubeUrl) {
        return {
            result: false,
            issue: "the URL you supplied is not a valid youtube URL, please enter an actual youtube URL.",
        };
    }

    let isExistingVideo;
    let response;
    try {
        const videoId = await ytdl.getURLVideoID(url);
        response = await youtube.videos.list({
            auth: process.env.YOUTUBE_API_KEY,
            part: "snippet,contentDetails",
            id: videoId,
        });
    } catch {
        isExistingVideo = false;
    }
    if (response.data.items[0].snippet.title) {
        isExistingVideo = true;
    }
    if (!isExistingVideo) {
        return {
            result: false,
            issue: "that video does not appear to exist, please give me an actual video",
        };
    }
    try {
        if (
            response.data.items[0].contentDetails.contentRating.ytRating ===
            "ytAgeRestricted"
        ) {
            return {
                result: false,
                issue: "due to current library-related limitations, i am unable to play age restricted videos. try to find a non-age restricted reupload, and try again.",
            };
        }
    } catch (err) {
        log.error(err);
        return {
            result: false,
            issue: "i was unable to determine if the video is age restricted or not, and i would rather avoid an error like this than play the video. find a different video.",
        };
    }
    return {
        result: true,
        issue: undefined,
    };
}

function fixQueueSaveName(name) {
    return name
        .replaceAll(" ", "_")
        .replaceAll("/", "_")
        .replaceAll("\\", "_")
        .replaceAll(":", "_")
        .replaceAll("*", "_")
        .replaceAll("?", "_")
        .replaceAll('"', "_")
        .replaceAll("<", "_")
        .replaceAll(">", "_")
        .replaceAll("|", "_");
}

async function queue(queue, interaction, args, embed, row, sentMessage) {
    if (!interaction) {
        log.warn("returned from add");
        return;
    }
    if (args.get("url")) {
        let input = args.get("url");
        if (input.startsWith("<")) {
            input = input.slice(1);
        }
        if (input.endsWith(">")) {
            input = input.slice(0, -1);
        }
        const urlState = await isUsableUrl(input);
        const isUsable = urlState.result;
        const issue = urlState.issue;
        if (!isUsable && issue) {
            action.reply(interaction, {
                content: issue,
                ephemeral: true,
            });
            return;
        }
        console.log(input);
        await queue.add(input);
        action.reply(interaction, {
            content: "added to queue",
            ephemeral: true,
        });
        return;
    }
    if (!args.get("url") && args.get("isFromMessage")) {
        action.reply(interaction, {
            content: "please supply a url",
            ephemeral: true,
        });
        return;
    }
    const modal = new ModalBuilder();
    modal.setTitle("Add to Queue");
    modal.setCustomId("queue");

    const url = new TextInputBuilder()
        .setPlaceholder("enter a valid youtube URL")
        .setLabel("URL")
        .setStyle(TextInputStyle.Short)
        .setCustomId("url");

    const actionRow = new ActionRowBuilder().addComponents(url);
    modal.addComponents(actionRow);
    interaction.showModal(modal);
    const filter = (interaction) => interaction.customId === "queue";
    interaction
        .awaitModalSubmit({ filter, time: 120_000 })
        .then(async (interaction) => {
            let input = interaction.fields.getTextInputValue("url");
            if (input.startsWith("<")) {
                input = input.slice(1);
            }
            if (input.endsWith(">")) {
                input = input.slice(0, -1);
            }
            const urlState = await isUsableUrl(input);
            const isUsable = urlState.result;
            const issue = urlState.issue;
            if (!isUsable) {
                action.reply(interaction, {
                    content: issue,
                    ephemeral: true,
                });
                return;
            }
            console.log(input);
            await queue.add(input);
            if (!interaction) {
                log.warn("returned from add due to interaction");
                return;
            }
            action.reply(interaction, {
                content: "added to queue",
                ephemeral: true,
            });
        })
        .catch(log.error);
}

const functions = {
    play: async function (queue, interaction) {
        if (!interaction) {
            log.warn("returned from play");
            return;
        }
        if (queue.state === queueStates.playing) {
            queue.stop();
            if (interaction instanceof ButtonInteraction) {
                interaction.deferUpdate();
            }
        } else if (queue.state === (queueStates.idle || queueStates.paused)) {
            if (queue.queues.length == 0) {
                action.reply(interaction, {
                    content: "queue is empty",
                    ephemeral: true,
                });
                return;
            }
            if (!queue.connection) {
                queue.connection = await voice.getVoiceConnection(
                    interaction.guild.id
                );
                if (!queue.connection) {
                    if (interaction.member.voice.channel) {
                        queue.connection = await voice.joinVoiceChannel(
                            interaction.member.voice.channel
                        );
                    }
                }
            }
            if (!queue.connection) {
                action.reply(interaction, {
                    content: "i need to be in a vc to play music",
                    ephemeral: true,
                });
                return;
            }
            queue.connection.on("disconnect", queue.onDisconect);
            queue.connection.on("destroyed", queue.onDisconect);
            queue.play(queue.currentIndex);
            if (interaction instanceof ButtonInteraction) {
                interaction.deferUpdate();
            }
        }
    },
    skip: async function (queue, interaction) {
        if (!interaction) {
            log.warn("returned from stop");
            return;
        }
        queue.next();
        if (interaction instanceof ButtonInteraction) {
            interaction.deferUpdate();
        } else {
            interaction.reply({ content: "skipped", ephemeral: true });
        }
    },
    clear: async function (queue, interaction, args, embed, row, sentMessage) {
        if (!interaction) {
            log.warn("returned from clear");
            return;
        }
        if (!sentMessage) return;
        queue.clear();
        if (interaction instanceof ButtonInteraction) {
            interaction.deferUpdate();
        } else {
            interaction.reply({ content: "cleared", ephemeral: true });
        }
    },
    add: queue,
    remove: async function (queue, interaction, args, embed, row, sentMessage) {
        if (!interaction) {
            log.warn("returned from remove");
            return;
        }
        if (args.get("url")) {
            const input = args.get("url");
            let response = false;
            let readable;
            if (queue.queues[input - 1]) {
                readable = queue.readableQueue[input - 1];
                response = await queue.remove(input - 1);
            } else {
                action.reply(interaction, {
                    content: "invalid index",
                    ephemeral: true,
                });
                return;
            }
            if (!response) {
                action.reply(interaction, {
                    content: "invalid index",
                    ephemeral: true,
                });
                return;
            }
            action.reply(interaction, {
                content: `removed ${readable} from queue`,
                ephemeral: true,
            });
            return;
        }
        if (!args.get("url") && args.get("isFromMessage")) {
            action.reply(interaction, {
                content: "please supply an index",
                ephemeral: true,
            });
            return;
        }

        const modal = new ModalBuilder();
        modal.setTitle("Remove from Queue");
        modal.setCustomId("queue");

        const url = new TextInputBuilder()
            .setPlaceholder("enter a valid index in the queue")
            .setLabel("Index")
            .setStyle(TextInputStyle.Short)
            .setCustomId("url");

        const actionRow = new ActionRowBuilder().addComponents(url);
        modal.addComponents(actionRow);
        interaction.showModal(modal);
        const filter = (interaction) => interaction.customId === "queue";
        interaction
            .awaitModalSubmit({ filter, time: 120_000 })
            .then(async (interaction) => {
                let input = interaction.fields.getTextInputValue("url");
                let response = false;
                let readable;
                if (queue.queues[input - 1]) {
                    readable = queue.readableQueue[input - 1];
                    response = await queue.remove(input - 1);
                } else {
                    action.reply(interaction, {
                        content: "invalid index",
                        ephemeral: true,
                    });
                    return;
                }
                if (!response) {
                    action.reply(interaction, {
                        content: "invalid index",
                        ephemeral: true,
                    });
                    return;
                }
                action.reply(interaction, {
                    content: `removed ${readable} from queue`,
                    ephemeral: true,
                });
            })
            .catch(log.error);
    },
};

const adddata = new SubCommandData();
adddata.setName("add");
adddata.setDescription("adds a url to the queue");
adddata.setPermissions([]);
adddata.setPermissionsReadable("");
adddata.setWhitelist([]);
adddata.setCanRunFromBot(true);
const add = new SubCommand(
    adddata,
    async function getArguments(message) {
        const args = new Collection();
        args.set("url", message.content.split(" ")[1]);
        args.set("isFromMessage", true);
        return args;
    },
    async function execute(message, args, isInteraction) {
        if (isInteraction) args.set("isFromMessage", true);
        if (args.get("index")) args.set("url", args.get("index"));
        let queue = queues[message.guild.id];
        if (!queue) {
            queue = new AudioPlayerQueueManager({
                guild: message.guild.id,
                player: await voice.createAudioPlayer(message.guild.id),
                messageChannel: message.channel,
            });
            queues[message.guild.id] = queue;
        }
        functions.add(queue, message, args);
    }
);

const removedata = new SubCommandData();
removedata.setName("add");
removedata.setDescription("adds a url to the queue");
removedata.setPermissions([]);
removedata.setPermissionsReadable("");
removedata.setWhitelist([]);
removedata.setCanRunFromBot(true);
const remove = new SubCommand(
    removedata,
    async function getArguments(message) {
        const args = new Collection();
        args.set("url", message.content.split(" ")[1]);
        args.set("isFromMessage", true);
        return args;
    },
    async function execute(message, args, isInteraction) {
        if (args.get("index")) args.set("url", args.get("index"));
        if (isInteraction) args.set("isFromMessage", true);
        let queue = queues[message.guild.id];
        if (!queue) {
            queue = new AudioPlayerQueueManager({
                guild: message.guild.id,
                player: await voice.createAudioPlayer(message.guild.id),
                messageChannel: message.channel,
            });
            queues[message.guild.id] = queue;
        }
        functions.remove(queue, message, args);
    }
);

const cleardata = new SubCommandData();
cleardata.setName("clear");
cleardata.setDescription("clears the queue");
cleardata.setPermissions([]);
cleardata.setPermissionsReadable("");
cleardata.setWhitelist([]);
cleardata.setCanRunFromBot(true);
const clear = new SubCommand(
    cleardata,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args) {
        let queue = queues[message.guild.id];
        if (!queue) {
            queue = new AudioPlayerQueueManager({
                guild: message.guild.id,
                player: await voice.createAudioPlayer(message.guild.id),
                messageChannel: message.channel,
            });
            queues[message.guild.id] = queue;
        }
        functions.clear(queue, message);
    }
);

const skipdata = new SubCommandData();
skipdata.setName("skip");
skipdata.setDescription("skips the current song in the queue");
skipdata.setPermissions([]);
skipdata.setPermissionsReadable("");
skipdata.setWhitelist([]);
skipdata.setCanRunFromBot(true);
const skip = new SubCommand(
    skipdata,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args) {
        let queue = queues[message.guild.id];
        if (!queue) {
            queue = new AudioPlayerQueueManager({
                guild: message.guild.id,
                player: await voice.createAudioPlayer(message.guild.id),
                messageChannel: message.channel,
            });
            queues[message.guild.id] = queue;
        }
        functions.skip(queue, message);
    }
);

const playdata = new SubCommandData();
playdata.setName("play");
playdata.setDescription("plays/stops the queue");
playdata.setPermissions([]);
playdata.setPermissionsReadable("");
playdata.setWhitelist([]);
playdata.setCanRunFromBot(true);
const play = new SubCommand(
    playdata,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args) {
        let queue = queues[message.guild.id];
        if (!queue) {
            queue = new AudioPlayerQueueManager({
                guild: message.guild.id,
                player: await voice.createAudioPlayer(message.guild.id),
                messageChannel: message.channel,
            });
            queues[message.guild.id] = queue;
        }
        functions.play(queue, message);
    }
);

const savedata = new SubCommandData();
savedata.setName("save");
savedata.setDescription("saves a list as the given name");
savedata.setPermissions([]);
savedata.setPermissionsReadable("");
savedata.setWhitelist([]);
savedata.setCanRunFromBot(true);
const save = new SubCommand(
    savedata,
    async function getArguments(message) {
        const args = new Collection();
        args.set("name", message.content.split(" ")[1]);
        args.set("isFromMessage", true);
        return args;
    },
    async function execute(message, args, isInteraction) {
        let queue = queues[message.guild.id];
        if (!queue) {
            action.reply(message, "how tf am i gonna save nothing");
            return;
        }
        if (queue.readableQueue.length == 0) {
            action.reply(message, "how tf am i gonna save nothing");
            return;
        }
        if (!args.get("name")) {
            action.reply(message, "what tf am i supposed to save this as");
            return;
        }
        if (args.get("name") == "ls") {
            action.reply(
                message,
                "you can't save a list as ls cuz i use that bucko"
            );
            return;
        }
        queue.save(fixQueueSaveName(args.get("name")));
        action.reply(
            message,
            `saved queue as \`${fixQueueSaveName(args.get("name"))}\``
        );
    }
);

const loaddata = new SubCommandData();
loaddata.setName("load");
loaddata.setDescription("loads a list");
loaddata.setPermissions([]);
loaddata.setPermissionsReadable("");
loaddata.setWhitelist([]);
loaddata.setCanRunFromBot(true);
const load = new SubCommand(
    loaddata,
    async function getArguments(message) {
        const args = new Collection();
        args.set("name", message.content.split(" ")[1]);
        args.set("isFromMessage", true);
        return args;
    },
    async function execute(message, args, isInteraction) {
        const filesArr = fs.readdirSync(`resources/data/queues/`);
        let queue = queues[message.guild.id];
        if (!queue) {
            queue = new AudioPlayerQueueManager({
                guild: message.guild.id,
                player: await voice.createAudioPlayer(message.guild.id),
                messageChannel: message.channel,
            });
            queues[message.guild.id] = queue;
        }
        if (!args.get("name")) {
            action.reply(message, "what tf am i supposed to load");
            return;
        }
        if (args.get("name") == "ls") {
            let text = "";
            for (let file = 0; file < filesArr.length; file++) {
                text += `${filesArr[file].replace(".json", "")}\n`;
            }
            const file = await files.textToFile(text, "queues");
            action.reply(message, {
                content: "here's a list of all the queues",
                files: [
                    {
                        name: "queues.txt",
                        attachment: file,
                    },
                ],
            });
            return;
        }
        if (!filesArr.includes(`${fixQueueSaveName(args.get("name"))}.json`)) {
            action.reply(
                message,
                "that shit aint real, use `p/queue load ls` to list available queues"
            );
            return;
        }
        queue.load(fixQueueSaveName(args.get("name")));
        action.reply(
            message,
            `loaded queue \`${fixQueueSaveName(args.get("name"))}\``
        );
    }
);

const data = new CommandData();
data.setName("queue");
data.setDescription("manage the music queue");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(false);
data.setDMPermission(false);
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("the subcommand to run")
        .setRequired(false)
        .addChoices(
            { name: "add", value: "add" },
            { name: "remove", value: "remove" },
            { name: "skip", value: "skip" },
            { name: "clear", value: "clear" },
            { name: "play", value: "play" }
        )
);
data.addStringOption((option) =>
    option
        .setName("url")
        .setDescription("url to add to the queue (if using add method)")
        .setRequired(false)
);
data.addIntegerOption((option) =>
    option
        .setName("index")
        .setDescription(
            "index to remove from the queue (if using remove method)"
        )
        .setRequired(false)
);

const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set("operation", message.content.split(" ")[1]);
        args.set("_SUBCOMMAND", message.content.split(" ")[1]);
        if (args.get("operation")) {
            args.set(
                "url",
                message.content.slice(
                    config.generic.prefix.length +
                        commandLength +
                        args.get("operation").toString().length +
                        1
                )
            );
        }

        return args;
    },
    async function execute(message, args) {
        let queue = queues[message.guild.id];
        if (!queue) {
            queue = new AudioPlayerQueueManager({
                guild: message.guild.id,
                player: await voice.createAudioPlayer(message.guild.id),
                messageChannel: message.channel,
            });
            queues[message.guild.id] = queue;
        }
        if (args.get("operation") && args.get("operation") !== "view") {
            if (functions[args.get("operation")]) {
                functions[args.get("operation")](queue, message, args);
                return;
            } else {
                action.reply(message, {
                    content: "invalid operation",
                    ephemeral: true,
                });
            }
            return;
        }
        let embed = default_embed(message);
        embed.setTitle("Queue");
        embed.setDescription("loading queue");

        const play = new ButtonBuilder()
            .setLabel("⏯ Play/Stop")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("play");
        const skip = new ButtonBuilder()
            .setLabel("⏭ Skip")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("skip");
        const clear = new ButtonBuilder()
            .setLabel("⭕ Clear")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("clear");
        const remove = new ButtonBuilder()
            .setLabel("❌ Remove")
            .setStyle(ButtonStyle.Danger)
            .setCustomId("remove");
        const add = new ButtonBuilder()
            .setLabel("📥 Add")
            .setStyle(ButtonStyle.Success)
            .setCustomId("add");
        const row = new ActionRowBuilder().addComponents(
            play,
            skip,
            clear,
            remove,
            add
        );
        const sentMessage = await action.reply(message, {
            embeds: [embed],
            components: [row],
        });
        queueEmbeds[message.channel.id] = sentMessage;
        const collector = sentMessage.createMessageComponentCollector({
            time: 1200_000,
        });
        collector.on("collect", async (interaction) => {
            if (!interaction) {
                log.warn("returned from collector");
                return;
            }
            if (functions[interaction.customId]) {
                functions[interaction.customId](
                    queue,
                    interaction,
                    args,
                    embed,
                    row,
                    sentMessage
                );
            } else if (
                !interaction.customId === "next" &&
                !interaction.customId === "previous"
            ) {
                action.reply(interaction, {
                    content:
                        "how the hell did you manage to press an invalid button what the hell 😭😭😭",
                    ephemeral: true,
                });
            }
        });

        function onUpdate() {
            if (queueEmbeds[message.channel.id] !== sentMessage) {
                queue.emitter.off("update", onUpdate);
                return;
            }
            refresh(queue, message, args, row, sentMessage);
        }
        refresh(queue, message, args, row, sentMessage);
        queue.emitter.on("update", onUpdate);
        collector.on("end", () => {
            if (!sentMessage) return;
            row.setComponents([]);
            action.editMessage(sentMessage, {
                content:
                    "to avoid memory leaks, this collector has been stopped. to use the buttons again, run the command again",
                components: [],
            });
        });
    },
    [add, remove, clear, skip, play, save, load]
);

export default command;
