import { Message } from "discord.js";
import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import { getQueue } from "../lib/music/queue";
import { getSound } from "../lib/custom_sound_manager";
import { fetchMediaInfo } from "../lib/downloaders";
import { embedVideoOrSound } from "../lib/music/embed";

const add = new Command(
    {
        name: 'add',
        description: 'adds an item to the queue',
        long_description: 'adds an item to the queue; can be a video, playlist, or custom sound',
        tags: [],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'item',
                description: 'the item to add to the queue',
                long_description: 'the item to add to the queue; can be a video, playlist, or custom sound (using file://soundname or sound:soundname)',
                type: CommandOptionType.String,
                required: true
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "",
        aliases: []
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
        if (!item.startsWith(/https?:\/\//)) {
            let soundName = item;
            if (item.startsWith("sound:")) soundName = soundName.replace("sound:", "");
            if (item.startsWith("file://")) soundName = soundName.replace("file://", "");
            const customSound = await getSound(item);
            if (!customSound) {
                action.reply(invoker, { content: `could not find custom sound \`${item}\``, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: `could not find custom sound \`${item}\``,
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
    }
)

const clear = new Command(
    {
        name: 'clear',
        description: 'clears the queue',
        long_description: 'removes every item from the current queue',
        tags: [],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "",
        aliases: []
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

const command = new Command(
    {
        name: 'queue',
        description: 'description',
        long_description: 'description',
        tags: [],
        pipable_to: [],
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [clear, add]
        },
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {

    }
);

export default command;