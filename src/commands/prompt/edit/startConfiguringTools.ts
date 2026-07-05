import { ButtonInteraction, CacheType, CheckboxBuilder, InteractionResponse, LabelBuilder, Message, MessageFlags, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { FormattedCommandInteraction } from "../../../lib/classes/command";
import { Container, ActionRow, TextDisplay, Separator, Button, ButtonStyle, Section } from "../../../lib/classes/components";
import * as action from "../../../lib/discord_action";
import { models } from "../../../lib/gpt/models";
import { AnyModel } from "../../../lib/gpt/modelTypes";
import { AnyPrompt } from "../../../lib/gpt/promptManager";
import * as log from "../../../lib/log";
import { refreshMainPromptEmbed } from "./refreshMainPromptEmbed";
import { ToolName, tools } from "../../../lib/gpt/tools";
import { CustomTool } from "../../../lib/gpt/toolTypes";

function createToolActionRows(prompt: AnyPrompt) {
    // takes Math.ceil(Object.values(tools).length / 5) + Object.values(tools).length + ((prompt.customTools.length > 0) ? (Math.ceil(Object.values(prompt.customTools).length / 5) + prompt.customTools.length) : 0) + 2 components
    const components: (ActionRow)[] = [];

    for (let i = 0; i < Math.ceil(Object.values(tools).length / 5); i++) {
        components.push(new ActionRow({ components: [] }));
    }

    Object.values(tools).forEach((tool, i) => {
        (components[Math.floor(i / 5)] as ActionRow).components.push(new Button({
            custom_id: `toggleDefaultTool ${tool.name}`,
            label: tool.name,
            style: (prompt.enabledTools.includes(tool.name as ToolName)) ? ButtonStyle.Success : ButtonStyle.Secondary,
        }));
    });

    components.push(new ActionRow({
        components: [
            new Button({
                style: ButtonStyle.Primary,
                label: "create new custom tool",
                custom_id: `createCustomTool`,
            }),
        ]
    }));

    const baseIndex = components.length;

    if (prompt.customTools.length > 0) {
        for (let i = 0; i < Math.ceil(Object.values(prompt.customTools).length / 5); i++) {
            components.push(new ActionRow({ components: [] }));
        }

        prompt.customTools.forEach((tool, i) => {
            (components[baseIndex + Math.floor(i / 5)] as ActionRow).components.push(new Button({
                custom_id: `configureCustomTool ${tool.name}`,
                label: tool.name,
                style: ButtonStyle.Secondary,
            }));
        });
    }

    components.push(new ActionRow({
        components: [
            new Button({
                style: ButtonStyle.Danger,
                label: "back",
                custom_id: `allTheWayBack`,
            }),
        ]
    }));

    return components;
}

function renderCustomTool(tool: CustomTool) {
    // takes 13 components
    let parametersContent = "";

    Object.values(tool.parameters).forEach((param, i) => {
        parametersContent += `**${param.key}**: (\`${param.type}\`)\n${param.description}\n${param.required ? "-# this is a *required* parameter\n" : ""}\n`
    });

    const components = [
        new Container({
            components: [
                new Section({
                    components: [
                        new TextDisplay({
                            content: `## editing custom tool \`${tool.name}\``
                        })
                    ],
                    accessory: new Button({
                        label: `delete tool`,
                        style: ButtonStyle.Danger,
                        custom_id: `customToolEditor delete ${tool.name}`
                    })
                }),
                new Separator(),
                new Section({
                    components: [
                        new TextDisplay({
                            content: `### description:`,
                        }),
                    ],
                    accessory: new Button({
                        label: `edit description`,
                        style: ButtonStyle.Primary,
                        custom_id: `customToolEditor editDescription ${tool.name}`
                    }),
                }),
                new TextDisplay({
                    content: `${action.fixMessage({ content: tool.description }).content}`,
                }),
                new Separator(),
                new TextDisplay({
                    content: `## parameters:\n${parametersContent}`,
                }),
                new ActionRow({
                    components: [
                        new Button({
                            style: ButtonStyle.Success,
                            label: "add new parameter",
                            custom_id: `customToolEditor newParameter ${tool.name}`,
                        }),
                    ]
                })
            ]
        })
    ];


    return components;
}

const baseContent = [
    new TextDisplay({
        content: "toggle which base tools should be enabled, or add a new custom tool",
    }),
];

const data_input = new TextInputBuilder()
    .setCustomId('data_input')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("enter value")
    .setRequired(true);

const label = new LabelBuilder()
    .setLabel("content")
    .setTextInputComponent(data_input);

const createCustomToolModal = new ModalBuilder()
    .setCustomId(`createToolModal`)
    .setTitle(`create new custom tool`)
    .addTextDisplayComponents(new TextDisplay({
        content: `create new custom tool`,
    }))
    .addLabelComponents(label);

const param_name_input = new TextInputBuilder()
    .setCustomId('param_name_input')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("enter parameter name")
    .setRequired(true);

const param_name_label = new LabelBuilder()
    .setLabel("set parameter name")
    .setTextInputComponent(param_name_input);

const param_description_input = new TextInputBuilder()
    .setCustomId('param_description_input')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("enter parameter description")
    .setRequired(true);

const param_description_label = new LabelBuilder()
    .setLabel("set parameter description")
    .setTextInputComponent(param_description_input);

const param_type_input = new StringSelectMenuBuilder()
    .setCustomId('param_type_input')
    .setPlaceholder("select parameter type")
    .setRequired(true)
    .addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel("string")
            .setValue("string"),
        new StringSelectMenuOptionBuilder()
            .setLabel("boolean")
            .setValue("boolean"),
        new StringSelectMenuOptionBuilder()
            .setLabel("number")
            .setValue("number"),
        new StringSelectMenuOptionBuilder()
            .setLabel("string[]")
            .setValue("string[]"),
);

const param_type_label = new LabelBuilder()
    .setLabel("select parameter type")
    .setStringSelectMenuComponent(param_type_input);

const param_required_input = new CheckboxBuilder()
    .setCustomId('param_required_input')
    .setDefault(false)

const param_required_label = new LabelBuilder()
    .setLabel("is this parameter required?")
    .setCheckboxComponent(param_required_input);

const newParameterModal = new ModalBuilder()
    .setCustomId(`createParameterModal`)
    .setTitle(`edit parameter`)
    .addTextDisplayComponents(new TextDisplay({
        content: `edit parameter\ntype is limited due to api limitations, these are your options.\n\nif you would like to overwrite an existing parameter, enter its name in here and it will be overwritten.`,
    }))
    .addLabelComponents(param_name_label, param_description_label, param_type_label, param_required_label);

export async function startConfiguringTools(sent: Message<true> | InteractionResponse<boolean>, prompt: AnyPrompt, invoker: FormattedCommandInteraction | Message<true>) {
    await action.edit(sent, {
        components: [...baseContent, ...createToolActionRows(prompt)],
        components_v2: true
    });

    try {
        const toolCollector = sent.createMessageComponentCollector({ filter: (c) => c.user.id === invoker.author.id, time: 15000 * 60 });
        let noeditend = false;
        toolCollector.on("collect", async (interaction: ButtonInteraction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId == "allTheWayBack") {
                noeditend = true;
                toolCollector.stop();
                return;
            }

            if (interaction.customId === "createCustomTool") {
                interaction.showModal(createCustomToolModal);
                const customToolModalResponse = await interaction.awaitModalSubmit({ time: 15000 * 60 }).catch(() => {});
                if (!customToolModalResponse) return; // expired

                let toolName = customToolModalResponse.fields.getTextInputValue("data_input").replaceAll(/\s+/g, "_").replaceAll(/[^\w]/g, "");
                if (prompt.customTools.find(t => t.name === toolName)) {
                    await customToolModalResponse.reply({ content: `you have already created a custom tool named \`${toolName}\`. please pick a different name`, flags: MessageFlags.Ephemeral });
                    return;
                }

                if (Math.ceil(Object.values(tools).length / 5) + Object.values(tools).length + ((prompt.customTools.length > 0) ? (Math.ceil(Object.values(prompt.customTools).length / 5) + prompt.customTools.length) : 0) + 15 >= 40) {
                    await customToolModalResponse.reply({ content: `you cannot create any more custom tools on this prompt as creating more would exceed api limits to be able to display this editor. please delete some tools and then try again.`, flags: MessageFlags.Ephemeral });
                    return;
                }

                const tool = new CustomTool({
                    name: toolName,
                    description: "[empty description]",
                    parameters: {},
                });
                prompt.customTools.push(tool);
                await prompt.write();

                await customToolModalResponse.deferUpdate();

                await action.edit(sent, {
                    components: [...renderCustomTool(tool), ...createToolActionRows(prompt)],
                    components_v2: true
                });

                return;
            }

            const split = interaction.customId.split(" ");
            const actionType = split[0];

            let thisTool: CustomTool | undefined;
            let thisAction: string | undefined;
            let thisToolName: string | undefined;

            switch (actionType) {
                case "toggleDefaultTool":
                    // toggle one of the default tools
                    thisToolName = split[1];
                    if (Object.keys(tools).includes(thisToolName ?? "")) { // should never be false but just incase
                        let didAction: string = "disabled";
                        let noLonger: string = "no longer";
                        if (prompt.enabledTools.includes(thisToolName as ToolName)) {
                            prompt.enabledTools = prompt.enabledTools.filter(t => t !== thisToolName);
                        } else {
                            prompt.enabledTools.push(thisToolName as ToolName);
                            didAction = "enabled";
                            noLonger = "now";
                        }

                        await prompt.write();
                        await interaction.reply({ content: `${didAction} tool \`${thisToolName}\`. the model will ${noLonger} be able to use it.`, flags: MessageFlags.Ephemeral });
                        await action.edit(sent, {
                            components: [...baseContent, ...createToolActionRows(prompt)],
                            components_v2: true
                        });
                        return;
                    }
                break;
                case "configureCustomTool":
                    // start configuring the specified custom tool
                    thisToolName = split[1];
                    thisTool = prompt.customTools.find(t => t.name === thisToolName);
                    if (!thisTool) {
                        await interaction.reply({ content: `something went wrong and the specified custom tool couldn't be found`, flags: MessageFlags.Ephemeral });
                        return;
                    }

                    interaction.deferUpdate(),
                    await action.edit(sent, {
                        components: [...renderCustomTool(thisTool), ...createToolActionRows(prompt)],
                        components_v2: true
                    });
                break;
                case "customToolEditor":
                    // custom tool editor actions
                    thisAction = split[1];
                    thisToolName = split[2];
                    thisTool = prompt.customTools.find(t => t.name === thisToolName);
                    if (!thisTool) {
                        await interaction.reply({ content: `something went wrong and the specified custom tool couldn't be found`, flags: MessageFlags.Ephemeral });
                        return;
                    }

                    let isParamEdit = false;
                    let whichParam = "";

                    switch (thisAction) {
                        case "editDescription":
                            const data_input2 = new TextInputBuilder()
                                .setCustomId('data_input')
                                .setStyle(TextInputStyle.Paragraph)
                                .setPlaceholder("enter value")
                                .setValue(thisTool.description)
                                .setRequired(true);

                            const label2 = new LabelBuilder()
                                .setLabel("content")
                                .setTextInputComponent(data_input2);

                            const editDescriptionModal = new ModalBuilder()
                                .setCustomId(`editDescriptionModal`)
                                .setTitle(`edit custom tool description`)
                                .addTextDisplayComponents(new TextDisplay({
                                    content: `edit custom tool description`,
                                }))
                                .addLabelComponents(label2);

                            interaction.showModal(editDescriptionModal);
                            const editDescriptionResponse = await interaction.awaitModalSubmit({ time: 15000 * 60 }).catch(() => {});
                            if (!editDescriptionResponse) return; // expired

                            let newDescription = editDescriptionResponse.fields.getTextInputValue("data_input");

                            thisTool.description = newDescription;

                            await editDescriptionResponse.deferUpdate();
                            await prompt.write();
                            await action.edit(sent, {
                                components: [...renderCustomTool(thisTool), ...createToolActionRows(prompt)],
                                components_v2: true
                            });
                        break;
                        case "delete":
                            // im too lazy to make a confirmation + lowkey dont care its not that hard to recreate tools
                            prompt.customTools = prompt.customTools.filter(t => t.name !== thisTool!.name);
                            await prompt.write();
                            await interaction.reply({ content: `deleted tool ${thisTool.name}`, flags: MessageFlags.Ephemeral });
                            await action.edit(sent, {
                                components: [...baseContent, ...createToolActionRows(prompt)],
                                components_v2: true
                            });
                        break;
                        // disabled as we ran out of components
                        // case "editParameter":
                        //     thisToolName = split[3]
                        //     thisTool = prompt.customTools.find(t => t.name === thisToolName);
                        //     if (!thisTool) {
                        //         await interaction.reply({ content: `something went wrong and the specified custom tool couldn't be found`, flags: MessageFlags.Ephemeral });
                        //         return;
                        //     }

                        //     isParamEdit = true;
                        //     whichParam = split[2];
                            // purposeful fallthrough case
                        case "newParameter":
                            interaction.showModal(newParameterModal);
                            const newParameterResponse = await interaction.awaitModalSubmit({ time: 15000 * 60 }).catch(() => {});
                            if (!newParameterResponse) return; // expired

                            let paramName = newParameterResponse.fields.getTextInputValue("param_name_input").replaceAll(/\s+/g, "_").replaceAll(/[^\w]/g, "");
                            let paramDescription = newParameterResponse.fields.getTextInputValue("param_description_input");
                            let paramType = newParameterResponse.fields.getStringSelectValues("param_type_input")[0];
                            let required = newParameterResponse.fields.getCheckbox("param_required_input");


                            if (Object.values(thisTool.parameters).find(p => p.key === paramName)) {
                                // newParameterResponse.reply({ content: `you have already created a parameter named \`${paramName}\`. please pick a different name`, flags: MessageFlags.Ephemeral })
                                delete thisTool.parameters[paramName];
                                return;
                            }

                            thisTool.parameters[paramName] = {
                                key: paramName,
                                description: paramDescription,
                                type: paramType,
                                required: required,
                            }

                            await newParameterResponse.deferUpdate();
                            await prompt.write();
                            await action.edit(sent, {
                                components: [...renderCustomTool(thisTool), ...createToolActionRows(prompt)],
                                components_v2: true
                            });
                        break;
                    }
                break;
            }
        });

        toolCollector.on("end", async () => {
            if (!noeditend) await action.edit(sent, { components: await refreshMainPromptEmbed(prompt), components_v2: true });
        });
    } catch (err) {
        // Collector received no interactions before ending with reason: time
        // literally satanic invention
        log.error(err);
    }

    return;
}
