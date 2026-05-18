import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import { Conversation, getConversation, getUsersLatestConversation, writeOverrides } from "../../lib/gpt/conversation";
import { ActionRow, Button, ButtonStyle, TextDisplay } from "../../lib/classes/components";
import { promptParameterTypings } from "../../lib/gpt/promptManager";
import { ButtonInteraction, InteractionResponse, LabelBuilder, Message, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { AnyModel } from "../../lib/gpt/modelTypes";

const subcommand = new Command(
    {
        name: 'configure',
        description: 'allows you to configure conversation parameters',
        long_description: 'allows you to configure parameters in a gpt conversation',
        aliases: ["config", "edit", "cfg"],
        tags: [CommandTag.AI],
        example_usage: "p/conversation configure",
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'id',
                description: 'the id of the conversation to configure',
                long_description: 'the id of the conversation to configure, whitelist only. used for debugging/fixing',
                type: CommandOptionType.String,
                required: false,
                deployed: false,
            }),
        ],
        argument_order: "<id?>"
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
        if (!conversation) conversation = await getConversation();

        // model parameters
        const baseContent = [
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
        ];

        const sent = await action.reply(invoker, {
            components: baseContent,
            components_v2: true
        });

        if (!sent) return;

        const refreshModelParameters = makeModelRefresher(sent, conversation)
        const refreshPromptParameters = makePromptRefresher(sent, conversation)

        const collector = sent.createMessageComponentCollector({ filter: (c) => c.user.id === invoker.author.id, time: 15_000 * 60 });
        collector.on("collect", async (interaction: ButtonInteraction) => {
            if (!interaction.isButton()) return;

            switch (interaction.customId) {
                case "configureModelParameters":
                    await refreshModelParameters();
                    await interaction.deferUpdate();
                    return;
                case "configurePromptParameters":
                    await refreshPromptParameters();
                    await interaction.deferUpdate();
                    return;
                case "back_button":
                    await action.edit(sent, { components: baseContent, components_v2: true });
                    await interaction.deferUpdate();
                    return;
            }

            const editingType = interaction.customId.split("_")[0];
            const key = interaction.customId.slice(`${editingType}_`.length)
            let schema;
            let currentValue;
            let overrideType: "model" | "prompt" = "model";
            let refreshFunction: typeof refreshModelParameters | typeof refreshPromptParameters = refreshModelParameters;
            switch (editingType) {
                case "editmodel":
                    schema = conversation.model.parameters[key];
                    currentValue = conversation.getModelParameters()[key];
                    overrideType = "model";
                    refreshFunction = refreshModelParameters;
                break;
                case "editprompt":
                    schema = promptParameterTypings[key as keyof typeof promptParameterTypings];
                    currentValue = conversation.getPromptParameters()[key as keyof typeof promptParameterTypings];
                    overrideType = "prompt";
                    refreshFunction = refreshPromptParameters
                break;
            }

            const data_input = new TextInputBuilder()
                .setCustomId('data_input')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("enter value")
                .setValue(String(currentValue != undefined ? currentValue : ""))
                .setRequired(true)

            const label = new LabelBuilder()
                .setLabel("value")
                .setTextInputComponent(data_input);

            const modal = new ModalBuilder()
                .setCustomId(`${editingType}_modal_${key}`)
                .setTitle(`editing ${key}`)
                .addTextDisplayComponents(new TextDisplay({
                    content: schema?.description ?? "[undefined]",
                }))
                .addLabelComponents(label);

            interaction.showModal(modal);
            const response = await interaction.awaitModalSubmit({ time: 15 * 60 * 60 });

            const parsed = schema?.schema.safeParse(response.fields.getTextInputValue("data_input"), {  });
            if (!parsed) {
                await response.reply({ content: "something has gone very wrong...", ephemeral: true });
                return;
            }
            if (parsed.error) {
                await response.reply({ content: `error parsing value:\n${parsed.error.message}\nfix it and try again.`, ephemeral: true });
                return;
            }

            (conversation[`${overrideType}ParameterOverrides`] as any)[schema?.key as unknown as any] = parsed.data;
            await writeOverrides({
                user_id: invoker.author.id,
                model_parameter_overrides: JSON.stringify(conversation.modelParameterOverrides),
                prompt_parameter_overrides: JSON.stringify(conversation.promptParameterOverrides),
            });
            await refreshFunction();
            await response.reply({ content: `overrode value of ${key} to \`${JSON.stringify(parsed.data)}\`.`, flags: MessageFlags.Ephemeral });
        });

        collector.on("end", async () => {
            await action.edit(sent, { components: (sent as Message).components.slice(0, 1) as action.TopLevelComponent[], components_v2: true });
        });
    }
);

export default subcommand;

function makePromptRefresher(sent: Message<true> | InteractionResponse<boolean>, conversation: Conversation<AnyModel>) {
    return async () => {
        await action.edit(sent, {
            components: [
                new TextDisplay({
                    content: `which prompt parameter would you like to configure?\ncurrent values:\n\`\`\`json\n${JSON.stringify(conversation.getPromptParameters(), null, 4)}\n\`\`\``,
                }),
                new ActionRow({
                    components: [
                        ...Object.values(promptParameterTypings).map((p, i) => {
                            return new Button({
                                custom_id: `editprompt_${p.key}`,
                                label: p.key,
                                style: (i % 2 == 0) ? ButtonStyle.Primary : ButtonStyle.Secondary,
                            });
                        })
                    ]
                }),
                new ActionRow({
                    components: [
                        new Button({
                            custom_id: `back_button`,
                            label: "back",
                            style: ButtonStyle.Danger,
                        })
                    ]
                }),
            ],
            components_v2: true,
        });
    };
}

function makeModelRefresher(sent: Message<true> | InteractionResponse<boolean>, conversation: Conversation<AnyModel>) {
    return async () => {
        await action.edit(sent, {
            components: [
                new TextDisplay({
                    content: `which model parameter would you like to configure?\ncurrent values:\n\`\`\`json\n${JSON.stringify(conversation.getModelParameters(), null, 4)}\n\`\`\``,
                }),
                new ActionRow({
                    components: [
                        ...Object.values(conversation.model.parameters).map((p, i) => {
                            return new Button({
                                custom_id: `editmodel_${p.key}`,
                                label: p.key,
                                style: (i % 2 == 0) ? ButtonStyle.Primary : ButtonStyle.Secondary,
                            });
                        })
                    ]
                }),
                new ActionRow({
                    components: [
                        new Button({
                            custom_id: `back_button`,
                            label: "back",
                            style: ButtonStyle.Danger,
                        })
                    ]
                }),
            ],
            components_v2: true
        });
    };
}
