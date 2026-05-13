import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import database from "../../lib/data_manager";
import { getConversation, getUsersLatestConversation } from "../../lib/gpt/conversation";
import { ActionRow, Button, ButtonStyle, TextDisplay } from "../../lib/classes/components";
import { promptParameterTypings } from "../../lib/gpt/promptManager";

const subcommand = new Command(
    {
        name: 'manipulate',
        description: 'allows you to configure conversation parameters',
        long_description: 'allows you to configure parameters in a gpt conversation',
        tags: [CommandTag.AI],
        example_usage: "p/conversation manipulate",
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'id',
                description: 'the id of the conversation to configure',
                long_description: 'the id of the conversation to configure, whitelist only. used for debugging/fixing',
                type: CommandOptionType.Boolean,
                required: false,
            }),
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["id"]),
    async function execute ({ invoker, args, guild_config }) {
        const whitelisted = CommandAccessTemplates.dev_only.whitelist.users.includes(invoker.author.id);

        let conversation;
        if (whitelisted && args.id) {
            conversation = await getConversation(args.id, true);
        } else if (args.id) {
            await action.reply(invoker, { content: `you are not whitelisted to see specific conversation ids.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        } else {
            conversation = await getUsersLatestConversation(invoker.author.id, true);
        }

        if (!conversation) {
            await action.reply(invoker, { content: "no conversation found", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }

        // model parameters
        const sent = await action.reply(invoker, {
            components: [
                new TextDisplay({
                    content: "what parameters would you like to configure",
                }),
                new ActionRow({
                    components: [
                        new Button({
                            style: ButtonStyle.Primary,
                            label: "model",
                            custom_id: `configureModelParameters`,
                        }),
                        new Button({
                            style: ButtonStyle.Secondary,
                            label: "other",
                            custom_id: `configurePromptParameters`,
                        }),
                    ]
                })
            ]
        });

        if (!sent) return;

        const refreshModelParameters = async () => {
            await action.edit(sent, {
                components: [
                    new TextDisplay({
                        content: `which model parameter would you like to configure?\ncurrent values:\n\`\`\`json\n${JSON.stringify(conversation.getModelParameters(), null, 4)}\n\`\`\``,
                    }),
                    new ActionRow({
                        components: [
                            ...Object.values(conversation.model.parameters).map((p, i) => {
                                return new Button({
                                    custom_id: `edit_model_${p.key}`,
                                    label: p.key,
                                    style: (i % 2 == 0) ? ButtonStyle.Primary : ButtonStyle.Secondary,
                                });
                            })
                        ]
                    })
                ]
            });
        }

        const refreshPromptParameters = async () => {
            await action.edit(sent, {
                components: [
                    new TextDisplay({
                        content: `which prompt parameter would you like to configure?\ncurrent values:\n\`\`\`json\n${JSON.stringify(conversation.getPromptParameters(), null, 4)}\n\`\`\``,
                    }),
                    new ActionRow({
                        components: [
                            ...Object.values(promptParameterTypings).map((p, i) => {
                                return new Button({
                                    custom_id: `edit_prompt_${p.key}`,
                                    label: p.key,
                                    style: (i % 2 == 0) ? ButtonStyle.Primary : ButtonStyle.Secondary,
                                });
                            })
                        ]
                    })
                ]
            });
        }

        const collector = sent.createMessageComponentCollector({ filter: (c) => c.user.id === invoker.author.id, time: 15_000 });
        collector.on("collect", async (interaction) => {
            switch (interaction.custom_id) {
                case "configureModelParameters":
                    await refreshModelParameters();
                case "configurePromptParameters":
                    await refreshPromptParameters();
            }
        });
    }
);

export default subcommand;