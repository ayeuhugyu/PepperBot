import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import { getCurrentUpdateNumber, getUpdate, Update, writeUpdate } from "../lib/update_manager";
import { ActionRow, Button, ButtonStyle, Container, ContainerComponent, Separator, TextDisplay } from "../lib/classes/components";
import { ButtonInteraction } from "discord.js";
import { Message } from "discord.js";
import { textToAttachment } from "../lib/attachment_manager";
import PagedMenu from "../lib/classes/pagination_v2";

interface EmbedError {
    message: string;
    erroredSection?: string;
}

function embedOldUpdate(update: Update): Container[] {
    // automatically attempt to split the update:
    //   search for titles of each section which are usually sorrounded by **
    //   if can't be found, split by \n and attempt to add each section until 4000 characters is reached, then split to the next container.
    //   unfortunately we can't use $SPLIT_EMBED$ because that is only for the new system.
    const titleRegex = /\*\*(.*?)\*\*/g;
    const sections: Container[] = [];
    let currentSection: ContainerComponent[] = [];
    let currentLength = 0;
    let lastTitle: string | null = null;
    const splitSections = update.text.split("\n");
    for (const line of splitSections) {
        const titleMatch = line.match(titleRegex);
        if (titleMatch) {
            // If we have a title, we need to start a new section
            if (currentSection.length > 0) {
                sections.push(new Container({ components: currentSection }));
                currentSection = [];
                currentLength = 0;
            }
            lastTitle = titleMatch[1];
        }
        const textDisplay = new TextDisplay({ content: line });
        currentSection.push(textDisplay);
        currentLength += line.length;
        if (currentLength > 4000) {
            sections.push(new Container({ components: currentSection }));
            currentSection = [];
            currentLength = 0;
        }
    }
    if (currentSection.length > 0) {
        sections.push(new Container({ components: currentSection }));
    }
    return sections;
}

function embedUpdate(update: Update): Container[] | EmbedError {
    if (update.usesOldSystem) {
        return embedOldUpdate(update);
    }
    const updateSegments = update.text.split("$SPLIT_EMBED$");
    const largeSegment = updateSegments.find(segment => segment.length > 4000);
    if (largeSegment) {
        return {
            message: `embed segment ${updateSegments.indexOf(largeSegment) + 1} exceeds character limit`,
            erroredSection: largeSegment
        };
    }
    const embeds: Container[] = [];
    for (const segment of updateSegments) {
        const splitSegments = segment.split("$SPLIT$");
        let components: ContainerComponent[] = [];
        splitSegments.forEach((subSegment, index) => {
            const isLast = index === splitSegments.length - 1;
            components.push(new TextDisplay({
                content: subSegment.trim()
            }));
            if (!isLast) components.push(new Separator());
        });
        embeds.push(new Container({ components }));
    }
    return embeds;
}

const get = new Command(
    {
        name: 'get',
        description: 'fetches an update by ID or latest',
        long_description: 'fetches a specific update by its ID, or the latest update if "latest" is provided.',
        tags: [CommandTag.Utility],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'id',
                description: 'the update ID or "latest"',
                long_description: 'the update ID to fetch, or "latest" for the most recent update',
                type: CommandOptionType.String,
                required: true
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: 'p/update get latest',
        aliases: ["preview", "show", "fetch"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["id"]),
    async function execute ({ invoker, args, guild_config }) {
        let update: Update | undefined;
        if (!args.id) {
            action.reply(invoker, {
                content: 'you must provide an update ID or "latest"',
                ephemeral: guild_config.other.use_ephemeral_replies
            });
            return;
        }
        if (args.id.toLowerCase() === 'latest') {
            const latestId = await getCurrentUpdateNumber();
            update = await getUpdate(latestId);
        } else {
            const idNum = parseInt(args.id, 10);
            if (isNaN(idNum)) {
                action.reply(invoker, {
                    content: `invalid update ID: \`${args.id}\`. try anything between 1 and ${await getCurrentUpdateNumber()}`,
                    ephemeral: guild_config.other.use_ephemeral_replies
                });
                return;
            }
            update = await getUpdate(idNum);
        }
        if (!update) {
            action.reply(invoker, {
                content: `no update found for ID \`${args.id}\`. try anything between 1 and ${await getCurrentUpdateNumber()}`,
                ephemeral: guild_config.other.use_ephemeral_replies
            });
            return;
        }
        const embedsOrError = embedUpdate(update);
        if (Array.isArray(embedsOrError)) {
            if (embedsOrError.length === 0) {
                action.reply(invoker, {
                    content: 'No content in this update.',
                    ephemeral: guild_config.other.use_ephemeral_replies
                });
                return;
            }
            // Use V2PagedMenu to cycle through each embed
            const pages = embedsOrError.map(embed => [embed]);
            const menu = new PagedMenu(pages);
            const msg = await action.reply(invoker, {
                components: [...pages[0], menu.getActionRow()],
                components_v2: true,
                ephemeral: true,
            });
            if (!msg) return;
            menu.setActiveMessage(msg as Message);
        } else {
            const file = textToAttachment(embedsOrError.erroredSection ?? "?", "error_section.txt")
            action.reply(invoker, {
                content: `error displaying update: ${embedsOrError.message}`,
                files: [file],
                ephemeral: guild_config.other.use_ephemeral_replies
            });
        }
    }
);

const send = new Command(
    {
        name: 'send',
        description: 'sends an update',
        long_description: 'sends an update',
        tags: [CommandTag.Utility, CommandTag.Management, CommandTag.WhitelistOnly],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'id',
                description: 'the ID of the update to send',
                long_description: 'the ID of the update to send (or "latest" for the most recent update)',
                type: CommandOptionType.String,
                required: true
            })
        ],
        access: CommandAccessTemplates.dev_only,
        input_types: [InvokerType.Message],
        example_usage: "p/update send latest",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["id"]),
    async function execute ({ invoker, args, guild_config }) {
        let id = args.id;
        if (!id) {
            action.reply(invoker, {
                content: 'you must provide an update ID or "latest"',
                ephemeral: guild_config.other.use_ephemeral_replies
            });
            return;
        }
        if (id.toLowerCase() === 'latest') {
            const latestId = await getCurrentUpdateNumber();
            id = latestId.toString();
        }

        const update = await getUpdate(parseInt(id));
        if (!update) {
            action.reply(invoker, {
                content: `no update found for ID \`${id}\``,
                ephemeral: guild_config.other.use_ephemeral_replies
            });
            return;
        }
        const embedsOrError = embedUpdate(update);
        if (Array.isArray(embedsOrError)) {
            if (embedsOrError.length === 0) {
                action.reply(invoker, {
                    content: 'No content in this update.',
                    ephemeral: guild_config.other.use_ephemeral_replies
                });
                return;
            }
            const channel = await invoker.client.channels.fetch(process.env.IS_DEV?.toLowerCase() === "true" ? "1213676236929236994" : "1171660137946157146")
            if (!channel || !channel.isTextBased()) {
                action.reply(invoker, {
                    content: 'the update channel is not a text channel',
                    ephemeral: guild_config.other.use_ephemeral_replies
                });
                return;
            }
            let sentMessage = undefined;
            if (update.major) {
                sentMessage = await action.send(channel as action.SendableChannel, {
                    content: `PepperBot Major Update ${update.id} <@&${process.env.IS_DEV?.toLowerCase() === "true" ? "role" : "1210034891018993755"}>`,
                    allowPings: true,
                });
            } else {
                sentMessage = await action.send(channel as action.SendableChannel, {
                    content: `PepperBot Minor Update / Patch ${update.id}`,
                });
            }
            for (const embed of embedsOrError) {
                console.log(embed);
                await action.send(channel as action.SendableChannel, {
                    components: [embed],
                    components_v2: true,
                });
            }
            update.message_id = sentMessage?.id ?? "0"; // this should never happen
            update.timestamp = new Date();
            await writeUpdate(update);

            action.reply(invoker, {
                content: `update ${update.id} sent successfully and new data was written to db`,
                ephemeral: guild_config.other.use_ephemeral_replies
            });
        } else {
            const file = textToAttachment(embedsOrError.erroredSection ?? "?", "error_section.txt");
            action.reply(invoker, {
                content: `error displaying update: ${embedsOrError.message}`,
                files: [file],
                ephemeral: guild_config.other.use_ephemeral_replies
            });
        }
    }
);

const create = new Command(
    {
        name: 'create',
        description: 'creates a new update',
        long_description: 'creates a new update',
        tags: [CommandTag.Utility, CommandTag.Management, CommandTag.WhitelistOnly],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'text',
                description: 'the description of the update',
                long_description: 'the description of the update',
                type: CommandOptionType.String,
                required: true
            })
        ],
        access: CommandAccessTemplates.dev_only,
        input_types: [InvokerType.Message],
        example_usage: "p/update create changed some stuff",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["text"]),
    async function execute ({ invoker, args, guild_config }) {
        let text = args.text?.trim();
        if (invoker.attachments.size > 0 && invoker.attachments.first()) {
            const attachment = invoker.attachments.first();
            const content = await fetch(attachment!.url)
                .then(res => res.text())
                .catch(() => undefined);
            if (content) {
                text = content.trim();
            }
        }
        if (!text) {
            action.reply(invoker, {
                content: "you must provide a description for the update",
                ephemeral: guild_config.other.use_ephemeral_replies
            });
            return;
        }
        const update = new Update({
            update: (await getCurrentUpdateNumber()) + 1,
            text: text
        });
        const inquiryMessage = await action.reply(invoker, {
            content: `is this a major update?`,
            components: [new ActionRow({
                components: [
                    new Button({
                        style: ButtonStyle.Success,
                        label: "Yes",
                        custom_id: "update_major_yes"
                    }),
                    new Button({
                        style: ButtonStyle.Danger,
                        label: "No",
                        custom_id: "update_major_no"
                    })
                ]
            })]
        });
        if (!inquiryMessage) return;
        const collector = inquiryMessage.createMessageComponentCollector({
            filter: (i) => i.user.id === invoker.author.id && (i.customId === "update_major_yes" || i.customId === "update_major_no"),
            time: 60 * 1000, // 1 minute
            max: 1
        });

        collector.on("collect", async (interaction: ButtonInteraction) => {
            const collectedInteraction = interaction;
            await collectedInteraction.deferUpdate();

            if (collectedInteraction.customId === "update_major_yes") {
                update.major = true;
            }

            const updateOrError = embedUpdate(update);
            if (!Array.isArray(updateOrError)) {
                const file = textToAttachment(updateOrError.erroredSection ?? "?", "error_section.txt")
                action.edit(inquiryMessage, {
                    content: `error creating update: ${updateOrError.message}`,
                    files: [file],
                    ephemeral: guild_config.other.use_ephemeral_replies
                });
                return;
            }
            await writeUpdate(update);
            await action.edit(inquiryMessage, {
                content: `update created with ID \`${update.id}\``,
                components: []
            });
        });
    }
);

const command = new Command(
    {
        name: 'update',
        description: 'manages the bot\'s updates',
        long_description: 'this command allows me (the developer) to add and remove updates to the bot. it also allows you to fetch them.',
        tags: [CommandTag.Utility, CommandTag.Management],
        pipable_to: [CommandTag.TextPipable],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/update get latest",
        aliases: ["updates", "changelog"],
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [create, get, send],
        }
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use \`${guild_config.other.prefix}help update\` for a list of subcommands`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        action.reply(invoker, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: guild_config.other.use_ephemeral_replies
        });
    }
);

export default command;