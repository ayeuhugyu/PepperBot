import { Collection, Message, ModalBuilder, User } from "discord.js";
import { Command, CommandInvoker, CommandOption, CommandResponse, FormattedCommandInteraction } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getPrompt, getPromptByUsername, getPromptsByUsername, getUserPrompts, Prompt, removePrompt, writePrompt } from "../lib/prompt_manager";
import { userPrompts, generatePrompt, GPTModelName, APIParameters, models } from "../lib/gpt";
import { CommandAccessTemplates, getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, SubcommandDeploymentApproach, CommandOptionType, InvokerType } from "../lib/classes/command_enums";
import { tablify } from "../lib/string_helpers";
import { Button, ButtonStyle, Container, Section, Separator, TextDisplay, TextInput, TextInputStyle, ActionRow } from "../lib/classes/components";

async function getUserPrompt(user: User): Promise<Prompt> {
    let prompt = await getPrompt(userPrompts.get(user.id) || "autosave", user.id)
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
    userPrompts.set(user.id, prompt.name);
    writePrompt(prompt);
}

function embedPrompt(prompt: Prompt, disabled: boolean = false) {
    return new Container({
        components: [
            new TextDisplay({
                content: `editing prompt \`${prompt.name}\`\n-# created at: <t:${Math.floor(prompt.created_at as unknown as number / 1000)}:F>\n-# last updated at: <t:${Math.floor(prompt.updated_at as unknown as number / 1000)}:F>${prompt.published ? `\n-# published at: <t:${Math.floor((prompt.published_at as unknown as number || 1) / 1000)}:F>` : ""}`,
            }),
            new Separator(),
            new Section({
                components: [
                    new TextDisplay({
                        content: `**Name**\n${prompt.name}`
                    }),
                ],
                accessory: new Button({
                    style: ButtonStyle.Primary,
                    label: "Edit",
                    custom_id: `edit_prompt_name`,
                    disabled: disabled
                })
            }),
            new Separator(),
            new Section({
                components: [
                    new TextDisplay({
                        content: `**Description**\n${prompt.description}`
                    }),
                ],
                accessory: new Button({
                    style: ButtonStyle.Primary,
                    label: "Edit",
                    custom_id: `edit_prompt_description`,
                    disabled: disabled
                })
            }),
            new Separator(),
            new Section({
                components: [
                    new TextDisplay({
                        content: `**Prompt**\n${prompt.content}`
                    }),
                ],
                accessory: new Button({
                    style: ButtonStyle.Primary,
                    label: "Edit",
                    custom_id: `edit_prompt_content`,
                    disabled: disabled
                })
            }),
            new Separator(),
            new Section({
                components: [
                    new TextDisplay({
                        content: `**NSFW**\n${prompt.nsfw ? "true" : "false"}`
                    }),
                ],
                accessory: new Button({
                    style: prompt.nsfw ? ButtonStyle.Danger : ButtonStyle.Success,
                    label: prompt.nsfw ? "Unmark" : "Mark",
                    custom_id: nsfw ? `edit_prompt_nsfw` : `edit_prompt_nsfw`,
                    disabled: disabled
                })
            }),
            new Section({
                components: [
                    new TextDisplay({
                        content: `**Default**\n${prompt.default ? "true" : "false"}`
                    }),
                ],
                accessory: new Button({
                    style: prompt.default ? ButtonStyle.Danger : ButtonStyle.Success,
                    label: prompt.default ? "Unmark" : "Mark",
                    custom_id: prompt.default ? `edit_prompt_default` : `edit_prompt_default`,
                    disabled: disabled
                })
            }),
            new Section({
                components: [
                    new TextDisplay({
                        content: `**Published**\n${prompt.published ? "true" : "false"}`
                    }),
                ],
                accessory: new Button({
                    style: prompt.published ? ButtonStyle.Danger : ButtonStyle.Success,
                    label: prompt.published ? "Unpublish" : "Publish",
                    custom_id: prompt.published ? `edit_prompt_publish` : `edit_prompt_publish`,
                    disabled: disabled
                })
            }),
            new Separator(),
            new TextDisplay({
                content: `for advanced editing of this prompt such as changing API parameters and AI model, use the commands.`
            })
        ]
    })
}

const build = new Command(
    {
        name: 'build',
        description: 'allows you to build a prompt more easily from a menu',
        long_description: 'allows you to build a prompt more easily from an interactive menu with buttons to adjust the settings of the prompt',
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
        aliases: ["builder", "edit"],
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
        prompt = await getUserPrompt(invoker.author);
        const sent = await action.reply(invoker, {
            components: [embedPrompt(prompt)],
            ephemeral: guild_config.other.use_ephemeral_replies,
            components_v2: true
        }) as Message;
        const collector = sent.createMessageComponentCollector({ time: 60 * 60 * 1000 }); // 1 hour

        collector.on('end', async () => {
            if (sent) {
                action.edit(sent, {
                    components: [embedPrompt(prompt, true)]
                });
            }
        });

        collector.on('collect', async (interaction) => {
            (interaction as unknown as FormattedCommandInteraction).author = interaction.user;
            if (interaction.user.id !== invoker.author.id) {
                action.reply((interaction as unknown as FormattedCommandInteraction), { content: "this is not your prompt", ephemeral: true });
                return;
            }

            switch (interaction.customId) {
                case "edit_prompt_nsfw":
                    prompt.nsfw = !prompt.nsfw;
                    await savePrompt(prompt, invoker.author);
                    action.edit(sent, { components: [embedPrompt(prompt)] });
                    interaction.deferUpdate();
                    break;
                case "edit_prompt_default":
                    prompt.default = !prompt.default;
                    await savePrompt(prompt, invoker.author);
                    action.edit(sent, { components: [embedPrompt(prompt)] });
                    interaction.deferUpdate();
                    break;
                case "edit_prompt_publish":
                    prompt.published = !prompt.published;
                    prompt.published_at = prompt.published ? new Date() : undefined;
                    await savePrompt(prompt, invoker.author);
                    action.edit(sent, { components: [embedPrompt(prompt)] });
                    interaction.deferUpdate();
                    break;
                case "edit_prompt_name":
                    await interaction.showModal({
                        custom_id: "prompt_name_modal",
                        title: "Prompt Name",
                        components: [
                            new ActionRow({
                                components: [
                                    new TextInput({
                                        custom_id: "prompt_name",
                                        label: "Prompt Name",
                                        style: TextInputStyle.Short,
                                        placeholder: "Enter the name of the prompt",
                                        required: true,
                                        value: prompt.name
                                    })
                                ]
                            }) as any
                        ]
                    });
                    const submittedName = await interaction.awaitModalSubmit({ time: 20 * 60 * 1000 });
                    (submittedName as unknown as FormattedCommandInteraction).author = submittedName.user;
                    const name = submittedName.fields.getTextInputValue("prompt_name");
                    if (nameBlacklists.includes(name)) {
                        action.reply(submittedName as unknown as FormattedCommandInteraction, { content: `you can't name your prompt \`${name}\`, choose another name`, ephemeral: true });
                        return;
                    }
                    if (name.includes('/')) { // this will be used later for published prompts
                        action.reply(submittedName as unknown as FormattedCommandInteraction, { content: "prompt names cannot contain `/`", ephemeral: true });
                        return;
                    }
                    prompt.name = name;
                    prompt.created_at = new Date();
                    await savePrompt(prompt, invoker.author);
                    userPrompts.set(invoker.author.id, prompt.name);
                    action.reply(submittedName as unknown as FormattedCommandInteraction, { content: `prompt name set to \`${prompt.name}\``, ephemeral: true });
                    action.edit(sent, { components: [embedPrompt(prompt)] });
                    break;
                case "edit_prompt_description":
                    await interaction.showModal({
                        custom_id: "prompt_description_modal",
                        title: "Prompt Description",
                        components: [
                            new ActionRow({
                                components: [
                                    new TextInput({
                                        custom_id: "prompt_description",
                                        label: "Prompt Description",
                                        style: TextInputStyle.Paragraph,
                                        placeholder: "Enter the description of the prompt",
                                        required: true,
                                        value: prompt.description
                                    })
                                ]
                            }) as any
                        ]
                    });
                    const submittedDescription = await interaction.awaitModalSubmit({ time: 20 * 60 * 1000 });
                    (submittedDescription as unknown as FormattedCommandInteraction).author = submittedDescription.user;
                    prompt.description = submittedDescription.fields.getTextInputValue("prompt_description");
                    await savePrompt(prompt, invoker.author);
                    action.reply(submittedDescription as unknown as FormattedCommandInteraction, { content: `prompt description set to \`${prompt.description}\``, ephemeral: true });
                    action.edit(sent, { components: [embedPrompt(prompt)] });
                    break;
                case "edit_prompt_content":
                    await interaction.showModal({
                        custom_id: "prompt_content_modal",
                        title: "Prompt Content",
                        components: [
                            new ActionRow({
                                components: [
                                    new TextInput({
                                        custom_id: "prompt_content",
                                        label: "Prompt Content",
                                        style: TextInputStyle.Paragraph,
                                        placeholder: "Enter the content of the prompt",
                                        required: true,
                                        value: prompt.content
                                    })
                                ]
                            }) as any
                        ]
                    });
                    const submittedContent = await interaction.awaitModalSubmit({ time: 20 * 60 * 1000 });
                    (submittedContent as unknown as FormattedCommandInteraction).author = submittedContent.user;
                    prompt.content = submittedContent.fields.getTextInputValue("prompt_content");
                    await savePrompt(prompt, invoker.author);
                    action.reply(submittedContent as unknown as FormattedCommandInteraction, { content: `prompt content set to \`${prompt.content}\``, ephemeral: true });
                    action.edit(sent, { components: [embedPrompt(prompt)] });
                    break;
                default:
                    action.reply(invoker, { content: "what the fuck did you do. how did you press a non existant button.", ephemeral: true });
                    break;
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
    async function execute ({ invoker, guild_config, args }) {
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
        action.edit(sent, { content: `generated prompt: \`\`\`\n${response}\`\`\`use ${guild_config.other.prefix}prompt set to use it. (or just pipe it)`, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { input_text: response }});
    }
);

const deflt = new Command({
        name: 'default',
        description: 'toggles a prompt being used as the default prompt',
        long_description: 'toggles whether or not a prompt is used as the default prompt. If no prompt name is provided, it uses the current prompt you are using.',
        tags: [CommandTag.AI],
        pipable_to: [],
        options: [
            new CommandOption({
            name: 'name',
            description: 'the name of the prompt to toggle as default',
            type: CommandOptionType.String,
            required: false,
            })
        ],
        example_usage: "p/prompt default myprompt",
        argument_order: "<name?>",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["name"]),
    async function execute ({ invoker, guild_config, args }) {
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
        } else {
            prompt = await getUserPrompt(invoker.author);
        }

        const promptDefault = prompt.default;
        prompt.default = !promptDefault;
        await savePrompt(prompt, invoker.author);
        if (!prompt.default) userPrompts.delete(invoker.author.id);
        action.reply(invoker, { content: prompt.default ? `prompt \`${prompt.name}\` is now the default prompt. if you want to go back to the base default prompt, use the command again.` : "prompt reset to base default", ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const get = new Command({
        name: 'get',
        description: 'returns your current prompt or a specified prompt',
        long_description: 'returns your current prompt or a specified prompt by name',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
            name: 'name',
            description: 'the name of the prompt to retrieve',
            type: CommandOptionType.String,
            required: false,
            })
        ],
        aliases: [],
        example_usage: "p/prompt get myprompt",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["name"]),
    async function execute ({ invoker, guild_config, args }) {
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
        } else {
            prompt = await getUserPrompt(invoker.author);
        }

        action.reply(invoker, {
            content: `\`\`\`
    name: ${prompt.name}
    description: ${prompt.description}
    content: ${prompt.content}

    created at: ${new Date(prompt.created_at).toLocaleString()}
    last updated at: ${new Date(prompt.updated_at).toLocaleString()}
    ${prompt.published ? `published at: ${new Date(prompt.published_at || "").toLocaleString()}\n` : ""}
    nsfw: ${prompt.nsfw ? "true" : "false"}
    default: ${prompt.default ? "true" : "false"}

    api parameters:
    ${Object.entries(prompt.api_parameters).map(([key, value]) => `    ${key}: ${value}`).join("\n")}
    \`\`\``,
            ephemeral: guild_config.other.use_ephemeral_replies
        });
        return new CommandResponse({ pipe_data: { input_text: prompt.content }});
    }
);

const publish = new Command({
        name: 'publish',
        description: 'publishes a specified prompt or your current prompt',
        long_description: 'publishes a specified prompt or your current prompt',
        tags: [CommandTag.AI],
        pipable_to: [],
        options: [
            new CommandOption({
            name: 'name',
            description: 'the name of the prompt to publish',
            type: CommandOptionType.String,
            required: false,
            })
        ],
        aliases: ["unpublish"],
        example_usage: "p/prompt publish myprompt",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["name"]),
    async function execute ({ invoker, guild_config, args }) {
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
        } else {
            prompt = await getUserPrompt(invoker.author);
        }

        if (prompt.name === "autosave") {
            action.reply(invoker, { content: "you can't publish the autosave prompt", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
            error: true,
            message: "you can't publish the autosave prompt",
            });
        }

        prompt.published = !prompt.published;
        prompt.published_at = prompt.published ? new Date() : undefined;
        await savePrompt(prompt, invoker.author);
        await action.reply(invoker, { content: `prompt \`${prompt.name}\` is now ${prompt.published ? "" : "no longer"} published`, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const del = new Command({
        name: 'delete',
        description: 'deletes your current prompt or a specified prompt',
        long_description: 'deletes your current prompt or a specified prompt by name',
        tags: [CommandTag.AI],
        pipable_to: [],
        options: [
            new CommandOption({
            name: 'name',
            description: 'the name of the prompt to delete',
            type: CommandOptionType.String,
            required: false,
            })
        ],
        aliases: ["del", "remove", "rem", "rm"],
        example_usage: "p/prompt delete myprompt",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["name"]),
    async function execute ({ invoker, guild_config, args }) {
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
        } else {
            prompt = await getUserPrompt(invoker.author);
        }

        if (prompt.name === "autosave") {
            action.reply(invoker, { content: "you can't delete the autosave prompt", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
            error: true,
            message: "you can't delete the autosave prompt",
            });
        }

        await removePrompt(prompt.name, invoker.author.id);
        if (!args.name) userPrompts.delete(invoker.author.id);
        action.reply(invoker, { content: `prompt \`${prompt.name}\` deleted${!args.name ? "; now using/editing default" : ""}`, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

let nameBlacklists = ["reset", "default", "autosave"]

const name = new Command({
        name: 'name',
        description: 'sets the name of your prompt',
        long_description: 'sets the name of your current prompt',
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
        userPrompts.set(invoker.author.id, prompt.name);
        action.reply(invoker, { content: `prompt name set to \`${prompt.name}\`; now using/editing prompt \`${prompt.name}\``, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const nsfw = new Command({
        name: 'nsfw',
        description: 'toggles your prompt being marked as nsfw',
        long_description: 'toggles whether or not your prompt is marked as nsfw. If no prompt name is provided, it uses the current prompt you are using.',
        tags: [CommandTag.AI],
        pipable_to: [],
        options: [
            new CommandOption({
            name: 'name',
            description: 'the name of the prompt to toggle as nsfw',
            type: CommandOptionType.String,
            required: false,
            })
        ],
        example_usage: "p/prompt nsfw myprompt",
        argument_order: "<name?>",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["name"]),
    async function execute ({ invoker, guild_config, args }) {
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
        } else {
            prompt = await getUserPrompt(invoker.author);
        }

        prompt.nsfw = !prompt.nsfw;
        await savePrompt(prompt, invoker.author);
        action.reply(invoker, { content: `prompt \`${prompt.name}\` is ${prompt.nsfw ? "now marked as nsfw" : "no longer marked as nsfw"}`, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const description = new Command({
        name: 'description',
        description: 'sets the description of the prompt',
        long_description: 'sets the description of your current prompt',
        tags: [CommandTag.AI],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'content',
                description: 'the content to set the prompt description to',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        example_usage: "p/prompt description makes him always respond with hi",
        argument_order: "<content>",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["content"]),
    async function execute ({ invoker, guild_config, args }) {
        if (!args.content) {
            action.reply(invoker, {
                content: "please supply a description",
                ephemeral: guild_config.other.use_ephemeral_replies
            });
            return new CommandResponse({
                error: true,
                message: "please supply a description",
            });
        }
        let prompt = await getUserPrompt(invoker.author);
        prompt.description = args.content as string;
        await savePrompt(prompt, invoker.author);
        action.reply(invoker, { content: `prompt description of ${prompt.name} set to \`\`\`\n${prompt.description}\`\`\``, ephemeral: guild_config.other.use_ephemeral_replies });
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
    async function getArguments({ invoker, guild_config, command_name_used }) {
        invoker = invoker as CommandInvoker<InvokerType.Message>;
        const args: Record<string, (User | Boolean | string) | undefined> = {};
        const commandLength = `${guild_config.other.prefix}${command_name_used}`.length;
        const arg = invoker.content.slice(commandLength)?.trim();
        const hadArg = arg && arg.length > 0;
        let user = invoker.mentions.users.first();
        if (!user) {
            user = invoker.client.users.cache.get(arg);
        }
        if (!user) {
            user = invoker.client.users.cache.find(user => user.username.toLowerCase() === arg?.toLowerCase());
        }
        args.usedArg = arg;
        args.user = user;
        args.hadArg = hadArg || undefined;
        return args;
    },
    async function execute ({ invoker, guild_config, args }) {
        if (args.hadArg && !args.user) {
            action.reply(invoker, { content: "couldn't find user: " + args.usedArg, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        let user = args.user as User || invoker.author as User;
        let notUser = user !== invoker.author;
        let prompts = await getUserPrompts(user.id);
        if (prompts.length === 0) {
            prompts = await getPromptsByUsername(user.username);
        }
        if (prompts.length === 0) {
            action.reply(invoker, { content: `${notUser ? user.username : "you"} ${notUser ? "has" : "have"} no ${notUser ? "published" : ""} prompts`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        let reply = `${notUser ? user.username + "'s" : "your"} prompts: \`\`\`\n`;
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

const clone = new Command({
        name: 'clone',
        description: 'clones another users prompt. formatted as user/prompt',
        long_description: 'allows you to clone a prompt from another user so long as its published. this is formatted as "username/prompt name", similarly to github repository urls. ',
        tags: [CommandTag.AI],
        pipable_to: [],
        aliases: ["copy"],
        root_aliases: [],
        options: [
            new CommandOption({
                name: 'content',
                description: 'the name of the prompt to use',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        example_usage: "p/prompt clone PepperBot/default",
        argument_order: "<content>",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["content"]),
    async function execute ({ invoker, guild_config, args }) {
        if (!args.content) {
            action.reply(invoker, {
                content: "please supply a prompt to clone",
                ephemeral: guild_config.other.use_ephemeral_replies
            })
            return new CommandResponse({
                error: true,
                message: "please supply a prompt to clone",
            });
        }
        const [username, ...promptname] = (args.content as string).split("/");
        if (!username) {
            action.reply(invoker, { content: "please supply the user to clone the prompt from", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "please supply the user to clone the prompt from",
            });
        }
        if (!promptname) {
            action.reply(invoker, { content: "please supply the prompt to clone from this user", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "please supply the prompt to clone from this user",
            });
        }
        const prompt = await getPromptByUsername(promptname.join("/"), username);
        if (!prompt) {
            action.reply(invoker, { content: `couldn't find prompt \`${promptname}\` from user \`${username}\``, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `couldn't find prompt \`${promptname}\` from user \`${username}\``,
            });
        }
        if (!prompt.published) {
            action.reply(invoker, { content: `prompt \`${promptname}\` from user \`${username}\` is not published and thus cannot be cloned.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `prompt \`${promptname}\` from user \`${username}\` is not published and thus cannot be cloned.`,
            });
        }
        const newPrompt = new Prompt({
            author_id: invoker.author.id,
            author_username: invoker.author.username,
            author_avatar: invoker.author.displayAvatarURL(),
            name: prompt.name,
            content: prompt.content,
            description: prompt.description,
            nsfw: prompt.nsfw,
            created_at: prompt.created_at,
            published: false,
        });
        await writePrompt(newPrompt);
        userPrompts.set(invoker.author.id, newPrompt.name);
        action.reply(invoker, { content: `cloned \`${args.content}\`; now using/editing prompt \`${promptname}\``, ephemeral: guild_config.other.use_ephemeral_replies });
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
                type: CommandOptionType.String,
                required: true,
            })
        ],
        example_usage: "p/prompt use myprompt",
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
        const [username, ...promptname] = (args.content as string).split("/");
        if ((username && promptname) && args.content.includes("/")) {
            const prompt = await getPromptByUsername(promptname.join("/"), username);
            if (!prompt) {
                action.reply(invoker, { content: `couldn't find prompt \`${promptname}\` from user \`${username}\``, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: `couldn't find prompt \`${promptname}\` from user \`${username}\``,
                });
            }
            const newPrompt = new Prompt({
                author_id: invoker.author.id,
                author_username: invoker.author.username,
                author_avatar: invoker.author.displayAvatarURL(),
                name: prompt.name,
                content: prompt.content,
                description: prompt.description,
                nsfw: prompt.nsfw,
                created_at: prompt.created_at,
                published: false,
            });
            await writePrompt(newPrompt);
            userPrompts.set(invoker.author.id, newPrompt.name);
            action.reply(invoker, { content: `now using/editing prompt \`${promptname}\``, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        const prompt = await getPrompt(args.content as string, invoker.author.id);
        if (!prompt) {
            action.reply(invoker, { content: `couldn't find prompt: \`${args.content}\``, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `couldn't find prompt: \`${args.content}\``,
            });
        }
        userPrompts.set(invoker.author.id, prompt.name);
        action.reply(invoker, { content: "now using/editing prompt `" + prompt.name + "`", ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const modelcommand = new Command(
    {
        name: 'model',
        description: 'set the model for your prompt',
        long_description: 'allows you to change which AI model your prompt uses',
        tags: [],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'model',
                description: 'the AI model to use for the prompt.',
                long_description: 'the AI model to use for the prompt. ',
                type: CommandOptionType.String,
                required: true,
                choices: Object.keys(GPTModelName).map(key => {
                    // Filter out the numeric keys from the enum
                    if (isNaN(Number(key))) {
                        return { name: key, value: key };
                    }
                }).filter(choice => choice !== undefined) as { name: string, value: string }[] // Filter out undefined values
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/prompt model gpt-3.5-turbo",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["model"]),
    async function execute ({ invoker, args, guild_config }) {
        if (!args.model) {
            await action.reply(invoker, {
                content: "you must provide a model name or 'list'/'ls' to view available models.",
                ephemeral: guild_config.useEphemeralReplies,
            });
            return new CommandResponse({
                error: true,
                message: "you must provide a model name or 'list'/'ls' to view available models.",
            });
        }

        if (args.model === "list" || args.model === "ls") {
            const mappedModels = Object.entries(models).map(([key, value]) => {
                return `${value.name}:
  - provider: ${value.provider}
  - capabilities: ${value.capabilities ? value.capabilities.join(", ") : "none"}
                `
            });
            await action.reply(invoker, {
                content: `available models: \`\`\`md\n${mappedModels.join("\n")}\`\`\``,
                ephemeral: guild_config.useEphemeralReplies,
            });
            return;
        }
        const modelName = GPTModelName[args.model as keyof typeof GPTModelName]
            || GPTModelName[args.model.toUpperCase() as keyof typeof GPTModelName]
            || GPTModelName[args.model.toLowerCase() as keyof typeof GPTModelName]
            || Object.keys(GPTModelName).find(key => key.startsWith(args.model))
            || Object.values(GPTModelName).find(value => typeof value === "string" && value.startsWith(args.model));
        const modelInfo = models[modelName];
        if (!modelInfo) {
            await action.reply(invoker, {
                content: `model '${args.model}' does not exist. use 'list' or 'ls' to view available models.`,
                ephemeral: guild_config.useEphemeralReplies,
            });
            return new CommandResponse({
                error: true,
                message: `model '${args.model}' does not exist. use 'list' or 'ls' to view available models.`,
            });
        }

        const prompt = await getUserPrompt(invoker.author);
        const apiParameters = new APIParameters(prompt.api_parameters);
        // Update the model in the conversation
        prompt.api_parameters.model = modelInfo.name;

        await savePrompt(prompt, invoker.author);
        await action.reply(invoker, {
            content: `set current model to ${modelInfo.name}`,
            ephemeral: guild_config.useEphemeralReplies,
        });
    }
);

const templateAPIParameters = new APIParameters();

const setparam = new Command(
    {
        name: 'setparam',
        description: 'allows you to change parameters for the prompt',
        long_description: 'allows you to change parameters for the prompt, notably things like temperature and top_p',
        tags: [CommandTag.AI],
        example_usage: "p/prompt setparam temperature 1",
        options: [
            new CommandOption({
                name: 'parameter',
                description: 'the parameter to change',
                type: CommandOptionType.String,
                required: true,
                choices: Object.keys(templateAPIParameters)
                    .filter(key => key !== "model")
                    .map(key => { return { name: key, value: key } })
            }),
            new CommandOption({
                name: 'value',
                description: 'the value to set the parameter to',
                type: CommandOptionType.Number,
                required: true,
            })
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.TwoStringFirstSpaceSecondWholeMessage, ["parameter", "value"]),
    async function execute ({ args, invoker, guild_config }) {
        if (!args.parameter) {
            action.reply(invoker, { content: "parameter is required", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "parameter is required",
            });
        }
        if (!args.value) {
            action.reply(invoker, { content: "value is required", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "value is required",
            });
        }
        const parameter = args.parameter;
        const value = args.value;
        if (!templateAPIParameters.hasOwnProperty(parameter)) {
            action.reply(invoker, { content: `invalid parameter: \`${parameter}\`. must be one of the following: \`${Object.keys(templateAPIParameters).filter(key => key !== "model").join(", ")}\``, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `invalid parameter: \`${parameter}\`. must be one of the following: \`${Object.keys(templateAPIParameters).filter(key => key !== "model").join(", ")}\``,
            });
        }
        // constraints on values
        switch (parameter) {
            case "temperature": {
                if (value < 0 || value > 2) {
                    action.reply(invoker, { content: "temperature must be between 0 and 2", ephemeral: guild_config.other.use_ephemeral_replies });
                    return;
                }
                break;
            }
            case "top_p": {
                if (value < 0 || value > 1) {
                    action.reply(invoker, { content: "top_p must be between 0 and 1", ephemeral: guild_config.other.use_ephemeral_replies });
                    return;
                }
                break;
            }
            case "presence_penalty": {
                if (value < -2 || value > 2) {
                    action.reply(invoker, { content: "presence_penalty must be between -2 and 2", ephemeral: guild_config.other.use_ephemeral_replies });
                    return;
                }
                break;
            }
            case "frequency_penalty": {
                if (value < -2 || value > 2) {
                    action.reply(invoker, { content: "frequency_penalty must be between -2 and 2", ephemeral: guild_config.other.use_ephemeral_replies });
                    return;
                }
                break;
            }
            case "max_tokens": {
                if (value < 0 || value > 4096) {
                    action.reply(invoker, { content: "max_tokens must be between 0 and 4096", ephemeral: guild_config.other.use_ephemeral_replies });
                    return;
                }
                break;
            }
            default: break;
        }
        const prompt = await getUserPrompt(invoker.author);
        type APIParameterKeys = Exclude<keyof APIParameters, "model">;
        const defaultValue = templateAPIParameters[parameter as APIParameterKeys];
        if (parseInt(value) == defaultValue) {
            delete prompt.api_parameters[parameter as APIParameterKeys];
        } else {
            prompt.api_parameters[parameter as APIParameterKeys] = parseFloat(value);
        }

        await action.reply(invoker, { content: `set \`${parameter}\` to \`${value}\``, ephemeral: guild_config.other.use_ephemeral_replies });

        await savePrompt(prompt, invoker.author);
        return;
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
        action.reply(invoker, { content: `prompt content of \`${prompt.name}\` set to \`\`\`\n${prompt.content}\`\`\`${(prompt.content.split(" ").length < 10) ? `\n\ni suspect your prompt is too short to cause any meaningful change, consider using **${guild_config.other.prefix}prompt generate** to make it longer.` : ""}`, ephemeral: guild_config.other.use_ephemeral_replies });
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
            list: [set, use, list, description, nsfw, name, del, publish, get, deflt, clone, generate, modelcommand, setparam, build],
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