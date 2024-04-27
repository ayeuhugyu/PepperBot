import * as action from "../lib/discord_action.js";
import default_embed from "../lib/default_embed.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
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
} from "discord.js";
import * as log from "../lib/log.js";
import { google } from "googleapis";
const youtube = google.youtube("v3");

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

function isValidYouTubeUrl(url) {
    const pattern = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/;
    return pattern.test(url);
}

async function isExistingVideo(url) {
    try {
        const videoId = await ytdl.getURLVideoID(url);
        const response = await youtube.videos.list({
            auth: process.env.YOUTUBE_API_KEY,
            part: "snippet",
            id: videoId,
        });

        let isExistingVideo;
        if (response) {
            isExistingVideo = true;
        }
        return isExistingVideo;
    } catch (error) {
        return false;
    }
}

async function refresh(queue, interaction, args, embed, row, sentMessage) {
    let text;
    if (queue.queues.length > 0 && queue.readableQueue.length > 0) {
        text = queue.readableQueue.map((item, index) => {
            return `[${index + 1}] - ${item}`;
        });
        if (embed) embed.setDescription(text.join("\n"));
    } else {
        if (!embed) return; // please actually fix this sometime this is NOT a good long term solution
        embed.setDescription("queue is empty");
    }
    action.editMessage(sentMessage, {
        embeds: [embed],
        components: [row],
    });
}

async function queue(queue, interaction, args, embed, row, sentMessage) {
    if (args.get("url")) {
        const input = args.get("url");
        if (!(await isValidYouTubeUrl(input))) {
            action.reply(interaction, {
                content:
                    "the URL you supplied is not a valid youtube URL, please enter an actual youtube URL.",
                ephemeral: true,
            });
            return;
        }
        if (!(await isExistingVideo(input))) {
            action.reply(interaction, {
                content:
                    "that video does not appear to exist, please give me an actual video",
                ephemeral: true,
            });
            return;
        }
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
        .awaitModalSubmit({ filter, time: 60_000 })
        .then(async (interaction) => {
            const input = interaction.fields.getTextInputValue("url");
            if (!(await isValidYouTubeUrl(input))) {
                action.reply(interaction, {
                    content:
                        "the URL you supplied is not a valid youtube URL, please enter an actual youtube URL.",
                    ephemeral: true,
                });
                return;
            }
            if (!(await isExistingVideo(input))) {
                action.reply(interaction, {
                    content:
                        "that video does not appear to exist, please give me an actual video",
                    ephemeral: true,
                });
                return;
            }
            await queue.add(input);
            refresh(queue, interaction, args, embed, row, sentMessage);
            action.reply(interaction, {
                content: "added to queue",
                ephemeral: true,
            });
        })
        .catch(log.error);
}

let queues = {};
const functions = {
    play: async function (queue, interaction) {
        if (queue.state === queueStates.playing) {
            queue.stop();
            interaction.deferUpdate();
            //action.reply(interaction, { content: "stopped", ephemeral: true });
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
            interaction.deferUpdate();
            //action.reply(interaction, { content: "playing", ephemeral: true });
        }
    },
    skip: async function (queue, interaction) {
        queue.next();
        interaction.deferUpdate();
        //action.reply(interaction, { content: "skipped", ephemeral: true });
    },
    clear: async function (queue, interaction, args, embed, row, sentMessage) {
        queue.clear();
        refresh(queue, interaction, args, embed, row, sentMessage);
        interaction.deferUpdate();
        //action.reply(interaction, { content: "cleared", ephemeral: true });
    },
    add: queue,
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
        functions.add(queue, message, args);
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
            { name: "add", value: "queue" },
            { name: "skip", value: "skip" },
            { name: "clear", value: "clear" },
            { name: "play", value: "play" }
        )
);
data.addStringOption((option) =>
    option
        .setName("url")
        .setDescription(
            "url to add/remove from the queue (if using add/remove method)"
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
        let text;
        if (queue.queues.length > 0 && queue.readableQueue.length > 0) {
            text = queue.readableQueue.map((item, index) => {
                return `[${index + 1}] - ${item}`;
            });
            embed.setDescription(text.join("\n"));
        } else {
            embed.setDescription("queue is empty");
        }

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
        const add = new ButtonBuilder()
            .setLabel("📥 Add")
            .setStyle(ButtonStyle.Success)
            .setCustomId("queue");
        const row = new ActionRowBuilder().addComponents(
            play,
            skip,
            clear,
            add
        );
        const sentMessage = await action.reply(message, {
            embeds: [embed],
            components: [row],
        });
        const collector = sentMessage.createMessageComponentCollector({
            time: 240_000,
        });
        collector.on("collect", async (interaction) => {
            if (functions[interaction.customId]) {
                functions[interaction.customId](
                    queue,
                    interaction,
                    args,
                    embed,
                    row,
                    sentMessage
                );
            } else {
                action.reply(interaction, {
                    content:
                        "how the hell did you manage to press an invalid button what the hell 😭😭😭",
                    ephemeral: true,
                });
            }
        });
    }
);

export default command;
