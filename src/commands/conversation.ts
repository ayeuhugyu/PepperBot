import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, Collection, GuildMember, Message, StageChannel, TextInputStyle, VoiceChannel } from "discord.js";
import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse, FormattedCommandInteraction } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { CommandAccessTemplates, getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { getConversation, conversations, GPTFormattedCommandInteraction, Conversation } from "../lib/gpt/main";
import { Model, Models as models } from "../lib/gpt/models";
import { textToAttachment } from "../lib/attachment_manager";
import { CommandTag, SubcommandDeploymentApproach, CommandOptionType, InvokerType } from "../lib/classes/command_enums";
import { DiscordAnsi as ansi } from "../lib/discord_ansi";
import { ActionRow, Button, ButtonStyle, Container, Section, Separator, TextDisplay, TextInput } from "../lib/classes/components";

function serializeModel(model: Model): string {
    return `${ansi.bold(ansi.green(model.name))} ${ansi.gray(`(${model.provider})`)}\n` +
        `${ansi.gray(model.description)}\n` +
        `${ansi.blue("capabilities: ")}${model.capabilities.join(', ')}` +
        ((model.whitelist && model.whitelist.length > 0) ? `\n${ansi.blue("whitelist: ")}${model.whitelist.join(', ')}` : '');
}

function getAPIParametersButtons(conversation: Conversation, disabled: boolean = false) {
    const model = findModelByName(conversation.model.name);
    const templateAPIParameters = model?.parameters?.reduce<Record<string, any>>((acc, param) => {
        acc[param.key] = param.default || 0; // default to 0 if no default is provided
        return acc;
    }, { model: conversation.model.name }) || { model: conversation.model.name };
    const apiParameterButtons: ActionRow[] = []
    Object.keys(templateAPIParameters).filter((key) => key !== "model").forEach((key) => {
        const apiParameterButton = new Button({
            style: ButtonStyle.Primary,
            label: key,
            custom_id: `edit_api_parameter_${key}`,
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

interface APIParamVerifyResponse {
    error: boolean;
    message: string;
}

const defaultAPIParameters: Record<string, number> = {
    temperature: 1,
    top_p: 1,
    presence_penalty: 0,
    frequency_penalty: 0,
    max_tokens: 4096
};

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

const defaultModel = "gpt-4.1-nano"

function getModelButtons(conversation: Conversation, disabled: boolean = false, authorId?: string) {
    const modelButtons: ActionRow[] = []
    Object.values(models).forEach((model) => {
        const isDefault = model.name === defaultModel;
        const isCurrent = conversation.model === model || (!conversation.model && isDefault);
        const modelButton = new Button({
            style: isDefault
            ? ButtonStyle.Success
            : isCurrent
                ? ButtonStyle.Primary
                : ButtonStyle.Secondary,
            label: model.name,
            custom_id: `edit_model_${model.name}`,
            disabled: isCurrent || (model.whitelist && (model.whitelist.length > 0) && !model.whitelist.includes(authorId || "x")) || disabled
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

function embedConversation(conversation: Conversation): Container {
    const container = new Container({
        components: [
            new TextDisplay({
                content: `### conversation \`${conversation.id}\``
            }),
            new Separator(),
            new Section({
                components: [
                    new TextDisplay({
                        content: `API Parameters: \`\`\`ansi\n${(Object.values(conversation.api_parameters).length > 0) ? Object.entries(conversation.api_parameters).map(([k, v]) => {return ansi.blue(k) + ": " + v}).join("\n") : ansi.red("N/A")}\`\`\``
                    }),
                ],
                accessory: new Button({
                    custom_id: "configure_parameters",
                    style: ButtonStyle.Success,
                    label: "Configure"
                })
            }),
            new Separator(),
            new Section({
                components: [
                    new TextDisplay({
                        content: `Model: \`\`\`ansi\n${serializeModel(conversation.model)}\`\`\``
                    })
                ],
                accessory: new Button({
                    custom_id: "configure_model",
                    style: ButtonStyle.Success,
                    label: "Configure"
                })
            })
        ]
    });
    return container;
}

const configurecommand = new Command(
    {
        name: 'configure',
        description: 'provides a graphical interface to configure your gpt conversation',
        long_description: 'provides a graphical interface to configure your gpt conversation.',
        tags: [CommandTag.Utility, CommandTag.AI],
        example_usage: ["p/conversation configure", "p/conversation configure {\"model\":\"o3-mini\",\"temperature\":0.7}"],
        pipable_to: [],
        options: [
            new CommandOption({
                name: "json",
                description: "raw json to import with, for use in aliases.",
                type: CommandOptionType.String,
                required: false
            })
        ],
        aliases: ["config", "build", "edit"],
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["json"]),
    async function execute ({ invoker, args, guild_config, invoker_type }) {
        let formattedInvoker: GPTFormattedCommandInteraction | CommandInvoker = invoker;
        if (invoker_type === InvokerType.Interaction) {
            formattedInvoker = Object.assign(invoker, {
                author: invoker.author,
                content: "",
                attachments: new Collection(),
            }) as unknown as GPTFormattedCommandInteraction;
        }

        const conversation = await getConversation(formattedInvoker as Message);

        // Handle JSON configuration if provided
        if (args.json) {
            try {
                const config = JSON.parse(args.json);
                let configApplied = false;

                // Set model first if provided, since API parameters depend on it
                if (config.model) {
                    const model = findModelByName(config.model);
                    if (!model) {
                        await action.reply(invoker, {
                            content: `model '${config.model}' does not exist.`,
                            ephemeral: guild_config.other.use_ephemeral_replies
                        });
                        return;
                    }
                    // Check whitelist if applicable
                    if (model.whitelist && model.whitelist.length > 0 && !model.whitelist.includes(invoker.author.id)) {
                        await action.reply(invoker, {
                            content: `you do not have access to model '${model.name}'.`,
                            ephemeral: guild_config.other.use_ephemeral_replies
                        });
                        return;
                    }
                    conversation.model = model;
                    configApplied = true;
                }

                // Apply API parameters
                for (const [key, value] of Object.entries(config)) {
                    if (key === 'model') continue; // Already handled above

                    if (typeof value === 'number') {
                        const verifyResponse = verifyAPIParameter(key, value);
                        if (verifyResponse.error) {
                            await action.reply(invoker, {
                                content: `invalid value for ${key}: ${verifyResponse.message}`,
                                ephemeral: guild_config.other.use_ephemeral_replies
                            });
                            return;
                        }
                        (conversation.api_parameters as any)[key] = value;
                        configApplied = true;
                    }
                }

                let appliedConfigs = Object.keys(conversation.api_parameters);
                if (config.model) {
                    appliedConfigs.push("model");
                }

                if (configApplied) {
                    await action.reply(invoker, {
                        content: `configuration applied; changed \`${appliedConfigs.join(", ")}\``,
                        ephemeral: guild_config.other.use_ephemeral_replies
                    });
                    return;
                } else {
                    await action.reply(invoker, {
                        content: "no valid configuration parameters found in JSON",
                        ephemeral: guild_config.other.use_ephemeral_replies
                    });
                    return;
                }
            } catch (error) {
                await action.reply(invoker, {
                    content: `invalid JSON format: ${error instanceof Error ? error.message : 'unknown error'}`,
                    ephemeral: guild_config.other.use_ephemeral_replies
                });
                return;
            }
        }

        const sent = await action.reply(invoker, {
            components: [embedConversation(conversation)],
            components_v2: true,
            ephemeral: guild_config.other.use_ephemeral_replies
        });
        if (!sent) return;

        const collector = sent.createMessageComponentCollector();

        collector.on("collect", async (interaction) => {
            ((interaction as unknown) as CommandInvoker).author = interaction.user;
            if (!conversation.users.includes(interaction.user)) {
                await action.reply(interaction as unknown as CommandInvoker, {
                    content: "you are not part of this conversation, and cannot configure it.",
                    ephemeral: true
                });
                return;
            }
            if (interaction.customId === "configure_parameters") {
                const apiParameterButtons = getAPIParametersButtons(conversation);
                const reply = await action.reply(interaction as unknown as CommandInvoker, {
                    components: [
                        ...apiParameterButtons,
                    ],
                    ephemeral: guild_config.other.use_ephemeral_replies,
                    fetchReply: true
                });

                if (!reply) return;

                const apiparamCollector = reply.createMessageComponentCollector({
                    time: 30 * 60 * 1000 // 30 minute timeout
                });

                apiparamCollector.on("collect", async (apiParameterInteraction) => {
                    const key = apiParameterInteraction.customId.split("edit_api_parameter_")[1];
                    const value = conversation.api_parameters[key as keyof Conversation["api_parameters"]];
                    await apiParameterInteraction.showModal({
                        custom_id: `api_parameter_modal`,
                        title: `API Parameter: ${key}`,
                        components: [
                            new ActionRow({
                                components: [
                                    new TextInput({
                                        custom_id: "api_parameter",
                                        label: `API Parameter: ${key}`,
                                        style: TextInputStyle.Short,
                                        placeholder: `Enter the value of the API parameter`,
                                        required: true,
                                        value: value?.toString() || defaultAPIParameters[key]?.toString() || "unknown",
                                    })
                                ]
                            }) as any
                        ],
                    });
                    const submittedAPIParameter = await apiParameterInteraction.awaitModalSubmit({ time: 20 * 60 * 1000 });
                    (submittedAPIParameter as unknown as CommandInvoker).author = submittedAPIParameter.user;

                    const userValue = parseFloat(submittedAPIParameter.fields.getTextInputValue("api_parameter"));

                    const verifyResponse = verifyAPIParameter(key, userValue);
                    if (verifyResponse.error) {
                        action.reply(submittedAPIParameter as unknown as FormattedCommandInteraction, { content: verifyResponse.message, ephemeral: true });
                        return;
                    }

                    conversation.api_parameters[key as keyof Conversation["api_parameters"]] = userValue;
                    await action.reply(submittedAPIParameter as unknown as FormattedCommandInteraction, { content: `API parameter \`${key}\` set to \`${conversation.api_parameters[key as keyof Conversation["api_parameters"]]}\``, ephemeral: true });
                    await action.edit(sent, {
                        components: [embedConversation(conversation)],
                        components_v2: true,
                        ephemeral: guild_config.other.use_ephemeral_replies
                    });
                })
            } else if (interaction.customId === "configure_model") {
                const modelReply = await action.reply(interaction as unknown as FormattedCommandInteraction, {
                    content: `select a model to use for this conversation. currently selected: \`${conversation.model.name || defaultModel}\``,
                    components: getModelButtons(conversation, false, interaction.user.id),
                    fetchReply: true,
                    ephemeral: true,
                });
                if (!modelReply) return;
                const modelCollector = modelReply.createMessageComponentCollector({ time: 30 * 60 * 1000 });
                modelCollector.on("collect", async (modelInteraction) => {
                    const modelName = modelInteraction.customId.split("edit_model_")[1];
                    const model = findModelByName(modelName);
                    if (!model) { // this should never happen
                        await action.reply(modelInteraction as unknown as CommandInvoker as unknown as FormattedCommandInteraction, {
                            content: `model '${modelName}' does not exist. something has gone terribly wrong.`,
                            ephemeral: true,
                        });
                        return;
                    }
                    conversation.model = model;
                    action.editReply(interaction as unknown as FormattedCommandInteraction, {
                        content: `select a model to use for this prompt. currently selected: \`${conversation.model.name || defaultModel}\``,
                        components: getModelButtons(conversation, false, interaction.user.id),
                    });
                    await action.edit(sent, {
                        components: [embedConversation(conversation)],
                        components_v2: true,
                        ephemeral: guild_config.other.use_ephemeral_replies
                    });
                    modelInteraction.deferUpdate();
                });
                modelCollector.on("end", async () => {
                    if (modelReply) {
                        action.editReply(interaction as unknown as FormattedCommandInteraction, {
                            content: `select a model to use for this prompt. currently selected: \`${conversation.model.name || defaultModel}\``,
                            components: getModelButtons(conversation, true, interaction.user.id),
                        });
                    }
                });
            }
        });
    }
);

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

const allWhitelist = CommandAccessTemplates.dev_only.whitelist.users;

const get = new Command(
    {
        name: 'get',
        description: 'returns your gpt conversation',
        long_description: 'returns your gpt conversation. \nappend any text after the command to receive the raw conversation output.',
        tags: [CommandTag.Debug, CommandTag.AI],
        example_usage: "p/conversation get full",
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'full',
                description: 'whether to return the full conversation output',
                type: CommandOptionType.Boolean,
                required: false,
            }),
        ]
    },
    // Using SingleStringWholeMessage to capture extra text which if non-empty means "full" is true
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["full"]),
    async function execute ({ invoker, args, guild_config, invoker_type }) {
        let formattedInvoker: GPTFormattedCommandInteraction | CommandInvoker = invoker;
        if (invoker_type === InvokerType.Interaction) {
            formattedInvoker = Object.assign(invoker, {
                author: invoker.author,
                content: "",
                attachments: new Collection(),
            }) as unknown as GPTFormattedCommandInteraction;
        }

        const conversation = await getConversation(formattedInvoker as Message);
        // "full" is true if there's any extra text after the command
        const full = !!(args.full && ((typeof args.full === "string") ? args.full.trim().length : true));
        const all = allWhitelist.includes(invoker.author.id) && (typeof args.full === "string") && (args.full == "all")
        if (all) {
            const output = conversations.map((conv) => {
                return conv.serialize(true);
            });
            const file = textToAttachment(output.join("\n\n\n").trim(), "conversations.ansi");
            await action.reply(invoker, { content: "here's all conversations", files: [file], ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({ pipe_data: { input_text: output } });
        }
        const output = conversation.serialize(true);
        const file = textToAttachment(output.trim(), "conversation.ansi");
        await action.reply(invoker, { content: "here's your conversation; if the output looks weird try full screening the file (the \"view whole file\" button on the left)", files: [file], ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { input_text: output } });
    }
);

const clear = new Command(
    {
        name: 'clear',
        description: 'removes you from your current conversation',
        long_description: 'removes your from your current conversation, effectively clearing it and giving the bot dementia.',
        tags: [CommandTag.AI],
        example_usage: "p/conversation clear",
        pipable_to: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ invoker, guild_config, invoker_type }) {
        let formattedInvoker: GPTFormattedCommandInteraction | CommandInvoker = invoker;
        if (invoker_type === InvokerType.Interaction) {
            formattedInvoker = Object.assign(invoker, {
                author: invoker.author,
                content: "",
                attachments: new Collection(),
            }) as unknown as GPTFormattedCommandInteraction;
        }

        const conversation = await getConversation(formattedInvoker as Message);
        conversation.removeUser(invoker.author);
        action.reply(invoker, { content: "removed you from your current conversation", ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const command = new Command(
    {
        name: 'conversation',
        description: 'various gpt conversation related commands',
        long_description: 'allows you to manipulate your conversation with the AI',
        tags: [CommandTag.AI],
        example_usage: "p/conversation get",
        subcommands: {
            deploy:  SubcommandDeploymentApproach.Split,
            list: [get, clear, configurecommand],
        },
        aliases: ["conv", "gpt"],
        options: [],
        pipable_to: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use any of the following subcommands:\n\`${guild_config.other.prefix}conversation get\`: get the current conversation\n\`${guild_config.other.prefix}conversation clear\`: clear the current conversation\n\`${guild_config.other.prefix}conversation configure\`: configure the current conversation`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        await action.reply(invoker, {
            content: `this command does nothing if you don't supply a subcommand. use any of the following subcommands:\n\`${guild_config.other.prefix}conversation get\`: get the current conversation\n\`${guild_config.other.prefix}conversation clear\`: clear the current conversation\n\`${guild_config.other.prefix}conversation configure\`: configure the current conversation`,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
    }
);



export default command;