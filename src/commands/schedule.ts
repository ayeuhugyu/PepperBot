import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse, FormattedCommandInteraction } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../lib/classes/command_enums";
import { Button, ButtonStyle, Container, Section, Separator, TextDisplay, ActionRow, TextInput, StringSelect } from "../lib/classes/components";
import { ScheduledEvent, ScheduledEventType, scheduleEvent, fetchScheduledEventsByCreatorId } from "../lib/schedule_manager";
import { TextInputStyle } from "discord.js";
import { randomId } from "../lib/id";

function embedEvent(event: ScheduledEvent, disabled: boolean = false) {
    const dateIsValid = event.time && !isNaN(new Date(event.time).getTime());
    return new Container({
        components: [
            new TextDisplay({
                content: `Editing scheduled event \`${event.id}\` for <@${event.creator_id}>`
            }),
            new Separator(),
            new Section({
                components: [
                    new TextDisplay({
                        content: `at what time should your message be sent?${dateIsValid ? `\nit is currently set to occur at <t:${Math.floor(event.time.getTime() / 1000)}:F> (<t:${Math.floor(event.time.getTime() / 1000)}:R>)` : ""}`
                    }),
                ],
                accessory: new Button({
                    style: ButtonStyle.Success,
                    label: `select a date`,
                    custom_id: `schedule_date`,
                    disabled: disabled
                })
            }),
            new Separator(),
            new Section({
                components: [
                    new TextDisplay({
                        content: `where should your message be sent? (click to toggle)`
                    })
                ],
                accessory: event.type === ScheduledEventType.dm ? new Button({
                    style: ButtonStyle.Primary,
                    label: `in your DMs`,
                    custom_id: `schedule_dm`
                }) : new Button({
                    style: ButtonStyle.Secondary,
                    label: `in this channel`,
                    custom_id: `schedule_channel`,
                    disabled: disabled
                })
            }),
            new Separator(),
            new Section({
                components: [
                    new TextDisplay({
                        content: `what should your message say?` + `${event.content ? `\nit currently says:\n${event.content}` : ""}`
                    })
                ],
                accessory: new Button({
                    style: ButtonStyle.Primary,
                    label: `edit message`,
                    custom_id: `schedule_message`,
                    disabled: disabled
                })
            }),
        ]
    });
}

const command = new Command(
    {
        name: 'schedule',
        description: 'allows you to schedule a message to be sent at a later time',
        long_description: 'allows you to schedule reminders and other messages to be sent at a later time. you can set the time, channel, and message content. you can also edit the message content and time after creating the event.',
        tags: [CommandTag.Utility],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'content',
                description: 'the message to be sent; use "list" to see currently scheduled events',
                long_description: 'the message to be sent; use "list" to see currently scheduled events.',
                type: CommandOptionType.String,
                required: true
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/schedule do something",
        aliases: ["remind", "remindme"],
        argument_order: "<content>",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["content"]),
    async function execute ({ invoker, args, guild_config }) {
        if (args.content === "list") {
            const events = await fetchScheduledEventsByCreatorId(invoker.author.id);
            if (events.length === 0) {
                action.reply(invoker, {
                    content: `you have no scheduled events`,
                    ephemeral: guild_config.other.use_ephemeral_replies
                });
                return new CommandResponse({
                    error: true,
                    message: `no scheduled events`
                });
            }
            const eventList = events.map(event => `- \`${event.id}\` at <t:${Math.floor(event.time.getTime() / 1000)}:F> (<t:${Math.floor(event.time.getTime() / 1000)}:R>): \n${event.content}`).join("\n");
            action.reply(invoker, {
                content: `your scheduled events:\n${eventList}`,
                ephemeral: guild_config.other.use_ephemeral_replies
            });
            return new CommandResponse({});
        }

        const scheduledId = randomId();
        const event = new ScheduledEvent({
            id: scheduledId,
            creator_id: invoker.author.id,
            channel_id: undefined,
            content: args.content,
            time: "undefined",
            type: "send"
        });
        const embed = embedEvent(event);
        const finalizeRow = new ActionRow({
            components: [
                new Button({
                    style: ButtonStyle.Success,
                    label: `click to finalize`,
                    custom_id: `schedule_finalize`
                })
            ]
        })
        const disabledFinalizeRow = new ActionRow({
            components: [
                new Button({
                    style: ButtonStyle.Secondary,
                    label: `click to finalize`,
                    custom_id: `schedule_finalize`,
                    disabled: true
                })
            ]
        })
        const sent = await action.reply(invoker, {
            components: [embed, finalizeRow],
            components_v2: true,
            ephemeral: guild_config.other.use_ephemeral_replies
        });
        if (!sent) return; // this should realistically never happen

        const collector = sent.createMessageComponentCollector({
            filter: () => true,
            time: 20 * 60 * 1000, // 20 minutes? might need to be longer
        });

        collector.on('end', async () => {
            console.log("collector ended");
            action.edit(sent, {
                components: [
                    new TextDisplay({
                        content: `event creation timed out`
                    }),
                    embedEvent(event, true),
                    disabledFinalizeRow
                ],
                ephemeral: guild_config.other.use_ephemeral_replies
            }).catch(() => {});
        });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== invoker.author.id) {
                return interaction.reply({
                    content: `this is not your event!`,
                    ephemeral: true
                });
            }
            (interaction as unknown as FormattedCommandInteraction).author = interaction.user;

            switch (interaction.customId) {
                case 'schedule_dm':
                    event.type = ScheduledEventType.send;
                    event.channel_id = invoker.channel?.id;
                    interaction.deferUpdate();
                    action.edit(sent, {
                        components: [embedEvent(event), finalizeRow],
                        components_v2: true,
                        ephemeral: guild_config.other.use_ephemeral_replies
                    });
                    break;
                case 'schedule_channel':
                    event.type = ScheduledEventType.dm;
                    interaction.deferUpdate();
                    action.edit(sent, {
                        components: [embedEvent(event), finalizeRow],
                        components_v2: true,
                        ephemeral: guild_config.other.use_ephemeral_replies
                    });
                    break;
                case 'schedule_date':
                    await interaction.showModal({
                        title: 'Select Date & Timezone',
                        custom_id: 'schedule_date_modal',
                        components: [
                            new ActionRow({
                                components: [
                                    new TextInput({
                                        label: 'Enter a time (e.g., YYYY-MM-DD HH:MM:SS)',
                                        custom_id: 'date_input',
                                        style: TextInputStyle.Short,
                                        required: true
                                    })
                                ]
                            }) as any,
                            new ActionRow({
                                components: [
                                    new TextInput({
                                        label: 'Enter GMT offset (e.g., +2, -5, 0)',
                                        custom_id: 'gmt_offset_input',
                                        style: TextInputStyle.Short,
                                        required: true,
                                        placeholder: '0'
                                    })
                                ]
                            }) as any
                        ]
                    });
                    let submitted = await interaction.awaitModalSubmit({ time: 2 * 60 * 1000 });
                    (submitted as unknown as FormattedCommandInteraction).author = submitted.user;
                    Object.assign(submitted, { author: submitted.user });
                    if (submitted.customId == 'schedule_date_modal') {
                        const dateInput = submitted.fields.getTextInputValue('date_input');
                        const gmtOffsetInput = submitted.fields.getTextInputValue('gmt_offset_input').replace(/[^0-9-]/g, "");
                        const verificationDate = new Date(dateInput);
                        let gmtOffset = Number(gmtOffsetInput);
                        if (isNaN(verificationDate.getTime())) {
                            action.reply(submitted as unknown as FormattedCommandInteraction, {
                                content: `please enter a valid date; \`${dateInput}\` is not valid. for example, use \`2025-10-01 24:00:00\`, a unix timestamp, or a date string like \`October 1, 2025\``,
                                ephemeral: true
                            });
                            return;
                        }
                        if (isNaN(gmtOffset) || gmtOffset < -12 || gmtOffset > 14) {
                            action.reply(submitted as unknown as FormattedCommandInteraction, {
                                content: `please enter a valid GMT offset between -12 and +14. you entered: \`${gmtOffsetInput}\`. some common offsets are:\n- GMT-5 (EST)\nGMT-7 (PST)\n- GMT+0 (UTC)\n- GMT+1 (CET)\n- GMT+2 (EET)\n- GMT+3 (MSK)\n- GMT+8 (SGT)\n- GMT+9 (JST)\n- GMT+10 (AEDT)`,
                                ephemeral: true
                            });
                            return;
                        }
                        // Offset the date by the GMT offset (in hours)
                        // User input is local time in their GMT offset, so convert to UTC
                        // Parse the date input as if it's in the user's GMT offset, then convert to UTC
                        const [datePart, timePart] = dateInput.split(" ");
                        let [year, month, day] = datePart.split("-").map(Number);
                        let [hour = 0, minute = 0, second = 0] = (timePart ? timePart.split(":") : []).map(Number);

                        // If month is 1-based (e.g., "2025-10-01"), subtract 1 for JS Date
                        month = (month || 1) - 1;

                        // Construct a Date object as if it's in the user's local time (their GMT offset)
                        const localDate = new Date(Date.UTC(year, month, day, hour, minute, second));

                        // Now, subtract the GMT offset to get the correct UTC time
                        localDate.setUTCHours(localDate.getUTCHours() - gmtOffset);

                        const date = localDate;

                        event.time = date;
                        event.channel_id = invoker.channel?.id;
                        action.edit(sent, {
                            components: [embedEvent(event), finalizeRow],
                            components_v2: true,
                            ephemeral: guild_config.other.use_ephemeral_replies
                        });
                        action.reply(submitted as unknown as FormattedCommandInteraction, {
                            content: `date set to <t:${Math.floor(date.getTime() / 1000)}:F> (<t:${Math.floor(date.getTime() / 1000)}:R>) (GMT${gmtOffset >= 0 ? "+" : ""}${gmtOffset}). **if this appears incorrect, please try some of the following:**\n- convert to 24hr time\n- add a seconds place in your time part, ex. YYYY-MM-DD 12:00:00n\n- make sure to use MONTH THEN DAY, not the other way around.\n- check the gmt offset you entered\n- use a unix timestamp (search up a timestamp converter, if what you find asks for a timezone use GMT+0 in here. if what you find asks for a unit of time, use miliseconds)\nhere's what you entered: \`${dateInput}\` (GMT${gmtOffset})`,
                            ephemeral: true
                        });
                    }
                    break;
                case 'schedule_message':
                    interaction.showModal({
                        title: 'Edit Message',
                        custom_id: 'schedule_message_modal',
                        components: [
                            new ActionRow({
                                components: [
                                    new TextInput({
                                        label: 'Enter your message',
                                        custom_id: 'message_input',
                                        style: TextInputStyle.Paragraph,
                                        required: true
                                    })
                                ]
                            }) as any
                        ]
                    });
                    const submittedMessage = await interaction.awaitModalSubmit({ time: 2 * 60 * 1000 });
                    (submittedMessage as unknown as FormattedCommandInteraction).author = submittedMessage.user;
                    if (submittedMessage.customId == 'schedule_message_modal') {
                        const messageInput = submittedMessage.fields.getTextInputValue('message_input');
                        event.content = messageInput;
                        action.edit(sent, {
                            components: [embedEvent(event), finalizeRow],
                            components_v2: true,
                            ephemeral: guild_config.other.use_ephemeral_replies
                        });
                        action.reply(submittedMessage as unknown as FormattedCommandInteraction, {
                            content: `message set to \`${messageInput}\``,
                            ephemeral: true
                        });
                    }
                    break;
                case 'schedule_finalize':
                    if (!event.content) {
                        action.reply(interaction as unknown as FormattedCommandInteraction, {
                            content: `please set a message`,
                            ephemeral: true
                        });
                        return;
                    }
                    if (!event.time || isNaN(new Date(event.time).getTime())) {
                        action.reply(interaction as unknown as FormattedCommandInteraction, {
                            content: `please set a valid time`,
                            ephemeral: true
                        });
                        return;
                    }
                    await event.write();
                    await scheduleEvent(interaction.client, event);
                    action.edit(sent, {
                        components: [
                            new TextDisplay({
                                content: `event \`${event.id}\` scheduled; you will ${event.type === ScheduledEventType.dm ? "be sent a DM to notify you" : "be mentioned in this channel to notify you"} <t:${Math.floor(event.time.getTime() / 1000)}:R> (<t:${Math.floor(event.time.getTime() / 1000)}:F>)`
                            }),
                        ]
                    });
                    break;
            }
        })
    }
);

export default command;