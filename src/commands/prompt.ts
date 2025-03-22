import { Collection, Message, User } from "discord.js";
import { Command, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getPrompt, getPromptByUsername, getPromptsByUsername, getUserPrompts, Prompt, removePrompt, writePrompt } from "../lib/prompt_manager";
import { userPrompts, generatePrompt } from "../lib/gpt";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, SubcommandDeploymentApproach, CommandOptionType, InvokerType } from "../lib/classes/command_enums";

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
            return new CommandResponse({});
        }
        const sent = await action.reply(invoker, { content: "processing...", ephemeral: guild_config.other.use_ephemeral_replies }) as Message;
        const response = await generatePrompt(args.input as string);
        action.edit(sent, { content: `generated prompt: \`\`\`${response}\`\`\`use ${guild_config.other.prefix}prompt set to use it. (or just pipe it)`, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { input_text: response }});
    }
);

const deflt = new Command({
        name: 'default',
        description: 'toggles your prompt being used as the default prompt',
        long_description: 'toggles whether or not your prompt is used as the default prompt',
        tags: [CommandTag.AI],
        pipable_to: [],
        options: [],
        example_usage: "p/prompt default",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ invoker, guild_config, args }) {
        let prompt = await getUserPrompt(invoker.author);
        const promptDefault = prompt.default;
        prompt.default = !promptDefault;
        await savePrompt(prompt, invoker.author);
        if (!prompt.default) userPrompts.delete(invoker.author.id);
        action.reply(invoker, { content: prompt.default ? `prompt \`${prompt.name}\` is now the default prompt` : "prompt reset to base default", ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const get = new Command({
        name: 'get',
        description: 'returns your current prompt',
        long_description: 'returns your current prompt',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        options: [],
        aliases: [],
        example_usage: "p/prompt get",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ invoker, guild_config, args }) {
        let prompt = await getUserPrompt(invoker.author);
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
\`\`\``,
            ephemeral: guild_config.other.use_ephemeral_replies
        });
        return new CommandResponse({ pipe_data: { input_text: prompt.content }});
    }
);

const publish = new Command({
        name: 'publish',
        description: 'publishes your current prompt',
        long_description: 'publishes your current prompt',
        tags: [CommandTag.AI],
        pipable_to: [],
        options: [],
        aliases: ["unpublish"],
        example_usage: "p/prompt publish",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ invoker, guild_config, args }) {
        let prompt = await getUserPrompt(invoker.author);
        if (prompt.name === "autosave") {
            action.reply(invoker, { content: "you can't publish the autosave prompt", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({})
        }
        prompt.published = !prompt.published;
        prompt.published_at = prompt.published ? new Date() : undefined;
        await savePrompt(prompt, invoker.author);
        await action.reply(invoker, { content: `prompt \`${prompt.name}\` is now ${prompt.published ? "" : "no longer"} published`, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const del = new Command({
        name: 'delete',
        description: 'deletes your current prompt',
        long_description: 'deletes your current prompt',
        tags: [CommandTag.AI],
        pipable_to: [],
        options: [],
        aliases: ["del", "remove", "rem", "rm"],
        example_usage: "p/prompt delete",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ invoker, guild_config, args }) {
        let prompt = await getUserPrompt(invoker.author);
        if (prompt.name === "autosave") {
            action.reply(invoker, { content: "you can't delete the autosave prompt", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({})
        }
        await removePrompt(prompt.name, invoker.author.id);
        userPrompts.delete(invoker.author.id);
        action.reply(invoker, { content: `prompt \`${prompt.name}\` deleted; now using/editing default`, ephemeral: guild_config.other.use_ephemeral_replies });
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
                content: "please supply a description",
                ephemeral: guild_config.other.use_ephemeral_replies
            })
            return new CommandResponse({});
        }
        if (nameBlacklists.includes(args.content as string)) {
            action.reply(invoker, { content: `you can't name your prompt \`${args.content}\`, choose another name`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({})
        }
        if (args.content.includes('/')) { // this will be used later for published prompts
            action.reply(invoker, { content: "prompt names cannot contain `/`", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({})
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
        long_description: 'toggles whether or not your prompt is marked as nsfw',
        tags: [CommandTag.AI],
        pipable_to: [],
        options: [],
        example_usage: "p/prompt nsfw",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ invoker, guild_config, args }) {
        let prompt = await getUserPrompt(invoker.author);
        prompt.nsfw = !prompt.nsfw
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
            })
            return new CommandResponse({});
        }
        let prompt = await getUserPrompt(invoker.author);
        prompt.description = args.content as string;
        await savePrompt(prompt, invoker.author);
        action.reply(invoker, { content: `prompt description of ${prompt.name} set to \`\`\`${prompt.description}\`\`\``, ephemeral: guild_config.other.use_ephemeral_replies });
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
        let reply = `${notUser ? user.username + "'s" : "your"} prompts: \`\`\``;
        if (prompts.length < 10) {
            prompts.forEach(prompt => {
                if (notUser && !prompt.published) return;
                reply += `\n${prompt.name}`;
            });
        } else {
            const columnWidth = Math.max(...prompts.map(prompt => prompt.name.length)) + 4;
            prompts.forEach((prompt, index) => {
                if (index % 3 === 0 && index !== 0) reply += "\n";
                if (notUser && !prompt.published) return;
                reply += prompt.name.padEnd(columnWidth);
            });
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
            return new CommandResponse({});
        }
        const [username, ...promptname] = (args.content as string).split("/");
        if (!username) {
            action.reply(invoker, { content: "please supply the user to clone the prompt from", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        if (!promptname) {
            action.reply(invoker, { content: "please supply the prompt to clone from this user", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        const prompt = await getPromptByUsername(promptname.join("/"), username);
        if (!prompt) {
            action.reply(invoker, { content: `couldn't find prompt \`${promptname}\` from user \`${username}\``, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        if (!prompt.published) {
            action.reply(invoker, { content: `prompt \`${promptname}\` from user \`${username}\` is not published and thus cannot be cloned.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
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
            return new CommandResponse({});
        }
        if ((args.content === "default") || (args.content === "reset")) {
            userPrompts.delete(invoker.author.id);
            action.reply(invoker, { content: "now using default prompt", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        const [username, ...promptname] = (args.content as string).split("/");
        if (username && promptname) {
            const prompt = await getPromptByUsername(promptname.join("/"), username);
            if (!prompt) {
                action.reply(invoker, { content: `couldn't find prompt \`${promptname}\` from user \`${username}\``, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({});
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
            return new CommandResponse({});
        }
        userPrompts.set(invoker.author.id, prompt.name);
        action.reply(invoker, { content: "now using/editing prompt `" + prompt.name + "`", ephemeral: guild_config.other.use_ephemeral_replies });
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
    async function execute ({ invoker, guild_config, args, piped_data }) {
        const content = args.content || piped_data?.data?.input_text
        if (!content) {
            action.reply(invoker, {
                content: "please supply content",
                ephemeral: guild_config.other.use_ephemeral_replies
            })
            return new CommandResponse({});
        }
        let prompt = await getUserPrompt(invoker.author);
        prompt.content = content as string;
        await savePrompt(prompt, invoker.author);
        action.reply(invoker, { content: `prompt content of \`${prompt.name}\` set to \`\`\`${prompt.content}\`\`\`${(prompt.content.split(" ").length < 10) ? `\n\ni suspect your prompt is too short to cause any meaningful change, consider using **${guild_config.other.prefix}prompt generate** to make it longer.` : ""}`, ephemeral: guild_config.other.use_ephemeral_replies });
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
            list: [set, use, list, description, nsfw, name, del, publish, get, deflt, clone, generate],
        },
        options: [],
        example_usage: "p/prompt set always respond with \"hi\"",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, guild_config, args }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: "invalid subcommand: " + args.subcommand,
                ephemeral: guild_config.other.use_ephemeral_replies,
            })
            return;
        }
        action.reply(invoker, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: guild_config.other.use_ephemeral_replies
        })
    }
);

export default command;