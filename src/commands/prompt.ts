import { AutocompleteInteraction, ButtonInteraction, Interaction, Message, MessageComponentInteraction, MessageFlags, ModalSubmitInteraction, User } from "discord.js";
import { Command, CommandInvoker, CommandOption, CommandResponse, FormattedCommandInteraction } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getPrompt, getPromptByUsername, getPromptsByUsername, getUserPrompts, Prompt, removePrompt, writePrompt } from "../lib/prompt_manager";
import { generatePrompt } from "../lib/gpt/basic";
import { userPrompts, getConversation } from "../lib/gpt/main";
import { Models as models, Model } from "../lib/gpt/models";
import { CommandAccessTemplates, getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, SubcommandDeploymentApproach, CommandOptionType, InvokerType } from "../lib/classes/command_enums";
import { tablify } from "../lib/string_helpers";
import { Button, ButtonStyle, Container, Section, Separator, TextDisplay, TextInput, TextInputStyle, ActionRow } from "../lib/classes/components";
import { GuildConfig } from "../lib/guild_config_manager";
import chalk from "chalk";
import { DiscordAnsi as ansi } from "../lib/discord_ansi";

function findModelByName(name: string): Model | undefined {
    return Object.values(models).find(m =>
        m.name.toLowerCase() === name.toLowerCase() ||
        m.name.toLowerCase().replaceAll("-", "") === name.toLowerCase().replaceAll("-", "") ||
        m.name.toLowerCase().startsWith(name.toLowerCase()) ||
        m.name.toLowerCase().replaceAll("-", "").startsWith(name.toLowerCase().replaceAll("-", "")) ||
        m.name.toLowerCase().includes(name.toLowerCase()) ||
        m.name.toLowerCase().replaceAll("-", "").includes(name.toLowerCase().replaceAll("-", ""))
    );
}

function serializeModel(model: Model): string {
    return `${ansi.bold(ansi.green(model.name))} ${ansi.gray(`(${model.provider})`)}\n` +
        `${ansi.gray(model.description)}\n` +
        `${ansi.blue("capabilities: ")}${model.capabilities.join(', ')}` +
        ((model.whitelist && model.whitelist.length > 0) ? `\n${ansi.blue("whitelist: ")}${model.whitelist.join(', ')}` : '');
}

function serializeModelParameters(parameters: Model['parameters']): string {
    if (!parameters || parameters.length === 0) {
        return ansi.gray("[no parameters]");
    }
    return parameters.map(param => {
        const restrictions = param.restrictions ? ` ${JSON.stringify(param.restrictions)}` : '';
        return `${ansi.gold(param.key)} ${ansi.gray(": " + param.type) + " / "}${param.description ? `: ${ansi.white(param.description)}` : ''}\n${ansi.gray(`restrictions: ${restrictions}`)}`;
    }).join('\n');
}

async function getUserPrompt(user: User): Promise<Prompt> {
    let prompt = await getPrompt(userPrompts.get(user.id)?.name || "autosave", user.id)
    if (!prompt) {
        prompt = new Prompt({
            author_id: user.id,
            author_username: user.username,
            author_avatar: user.displayAvatarURL(),
            name: "autosave",
            content: "",
        });
        await writePrompt(prompt);
    }
    return prompt;
}

function savePrompt(prompt: Prompt, user: User) {
    userPrompts.set(user.id, prompt);
    writePrompt(prompt);
}

function sectionWithEdit(label: string, value: string, custom_id: string, disabled = false, note?: string) {
    return new Section({
        components: [
            new TextDisplay({
                content: `**${label}**\n${value}${note ? `\n-# ${note}` : ""}`
            }),
        ],
        accessory: new Button({
            style: ButtonStyle.Primary,
            label: "Edit",
            custom_id,
            disabled
        })
    });
}

function toggleSection(label: string, value: boolean, custom_id: string, disabled = false, trueLabel = "Unmark", falseLabel = "Mark") {
    return new Section({
        components: [
            new TextDisplay({
                content: `**${label}**\n${value ? "true" : "false"}`
            }),
        ],
        accessory: new Button({
            style: value ? ButtonStyle.Danger : ButtonStyle.Success,
            label: value ? trueLabel : falseLabel,
            custom_id,
            disabled
        })
    });
}

function buildSections(prompt: Prompt, guild_config: GuildConfig, disabled: boolean = false) {
    return [
        new Section({
            components: [
                new TextDisplay({
                    content: `editing prompt \`${prompt.name}\`\n-# created at: <t:${Math.floor(prompt.created_at as unknown as number / 1000)}:F>\n-# last updated at: <t:${Math.floor(prompt.updated_at as unknown as number / 1000)}:F>${prompt.published ? `\n-# published at: <t:${Math.floor((prompt.published_at as unknown as number || 1) / 1000)}:F>` : ""}`,
                }),
            ],
            accessory: new Button({
                label: "Create New Prompt",
                custom_id: "edit_prompt_name2", // since editing the prompt name effectively creates a new prompt, this is just a second button for that so that people can find it easier
                style: ButtonStyle.Primary
            })
        }),
        new Separator(),
        sectionWithEdit("Name", prompt.name, "edit_prompt_name", disabled, "changing the name of the prompt will effectively create a new prompt."),
        new Separator(),
        sectionWithEdit("Description", prompt.description, "edit_prompt_description", disabled),
        new Separator(),
        sectionWithEdit("Prompt", prompt.content, "edit_prompt_content", disabled),
        new Separator(),
        ...["NSFW", "Default"].map(field => toggleSection(field, (prompt as any)[field.toLowerCase() as keyof Prompt], `edit_prompt_${field.toLowerCase()}`, disabled)),
        toggleSection("Published", prompt.published, "edit_prompt_publish", disabled, "Unpublish", "Publish"),
        new Separator(),
        new TextDisplay({ content: "__**Advanced**__\n\n" }),
        sectionWithEdit(
            "AI Model", // the label will make this automatically start and end with **
            `${prompt.api_parameters.model || defaultModel}\n-# run \`${guild_config.other.prefix}prompt model list\` for a more detailed list of models and their capabilities.`,
            "edit_prompt_model",
            disabled
        ),
        sectionWithEdit(
            "API Parameters",
            Object.entries(prompt.api_parameters)
                .filter(([key, _]) => key !== "model")
                .map(([key, value]) => `**${key}**: ${value}`)
                .join("\n"),
            "edit_prompt_api_parameters",
            disabled
        ),
        new Separator(),
        new TextDisplay({
            content: `to edit a different prompt, first list your saved prompts with \`${guild_config.other.prefix}prompt list\`. \nthen, run this command again but with the chosen prompt's name, like this: \n\`${guild_config.other.prefix}prompt edit promptname\``,
        }),
    ];
}

function embedPrompt(prompt: Prompt, guild_config: GuildConfig, disabled: boolean = false) {
    return new Container({
        components: buildSections(prompt, guild_config, disabled)
    });
}

function getBuilderActionRow(disabled: boolean = false, prompt: Prompt) {
    return new ActionRow({
        components: [
            new Button({
                style: ButtonStyle.Primary,
                label: "set as active prompt",
                custom_id: "edit_prompt_set_active",
                disabled: disabled
            }),
            new Button({
                style: ButtonStyle.Danger,
                label: "delete prompt",
                custom_id: "edit_prompt_delete",
                disabled: prompt.name === "autosave" || disabled
            }),
        ]
    })
}

const defaultModel = "gpt-4.1-nano"

function getModelButtons(prompt: Prompt, disabled: boolean = false) {
    const modelButtons: ActionRow[] = []
    Object.values(models).forEach((model) => {
        const isDefault = model.name === defaultModel;
        const isCurrent = prompt.api_parameters.model === model.name || (!prompt.api_parameters.model && isDefault);
        const modelButton = new Button({
            style: isDefault
            ? ButtonStyle.Success
            : isCurrent
                ? ButtonStyle.Primary
                : ButtonStyle.Secondary,
            label: model.name,
            custom_id: `edit_prompt_model_${model.name}`,
            disabled: isCurrent || (model.whitelist && !model.whitelist.includes(prompt.author.id)) || disabled
        });
        if (modelButtons.length === 0 || modelButtons[modelButtons.length - 1].components.length >= 5) {
            const row = new ActionRow({ components: [modelButton] });
            modelButtons.push(row);
        } else {
            modelButtons[modelButtons.length - 1].components.push(modelButton);
        }
    });
    return modelButtons;
}

function getAPIParametersButtons(prompt: Prompt, disabled: boolean = false) {
    const model = findModelByName(prompt.api_parameters.model.toString() || defaultModel);
    const templateAPIParameters = model?.parameters?.reduce<Record<string, any>>((acc, param) => {
        acc[param.key] = param.default || 0; // default to 0 if no default is provided
        return acc;
    }, { model: prompt.api_parameters.model }) || { model: prompt.api_parameters.model };
    const apiParameterButtons: ActionRow[] = []
    Object.keys(templateAPIParameters).filter((key) => key !== "model").forEach((key) => {
        const apiParameterButton = new Button({
            style: ButtonStyle.Primary,
            label: key,
            custom_id: `edit_prompt_api_parameter_${key}`,
            disabled: disabled
        });
        if (apiParameterButtons.length === 0 || apiParameterButtons[apiParameterButtons.length - 1].components.length >= 5) {
            const row = new ActionRow({ components: [apiParameterButton] });
            apiParameterButtons.push(row);
        } else {
            apiParameterButtons[apiParameterButtons.length - 1].components.push(apiParameterButton);
        }
    });
    return apiParameterButtons;
}

// Helper for toggling boolean fields
async function togglePromptField(
    field: keyof Prompt,
    prompt: Prompt,
    invoker: CommandInvoker<any>,
    sent: Message,
    guild_config: GuildConfig,
    actionRow: ActionRow,
    buttonInteraction: MessageComponentInteraction,
) {
    (prompt as any)[field as keyof Prompt] = !prompt[field];
    await savePrompt(prompt, invoker.author);
    action.edit(sent, { components: [embedPrompt(prompt, guild_config), actionRow] });
    buttonInteraction.deferUpdate();
    return prompt;
}

interface ModalValueFilterResponse {
    success: boolean;
    message: string | undefined;
}

type ModalValueFilterFunction = (value: string) => ModalValueFilterResponse;

// Helper for showing a modal and updating a field
async function showModalAndUpdateField(
    interaction: Exclude<Interaction, AutocompleteInteraction | ModalSubmitInteraction>,
    prompt: Prompt,
    field: keyof Prompt,
    modalOptions: { custom_id: string, title: string, label: string, style: TextInputStyle, placeholder: string },
    invoker: CommandInvoker<any>,
    sent: Message,
    guild_config: GuildConfig,
    actionRow: ActionRow,
    filter: ModalValueFilterFunction | undefined = undefined,
    extraReply?: (value: string) => string,
) {
    interaction.showModal({
        custom_id: modalOptions.custom_id,
        title: modalOptions.title,
        components: [
            new ActionRow({
                components: [
                    new TextInput({
                        custom_id: modalOptions.custom_id.replace('_modal', ''),
                        label: modalOptions.label,
                        style: modalOptions.style,
                        placeholder: modalOptions.placeholder,
                        required: true,
                        value: prompt[field] as string
                    })
                ]
            }) as any
        ]
    });
    const submitted = await interaction.awaitModalSubmit({ time: 20 * 60 * 1000 });
    (submitted as unknown as FormattedCommandInteraction).author = submitted.user;
    const value = submitted.fields.getTextInputValue(modalOptions.custom_id.replace('_modal', ''));
    if (filter) {
        const filterResponse = filter(value);
        if (!filterResponse.success) {
            action.reply(submitted as unknown as FormattedCommandInteraction, { content: filterResponse.message || "unknown error", ephemeral: true });
            return;
        }
    }
    (prompt as any)[field as keyof Prompt] = value;
    await savePrompt(prompt, invoker.author);
    action.reply(submitted as unknown as FormattedCommandInteraction, {
        content: extraReply ? extraReply(value) : `prompt ${field} set to \`${value}\``,
        ephemeral: true
    });
    action.edit(sent, { components: [embedPrompt(prompt, guild_config), actionRow] });
}

interface APIParamVerifyResponse {
    error: boolean;
    message: string;
}

function verifyAPIParameter(parameter: string, value: number): APIParamVerifyResponse {
    switch (parameter) {
        case "temperature": {
            if (value < 0 || value > 2) {
                return { error: true, message: "temperature must be between 0 and 2" };
            }
            break;
        }
        case "top_p": {
            if (value < 0 || value > 1) {
                return { error: true, message: "top_p must be between 0 and 1" };
            }
            break;
        }
        case "presence_penalty": {
            if (value < -2 || value > 2) {
                return { error: true, message: "presence_penalty must be between -2 and 2" };
            }
            break;
        }
        case "frequency_penalty": {
            if (value < -2 || value > 2) {
                return { error: true, message: "frequency_penalty must be between -2 and 2" };
            }
            break;
        }
        case "max_tokens": {
            if (value < 0 || value > 4096) {
                return { error: true, message: "max_tokens must be between 0 and 4096" };
            }
            if (value % 1 !== 0) {
                return { error: true, message: "max_tokens must be an integer, and cannot have a decimal place." };
            }
            break;
        }
        default: break;
    }
    return { error: false, message: "" };
}

const build = new Command(
    {
        name: 'edit',
        description: 'allows you to edit a prompt more easily from a menu',
        long_description: 'allows you to edit a prompt more easily from an interactive menu with buttons to adjust the settings of the prompt',
        tags: [CommandTag.AI],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'name',
                description: 'the name of the prompt to use',
                long_description: 'the name of the prompt to open a builder for',
                type: CommandOptionType.String,
                required: false
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/prompt build",
        argument_order: "<name?>",
        aliases: ["builder", "build"],
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["name"]),
    async function execute ({ invoker, args, guild_config }) {
        let prompt;
        if (args.name) {
            prompt = await getPrompt(args.name as string, invoker.author.id);
            if (!prompt) {
                action.reply(invoker, { content: `couldn't find prompt: \`${args.name}\``, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: `couldn't find prompt: \`${args.name}\``,
                });
            }
        }
        if (!prompt) {
            prompt = await getUserPrompt(invoker.author);
        }
        const sent = await action.reply(invoker, {
            components: [embedPrompt(prompt, guild_config), getBuilderActionRow(false, prompt)],
            ephemeral: guild_config.other.use_ephemeral_replies,
            components_v2: true
        }) as Message;
        const collector = sent.createMessageComponentCollector({ time: 60 * 60 * 1000 }); // 1 hour

        collector.on('end', async () => {
            if (sent) {
                action.edit(sent, {
                    components: [embedPrompt(prompt, guild_config, true), getBuilderActionRow(true, prompt)],
                }).catch(() => {});
            }
        });

        collector.on('collect', async (interaction) => {
            (interaction as unknown as FormattedCommandInteraction).author = interaction.user;
            if (interaction.user.id !== invoker.author.id) {
                action.reply((interaction as unknown as FormattedCommandInteraction), { content: "this is not your prompt", ephemeral: true });
                return;
            }

            const handlers: Record<string, Function> = {
                "edit_prompt_nsfw": () => togglePromptField("nsfw", prompt, invoker, sent, guild_config, getBuilderActionRow(false, prompt), interaction),
                "edit_prompt_default": () => togglePromptField("default", prompt, invoker, sent, guild_config, getBuilderActionRow(false, prompt), interaction),
                "edit_prompt_publish": async () => {
                    prompt.published = !prompt.published;
                    prompt.published_at = prompt.published ? new Date() : undefined; // this one has a very slight little custom thing
                    await savePrompt(prompt, invoker.author);
                    action.edit(sent, { components: [embedPrompt(prompt, guild_config), getBuilderActionRow(false, prompt)] });
                    interaction.deferUpdate();
                },
                "edit_prompt_name": () => showModalAndUpdateField(
                    interaction, prompt, "name",
                    {
                        custom_id: "prompt_name_modal",
                        title: "Prompt Name",
                        label: "Prompt Name",
                        style: TextInputStyle.Short,
                        placeholder: "Enter the name of the prompt"
                    },
                    invoker, sent, guild_config, getBuilderActionRow(false, prompt), (value) => {
                        if (nameBlacklists.includes(value)) {
                            return { success: false, message: `you can't name your prompt \`${value}\`, choose another name` };
                        }
                        if (value.includes('/')) {
                            return { success: false, message: "prompt names cannot contain `/`" };
                        }
                        return { success: true, message: undefined };
                    }
                ),
                "edit_prompt_description": () => showModalAndUpdateField(
                    interaction, prompt, "description",
                    {
                        custom_id: "prompt_description_modal",
                        title: "Prompt Description",
                        label: "Prompt Description",
                        style: TextInputStyle.Paragraph,
                        placeholder: "Enter the description of the prompt"
                    },
                    invoker, sent, guild_config, getBuilderActionRow(false, prompt)
                ),
                "edit_prompt_content": () => showModalAndUpdateField(
                    interaction, prompt, "content",
                    {
                        custom_id: "prompt_content_modal",
                        title: "Prompt Content",
                        label: "Prompt Content",
                        style: TextInputStyle.Paragraph,
                        placeholder: "Enter the content of the prompt"
                    },
                    invoker, sent, guild_config, getBuilderActionRow(false, prompt),
                    undefined,
                    (value) => `${(value.split(" ").length < 10) ? `i suspect your prompt is too short to cause any meaningful change, consider using **${guild_config.other.prefix}prompt generate** to make it longer. i'll set the content anyways, but be advised it might not do anything.\n` : ""}prompt content set to \`\`\`\n${value}\n\`\`\``
                ),
                // For more complex cases, call the original logic
                "edit_prompt_model": async () => {
                    const modelReply = await action.reply(interaction as unknown as FormattedCommandInteraction, {
                        content: `select a model to use for this prompt. currently selected: \`${prompt.api_parameters.model || defaultModel}\``,
                        components: getModelButtons(prompt),
                        fetchReply: true,
                        ephemeral: true,
                    });
                    if (!modelReply) return;
                    const modelCollector = modelReply.createMessageComponentCollector({ time: 30 * 60 * 1000 });
                    modelCollector.on("collect", async (modelInteraction) => {
                        if (modelInteraction.user.id !== invoker.author.id) {
                            action.reply(modelInteraction as unknown as FormattedCommandInteraction, { content: "this is not your prompt", ephemeral: true });
                            return;
                        }
                        const model = modelInteraction.customId.split("_")[3];
                        prompt.api_parameters.model = model;
                        await savePrompt(prompt, invoker.author);
                        action.editReply(interaction as unknown as FormattedCommandInteraction, {
                            content: `select a model to use for this prompt. currently selected: \`${prompt.api_parameters.model || defaultModel}\``,
                            components: getModelButtons(prompt),
                        });
                        action.edit(sent, { components: [embedPrompt(prompt, guild_config), getBuilderActionRow(false, prompt)] });
                        modelInteraction.deferUpdate();
                    });
                    modelCollector.on("end", async () => {
                        if (modelReply) {
                            action.editReply(interaction as unknown as FormattedCommandInteraction, {
                                content: `select a model to use for this prompt. currently selected: \`${prompt.api_parameters.model || defaultModel}\``,
                                components: getModelButtons(prompt, true),
                            });
                        }
                    });
                },
                "edit_prompt_api_parameters": async () => {
                    const reply = await action.reply(interaction as unknown as FormattedCommandInteraction, {
                        content: `select an API parameter to edit`,
                        components: getAPIParametersButtons(prompt),
                        ephemeral: true,
                        fetchReply: true,
                    });
                    if (!reply) return;
                    const apiParameterCollector = reply.createMessageComponentCollector({ time: 30 * 60 * 1000 });
                    apiParameterCollector.on("collect", async (apiParameterInteraction) => {
                        if (apiParameterInteraction.user.id !== invoker.author.id) {
                            action.reply(apiParameterInteraction as unknown as FormattedCommandInteraction, { content: "this is not your prompt", ephemeral: true });
                            return;
                        }
                        const key = apiParameterInteraction.customId.split("_")[4];
                        const value = prompt.api_parameters[key];
                        await apiParameterInteraction.showModal({
                            custom_id: `prompt_api_parameter_modal`,
                            title: `API Parameter: ${key}`,
                            components: [
                                new ActionRow({
                                    components: [
                                        new TextInput({
                                            custom_id: "prompt_api_parameter",
                                            label: `API Parameter: ${key}`,
                                            style: TextInputStyle.Short,
                                            placeholder: `Enter the value of the API parameter`,
                                            required: true,
                                            value: value
                                        })
                                    ]
                                }) as any
                            ]
                        });
                        const submittedAPIParameter = await apiParameterInteraction.awaitModalSubmit({ time: 20 * 60 * 1000 });
                        (submittedAPIParameter as unknown as FormattedCommandInteraction).author = submittedAPIParameter.user;
                        const userValue = parseFloat(submittedAPIParameter.fields.getTextInputValue("prompt_api_parameter"));

                        const verifyResponse = verifyAPIParameter(key, userValue);
                        if (verifyResponse.error) {
                            action.reply(submittedAPIParameter as unknown as FormattedCommandInteraction, { content: verifyResponse.message, ephemeral: true });
                            return;
                        }

                        prompt.api_parameters[key] = userValue
                        await savePrompt(prompt, invoker.author);
                        action.reply(submittedAPIParameter as unknown as FormattedCommandInteraction, { content: `prompt API parameter \`${key}\` set to \`${prompt.api_parameters[key]}\``, ephemeral: true });
                        action.edit(sent, { components: [embedPrompt(prompt, guild_config), getBuilderActionRow(false, prompt)] });
                    });
                },
                "edit_prompt_set_active": async () => {
                    userPrompts.set(invoker.author.id, prompt.name);
                    if (invoker instanceof Message) {
                        const conversation = await getConversation(invoker);
                        if (conversation) {
                            conversation.setPrompt(prompt);
                        }
                    }
                    action.reply(interaction as unknown as FormattedCommandInteraction, { content: `prompt \`${prompt.name}\` is now set as the active prompt. pinging the bot to start a conversation will use this prompt.`, ephemeral: true });
                },
                "edit_prompt_delete": async () => {
                    if (prompt.name === "autosave") {
                        action.reply(interaction as unknown as FormattedCommandInteraction, { content: "you can't delete the autosave prompt", ephemeral: true });
                        return;
                    }
                    // Show confirmation button
                    const confirmationMessage = await action.reply(interaction as unknown as FormattedCommandInteraction, {
                        components: [
                            new TextDisplay({
                                content: `are you sure you want to delete prompt \`${prompt.name}\`? this action cannot be undone.`
                            }),
                            new ActionRow({
                                components: [
                                    new Button({
                                        style: ButtonStyle.Danger,
                                        label: "Confirm Delete",
                                        custom_id: "confirm_delete_prompt",
                                    }),
                                    new Button({
                                        style: ButtonStyle.Secondary,
                                        label: "Cancel",
                                        custom_id: "cancel_delete_prompt",
                                    }),
                                ]
                            })
                        ],
                        ephemeral: true,
                        components_v2: true,
                        fetchReply: true
                    });
                    if (!confirmationMessage) {
                        action.reply(interaction as unknown as FormattedCommandInteraction, { content: "failed to send confirmation message", ephemeral: true });
                        return;
                    }

                    // Wait for confirmation
                    const confirmCollector = confirmationMessage.createMessageComponentCollector({
                        time: 30 * 1000,
                    });
                    let edited = false;

                    confirmCollector.on("collect", async (confirmInteraction) => {
                        if (confirmInteraction.customId === "confirm_delete_prompt") {
                            await removePrompt(prompt.name, invoker.author.id);
                            userPrompts.delete(invoker.author.id);
                            await action.editReply(interaction as unknown as FormattedCommandInteraction, { components: [new TextDisplay({ content: `prompt \`${prompt.name}\` deleted` })], flags: MessageFlags.IsComponentsV2 });
                            confirmInteraction.deferUpdate();
                            edited = true;
                            collector.stop();
                            confirmCollector.stop();
                        } else {
                            await action.editReply(interaction as unknown as FormattedCommandInteraction, { components: [new TextDisplay({ content: `deletion cancelled` })], flags: MessageFlags.IsComponentsV2 });
                            confirmInteraction.deferUpdate();
                            edited = true;
                            confirmCollector.stop();
                        }
                    });

                    confirmCollector.on("end", async () => {
                        if (!edited) {
                            await action.editReply(interaction as unknown as FormattedCommandInteraction, { components: [new TextDisplay({ content: `confirmation timed out` })], flags: MessageFlags.IsComponentsV2 });
                        }
                    });
                }
            };
            if (interaction.customId === "edit_prompt_name2") interaction.customId = "edit_prompt_name"; // since editing the prompt name effectively creates a new prompt, this is just a second button for that so that people can find it easier
            if (handlers[interaction.customId]) {
                await handlers[interaction.customId]();
            } else {
                action.reply(invoker, { content: "what the fuck did you do. how did you press a non existant button.", ephemeral: true });
            }
        });
    }
);

const generate = new Command({
        name: 'generate',
        description: 'generates a response based on a prompt you input',
        long_description: 'generates a response based on a prompt you input',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
            name: 'input',
            description: 'the input to generate a response for',
            type: CommandOptionType.String,
            required: true,
            })
        ],
        example_usage: "p/prompt generate cat",
        argument_order: "<input>",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["input"]),
    async function execute ({ invoker, guild_config, args, will_be_piped }) {
        if (!args.input) {
            action.reply(invoker, {
            content: "please supply input for the prompt",
            ephemeral: guild_config.other.use_ephemeral_replies
            });
            return new CommandResponse({
                error: true,
                message: "please supply input for the prompt",
            });
        }
        const sent = await action.reply(invoker, { content: "processing...", ephemeral: guild_config.other.use_ephemeral_replies }) as Message;
        const response = await generatePrompt(args.input as string);
        action.edit(sent, { content: will_be_piped ? "piped generated prompt" : `generated prompt: \`\`\`\n${response}\`\`\`use ${guild_config.other.prefix}prompt set to use it. (or just pipe it)`, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { input_text: response }});
    }
);

let nameBlacklists = ["reset", "default", "autosave"]

const name = new Command({
        name: 'name',
        description: 'sets the name of your prompt',
        long_description: 'sets the name of your current prompt; this clones your prompt and effectively creates a new one.',
        tags: [CommandTag.AI],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'content',
                description: 'the content to set the prompt name to',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        example_usage: "p/prompt name myprompt",
        argument_order: "<content>",
        aliases: ["setname", "rename", "create", "new", "switch"],
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["content"]),
    async function execute ({ invoker, guild_config, args }) {
        if (!args.content) {
            action.reply(invoker, {
                content: "please supply a name",
                ephemeral: guild_config.other.use_ephemeral_replies
            })
            return new CommandResponse({
                error: true,
                message: "please supply a name",
            });
        }
        if (nameBlacklists.includes(args.content as string)) {
            action.reply(invoker, { content: `you can't name your prompt \`${args.content}\`, choose another name`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `you can't name your prompt \`${args.content}\`, choose another name`,
            })
        }
        if (args.content.includes('/')) { // this will be used later for published prompts
            action.reply(invoker, { content: "prompt names cannot contain `/`", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "prompt names cannot contain `/`",
            })
        }
        let prompt = await getUserPrompt(invoker.author);
        prompt.name = args.content as string;
        prompt.created_at = new Date();
        await savePrompt(prompt, invoker.author);
        userPrompts.set(invoker.author.id, prompt);
        action.reply(invoker, { content: `prompt name set to \`${prompt.name}\`; now using/editing prompt \`${prompt.name}\``, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const list = new Command({
        name: 'list',
        description: 'lists your prompts',
        long_description: 'lists your prompts',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'user',
                description: 'the user to list prompts for',
                type: CommandOptionType.User,
                required: false,
            })
        ],
        example_usage: "p/prompt list",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["user"]),
    async function execute ({ invoker, guild_config, args }) {
        if (args.hadArg && !args.user) {
            action.reply(invoker, { content: "couldn't find user: " + args.usedArg, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        let username = (args.user || invoker.author.username) as string;
        let notUser = username !== invoker.author.username;
        let prompts = await getPromptsByUsername(username);
        if (prompts.length === 0 || (notUser && prompts.filter((p) => p.published).length === 0)) {
            action.reply(invoker, { content: `${notUser ? username : "you"} ${notUser ? "has" : "have"} no ${notUser ? "published" : ""} prompts`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        let reply = `${notUser ? username + "'s published" : "your"} prompts: \`\`\`\n`;
        if (prompts.length < 10) {
            prompts.forEach(prompt => {
                if (notUser && !prompt.published) return;
                reply += `\n${prompt.name}`;
            });
        } else {
            const rows: string[][] = [];
            const columnCount = 3;
            let currentRow: string[] = [];

            prompts.forEach((prompt) => {
                if (notUser && !prompt.published) return;
                currentRow.push(prompt.name);
                if (currentRow.length === columnCount) {
                    rows.push(currentRow);
                    currentRow = [];
                }
            });

            if (currentRow.length > 0) {
                rows.push(currentRow);
            }

            const table = rows;
            const columns = ["1", "2", "3"];
            const text = tablify(columns, table, {
                no_header: true,
                column_separator: "  "
            })
            reply += text;
        }
        reply += "```";
        action.reply(invoker, { content: reply, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { input_text: reply }});
    }
);

const use = new Command({
        name: 'use',
        description: 'changes which prompt you are using',
        long_description: 'changes which prompt you are using',
        tags: [CommandTag.AI],
        pipable_to: [],
        root_aliases: ['useprompt'],
        options: [
            new CommandOption({
                name: 'content',
                description: 'the name of the prompt to use',
                long_description: 'the name of the prompt to use, or the name of the prompt to clone formatted as <username>/<promptname>',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        example_usage: ["p/prompt use myprompt", "p/prompt use PepperBot/default"],
        argument_order: "<content>",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["content"]),
    async function execute ({ invoker, guild_config, args }) {
        if (!args.content) {
            action.reply(invoker, {
                content: "please supply a prompt to use",
                ephemeral: guild_config.other.use_ephemeral_replies
            })
            return new CommandResponse({
                error: true,
                message: "please supply a prompt to use",
            });
        }
        if ((args.content === "default") || (args.content === "reset")) {
            userPrompts.delete(invoker.author.id);
            action.reply(invoker, { content: "now using default prompt", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        }

        let username = invoker.author.username;
        let selfAuthor = true
        let promptname = args.content;

        if (args.content.includes("/")) {
            const parts = args.content.split("/");
            if (parts[0] !== username) {
                selfAuthor = false;
            }
            username = parts[0];
            promptname = parts.slice(1).join("/");
        }

        const fetchedPrompt = await getPromptByUsername(promptname, username);
        if (!fetchedPrompt) {
            action.reply(invoker, { content: `couldn't find prompt \`${selfAuthor ? "" : username + "/"}${promptname}\``, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `couldn't find prompt \`${selfAuthor ? "" : username + "/"}${promptname}\``,
            });
        }

        let prompt = fetchedPrompt;

        if (!selfAuthor) {
            if (!fetchedPrompt.published) {
                action.reply(invoker, { content: `prompt \`${username}/${promptname}\` is not published and thus cannot be cloned.`, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: `prompt \`${username}/${promptname}\` is not published and thus cannot be cloned.`,
                });
            }
            prompt = new Prompt({
                author_id: invoker.author.id,
                author_username: invoker.author.username,
                author_avatar: invoker.author.displayAvatarURL(),
                name: fetchedPrompt.name,
                content: fetchedPrompt.content,
                description: fetchedPrompt.description,
                nsfw: fetchedPrompt.nsfw,
                created_at: fetchedPrompt.created_at,
                published: false,
            });
        }

        await writePrompt(prompt);
        userPrompts.set(invoker.author.id, prompt);
        let content = `now using/editing prompt \`${prompt.name}\``;

        if (invoker instanceof Message) {
            const conversation = await getConversation(invoker);
            if (conversation) {
                conversation.setPrompt(prompt);
                content += `; the prompt for conversation \`${conversation.id}\` has also been updated.`
            }
        }
        action.reply(invoker, { content: content, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const set = new Command({
        name: 'set',
        description: 'sets the content of the prompt',
        long_description: 'sets the content of your current prompt',
        tags: [CommandTag.AI, CommandTag.TextPipable],
        pipable_to: [],
        aliases: ['content'],
        root_aliases: ['setprompt'],
        options: [
            new CommandOption({
                name: 'content',
                description: 'the content to set the prompt to',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        example_usage: "p/prompt set always respond with \"hi\"",
        argument_order: "<content>",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["content"]),
    async function execute ({ invoker, guild_config, args, piped_data, invoker_type }) {
        let content = piped_data?.data?.input_text || args.content
        if (!content) {
            if (invoker_type === InvokerType.Message) {
                if ((invoker as CommandInvoker<InvokerType.Message>).attachments.size > 0) {
                    const attachment = (invoker as CommandInvoker<InvokerType.Message>).attachments.first();
                    if (attachment) {
                        const attachmentContent = await fetch(attachment.url).then(res => res.text());
                        if (attachmentContent) {
                            content = attachmentContent;
                        } else {
                            action.reply(invoker, { content: "couldn't read the attachment", ephemeral: guild_config.other.use_ephemeral_replies });
                            return new CommandResponse({
                                error: true,
                                message: "couldn't read the attachment",
                            });
                        }
                    }
                }
            }
            if (!content) {
                action.reply(invoker, {
                    content: "please supply content",
                    ephemeral: guild_config.other.use_ephemeral_replies
                })
                return new CommandResponse({
                    error: true,
                    message: "please supply content",
                });
            }
        }
        let prompt = await getUserPrompt(invoker.author);
        prompt.content = content as string;
        await savePrompt(prompt, invoker.author);
        action.reply(invoker, { content: `prompt content of \`${prompt.name}\` set to \`\`\`\n${prompt.content}\`\`\`\nthe next time you start a new conversation by pinging the bot, it will be used. you can also run \`${guild_config.other.prefix}prompt use ${prompt.name}\` to use it in the current conversation.${(prompt.content.split(" ").length < 10) ? `\n\ni suspect your prompt is too short to cause any meaningful change, consider using **${guild_config.other.prefix}prompt generate** to make it longer.` : ""}`, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const command = new Command(
    {
        name: 'prompt',
        description: 'various commands relating to your custom prompts',
        long_description: 'allows you to manage your custom prompts, with subcommands to set the content, description, name, as well as publish them for others to use.',
        tags: [CommandTag.AI],
        pipable_to: [],
        argument_order: "<subcommand> <content?>",
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [build, list, generate, set, use, name],
        },
        options: [],
        example_usage: "p/prompt set always respond with \"hi\"",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, guild_config, args }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use ${guild_config.other.prefix}help prompt for a list of subcommands`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            })
            return new CommandResponse({
                error: true,
                message: `invalid subcommand: ${args.subcommand}; use ${guild_config.other.prefix}help prompt for a list of subcommands`
            });
        }
        action.reply(invoker, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: guild_config.other.use_ephemeral_replies
        })
    }
);

export default command;