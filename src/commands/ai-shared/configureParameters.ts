import { Message, InteractionResponse, ButtonInteraction, CacheType, TextInputBuilder, TextInputStyle, LabelBuilder, ModalBuilder, ModalSubmitInteraction } from "discord.js";
import { TextDisplay, ActionRow, Button, ButtonStyle } from "../../lib/classes/components";
import * as action from "../../lib/discord_action";
import { Conversation } from "../../lib/gpt/conversation";
import { AnyModel, ModelParameter } from "../../lib/gpt/modelTypes";
import { promptParameterTypings } from "../../lib/gpt/promptManager";

export function makePromptRefresher(sent: Message<true> | InteractionResponse<boolean>, getParameters: () => ReturnType<Conversation["getPromptParameters"]>) {
    return async () => {
        await action.edit(sent, {
            components: [
                new TextDisplay({
                    content: `which prompt parameter would you like to configure?\ncurrent values:\n\`\`\`json\n${JSON.stringify(getParameters(), null, 4)}\n\`\`\``,
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

export function makeModelRefresher(sent: Message<true> | InteractionResponse<boolean>, model: AnyModel, getParameters: () => ReturnType<Conversation<AnyModel>["getModelParameters"]>) {
    return async () => {
        await action.edit(sent, {
            components: [
                new TextDisplay({
                    content: `which model parameter would you like to configure?\ncurrent values:\n\`\`\`json\n${JSON.stringify(getParameters(), null, 4)}\n\`\`\``,
                }),
                new ActionRow({
                    components: [
                        ...Object.values(model.parameters).map((p, i) => {
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

export async function handleConfiguratorButtons(interaction: ButtonInteraction<CacheType>, refreshModelParameters: () => Promise<void>, refreshPromptParameters: () => Promise<void>, sent: Message<boolean> | InteractionResponse<boolean>, baseContent: (action.TopLevelComponent)[]) {
    switch (interaction.customId) {
        case "configureModelParameters":
            await refreshModelParameters();
            await interaction.deferUpdate();
            return true;
        case "configurePromptParameters":
            await refreshPromptParameters();
            await interaction.deferUpdate();
            return true;
        case "back_button":
            await action.edit(sent, { components: baseContent, components_v2: true });
            await interaction.deferUpdate();
            return true;
    }
    return false;
}

export function createConfiguratorInputModal(currentValue: any, editingType: string, key: string, schema: ModelParameter | undefined) {
    const data_input = new TextInputBuilder()
        .setCustomId('data_input')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("enter value")
        .setValue(String(currentValue != undefined ? currentValue : ""))
        .setRequired(true);

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
    return modal;
}

export async function parseConfiguratorInput(response: ModalSubmitInteraction<CacheType>, schema: ModelParameter | undefined) {
    const parsed = schema?.schema.safeParse(response.fields.getTextInputValue("data_input"), {});
    if (!parsed) {
        await response.reply({ content: "something has gone very wrong...", ephemeral: true });
        return;
    }
    if (parsed.error) {
        await response.reply({ content: `error parsing value:\n${typeof parsed.error.message == "string" ? parsed.error.message : (parsed.error.message as any).map((m: any) => m.message).join("\n")}\nfix it and try again.`, ephemeral: true });
        return;
    }

    return parsed;
}

export function extractRefreshFunction(interaction: ButtonInteraction<CacheType>, refreshModelParameters: () => Promise<void>, refreshPromptParameters: () => Promise<void>, model: AnyModel, getModelParameters: Conversation["getModelParameters"], getPromptParameters: Conversation["getPromptParameters"]) {
    const editingType = interaction.customId.split("_")[0];
    const key = interaction.customId.slice(`${editingType}_`.length);
    let schema;
    let currentValue;
    let overrideType: "model" | "prompt" = "model";
    let refreshFunction: typeof refreshModelParameters | typeof refreshPromptParameters = refreshModelParameters;
    switch (editingType) {
        case "editmodel":
            schema = model.parameters[key];
            currentValue = getModelParameters()[key];
            overrideType = "model";
            refreshFunction = refreshModelParameters;
            break;
        case "editprompt":
            schema = promptParameterTypings[key as keyof typeof promptParameterTypings];
            currentValue = getPromptParameters()[key as keyof typeof promptParameterTypings];
            overrideType = "prompt";
            refreshFunction = refreshPromptParameters;
            break;
    }
    return { currentValue, editingType, key, schema, overrideType, refreshFunction };
}

export const baseConfiguratorContent = [
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