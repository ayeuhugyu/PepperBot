import { Collection, Message, User } from "discord.js";
import { Command, CommandCategory, CommandOption, CommandOptionType, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getPrompt, getPromptByUsername, getUserPrompts, Prompt, removePrompt, writePrompt } from "../lib/prompt_manager";
import { userPrompts } from "../lib/gpt";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";

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

const deflt = new Command({
        name: 'default',
        description: 'toggles your prompt being used as the default prompt',
        long_description: 'toggles whether or not your prompt is used as the default prompt',
        category: CommandCategory.AI,
        pipable_to: [],
        options: [],
        example_usage: "p/prompt default",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ message, guildConfig, args }) {
        let prompt = await getUserPrompt(message.author);
        const promptDefault = prompt.default;
        prompt.default = !promptDefault;
        await savePrompt(prompt, message.author);
        if (!prompt.default) userPrompts.delete(message.author.id);
        action.reply(message, { content: prompt.default ? `prompt \`${prompt.name}\` is now the default prompt` : "prompt reset to base default", ephemeral: guildConfig.other.use_ephemeral_replies });
    }
);

const get = new Command({
        name: 'get',
        description: 'returns your current prompt',
        long_description: 'returns your current prompt',
        category: CommandCategory.AI,
        pipable_to: ['grep'],
        options: [],
        aliases: [],
        example_usage: "p/prompt get",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ message, guildConfig, args }) {
        let prompt = await getUserPrompt(message.author);
        action.reply(message, {
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
            ephemeral: guildConfig.other.use_ephemeral_replies
        });
        return new CommandResponse({ pipe_data: { grep_text: prompt.content }});
    }
);

const publish = new Command({
        name: 'publish',
        description: 'publishes your current prompt',
        long_description: 'publishes your current prompt',
        category: CommandCategory.AI,
        pipable_to: [],
        options: [],
        aliases: ["unpublish"],
        example_usage: "p/prompt publish",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ message, guildConfig, args }) {
        let prompt = await getUserPrompt(message.author);
        if (prompt.name === "autosave") {
            action.reply(message, { content: "you can't publish the autosave prompt", ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({})
        }
        prompt.published = !prompt.published;
        prompt.published_at = prompt.published ? new Date() : undefined;
        await savePrompt(prompt, message.author);
        await action.reply(message, { content: `prompt \`${prompt.name}\` is now ${prompt.published ? "" : "no longer"} published`, ephemeral: guildConfig.other.use_ephemeral_replies });
    }
);

const del = new Command({
        name: 'delete',
        description: 'deletes your current prompt',
        long_description: 'deletes your current prompt',
        category: CommandCategory.AI,
        pipable_to: [],
        options: [],
        aliases: ["del", "remove", "rem", "rm"],
        example_usage: "p/prompt delete",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ message, guildConfig, args }) {
        let prompt = await getUserPrompt(message.author);
        if (prompt.name === "autosave") {
            action.reply(message, { content: "you can't delete the autosave prompt", ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({})
        }
        await removePrompt(prompt.name, message.author.id);
        userPrompts.delete(message.author.id);
        action.reply(message, { content: `prompt \`${prompt.name}\` deleted; now using/editing default`, ephemeral: guildConfig.other.use_ephemeral_replies });
    }
);

let nameBlacklists = ["reset", "default", "autosave"]

const name = new Command({
        name: 'name',
        description: 'sets the name of your prompt',
        long_description: 'sets the name of your current prompt',
        category: CommandCategory.AI,
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
    async function execute ({ message, guildConfig, args }) {
        if (!args?.get("content")) {
            action.reply(message, {
                content: "please supply a description",
                ephemeral: guildConfig.other.use_ephemeral_replies
            })
            return new CommandResponse({});
        }
        if (nameBlacklists.includes(args?.get('content') as string)) {
            action.reply(message, { content: `you can't name your prompt \`${args.get("content")}\`, choose another name`, ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({})
        }
        if (args.get("content").includes('/')) { // this will be used later for published prompts
            action.reply(message, { content: "prompt names cannot contain `/`", ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({})
        }
        let prompt = await getUserPrompt(message.author);
        prompt.name = args?.get('content') as string;
        prompt.created_at = new Date();
        await savePrompt(prompt, message.author);
        userPrompts.set(message.author.id, prompt.name);
        action.reply(message, { content: `prompt name set to \`${prompt.name}\`; now using/editing prompt \`${prompt.name}\``, ephemeral: guildConfig.other.use_ephemeral_replies });
    }
);

const nsfw = new Command({
        name: 'nsfw',
        description: 'toggles your prompt being marked as nsfw',
        long_description: 'toggles whether or not your prompt is marked as nsfw',
        category: CommandCategory.AI,
        pipable_to: [],
        options: [],
        example_usage: "p/prompt nsfw",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ message, guildConfig, args }) {
        let prompt = await getUserPrompt(message.author);
        prompt.nsfw = !prompt.nsfw
        await savePrompt(prompt, message.author);
        action.reply(message, { content: `prompt \`${prompt.name}\` is ${prompt.nsfw ? "now marked as nsfw" : "no longer marked as nsfw"}`, ephemeral: guildConfig.other.use_ephemeral_replies });
    }
);

const description = new Command({
        name: 'description',
        description: 'sets the description of the prompt',
        long_description: 'sets the description of your current prompt',
        category: CommandCategory.AI,
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
    async function execute ({ message, guildConfig, args }) {
        if (!args?.get("content")) {
            action.reply(message, {
                content: "please supply a description",
                ephemeral: guildConfig.other.use_ephemeral_replies
            })
            return new CommandResponse({});
        }
        let prompt = await getUserPrompt(message.author);
        prompt.description = args?.get('content') as string;
        await savePrompt(prompt, message.author);
        action.reply(message, { content: `prompt description of ${prompt.name} set to \`\`\`${prompt.description}\`\`\``, ephemeral: guildConfig.other.use_ephemeral_replies });
    }
);

const list = new Command({
        name: 'list',
        description: 'lists your prompts',
        long_description: 'lists your prompts',
        category: CommandCategory.AI,
        pipable_to: [],
        options: [],
        example_usage: "p/prompt list",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ message, guildConfig }) {
        const prompts = await getUserPrompts(message.author.id);
        let reply = "your prompts: ```";
        if (prompts.length < 10) {
            prompts.forEach(prompt => {
                reply += `\n${prompt.name}`;
            });
        } else {
            const columnWidth = Math.max(...prompts.map(prompt => prompt.name.length)) + 4;
            prompts.forEach((prompt, index) => {
                if (index % 3 === 0 && index !== 0) reply += "\n";
                reply += prompt.name.padEnd(columnWidth);
            });
        }
        reply += "```";
        action.reply(message, { content: reply, ephemeral: guildConfig.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { grep_text: reply }});
    }
);

const clone = new Command({
        name: 'clone',
        description: 'clones another users prompt. formatted as user/prompt',
        long_description: 'allows you to clone a prompt from another user so long as its published. this is formatted as "username/prompt name", similarly to github repository urls. ',
        category: CommandCategory.AI,
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
    async function execute ({ message, guildConfig, args }) {
        if (!args?.get("content")) {
            action.reply(message, {
                content: "please supply a prompt to clone",
                ephemeral: guildConfig.other.use_ephemeral_replies
            })
            return new CommandResponse({});
        }
        const [username, ...promptname] = (args.get("content") as string).split("/");
        if (!username) {
            action.reply(message, { content: "please supply the user to clone the prompt from", ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        if (!promptname) {
            action.reply(message, { content: "please supply the prompt to clone from this user", ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        const prompt = await getPromptByUsername(promptname.join("/"), username);
        if (!prompt) {
            action.reply(message, { content: `couldn't find prompt \`${promptname}\` from user \`${username}\``, ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        if (!prompt.published) {
            action.reply(message, { content: `prompt \`${promptname}\` from user \`${username}\` is not published and thus cannot be cloned.`, ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        const newPrompt = new Prompt({
            author_id: message.author.id,
            author_username: message.author.username,
            author_avatar: message.author.displayAvatarURL(),
            name: prompt.name,
            content: prompt.content,
            description: prompt.description,
            nsfw: prompt.nsfw,
            created_at: prompt.created_at,
            published: false,
        });
        await writePrompt(newPrompt);
        userPrompts.set(message.author.id, newPrompt.name);
        action.reply(message, { content: `cloned \`${args.get("content")}\`; now using/editing prompt \`${promptname}\``, ephemeral: guildConfig.other.use_ephemeral_replies });
    }
);

const use = new Command({
        name: 'use',
        description: 'changes which prompt you are using',
        long_description: 'changes which prompt you are using',
        category: CommandCategory.AI,
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
    async function execute ({ message, guildConfig, args }) {
        if (!args?.get("content")) {
            action.reply(message, {
                content: "please supply a prompt to use",
                ephemeral: guildConfig.other.use_ephemeral_replies
            })
            return new CommandResponse({});
        }
        if ((args.get("content") === "default") || (args.get("content") === "reset")) {
            userPrompts.delete(message.author.id);
            action.reply(message, { content: "now using default prompt", ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        const prompt = await getPrompt(args.get("content") as string, message.author.id);
        if (!prompt) {
            action.reply(message, { content: `couldn't find prompt: \`${args.get("content")}\``, ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        userPrompts.set(message.author.id, prompt.name);
        action.reply(message, { content: "now using/editing prompt `" + prompt.name + "`", ephemeral: guildConfig.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const set = new Command({
        name: 'set',
        description: 'sets the content of the prompt',
        long_description: 'sets the content of your current prompt',
        category: CommandCategory.AI,
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
    async function execute ({ message, guildConfig, args }) {
        if (!args?.get("content")) {
            action.reply(message, {
                content: "please supply content",
                ephemeral: guildConfig.other.use_ephemeral_replies
            })
            return new CommandResponse({});
        }
        let prompt = await getUserPrompt(message.author);
        prompt.content = args?.get('content') as string;
        await savePrompt(prompt, message.author);
        action.reply(message, { content: `prompt content of \`${prompt.name}\` set to \`\`\`${prompt.content}\`\`\``, ephemeral: guildConfig.other.use_ephemeral_replies });
    }
);

const subcommands: Command[] = [set, use, list, description, nsfw, name, del, publish, get, deflt, clone];

const command = new Command(
    {
        name: 'prompt',
        description: 'various commands relating to your custom prompts',
        long_description: 'allows you to manage your custom prompts, with subcommands to set the content, description, name, as well as publish them for others to use.',
        category: CommandCategory.AI,
        pipable_to: [],
        argument_order: "<subcommand> <content?>",
        subcommands,
        options: [
            new CommandOption({
                name: 'subcommand',
                description: 'the subcommand to run',
                type: CommandOptionType.String,
                required: true,
                choices: subcommands.map(subcommand => { return { name: subcommand.name, value: subcommand.name } })
            }),
            new CommandOption({ // may change this later when mister subcommand thing is done
                name: 'content',
                description: 'the content to pass to the subcommand',
                type: CommandOptionType.String,
                required: false,
            })
        ],
        example_usage: "p/prompt set always respond with \"hi\"",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ message, guildConfig, args }) {
        if (args?.get("subcommand")) {
            action.reply(message, {
                content: "invalid subcommand: " + args?.get("subcommand"),
                ephemeral: guildConfig.other.use_ephemeral_replies,
            })
            return;
        }
        action.reply(message, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: guildConfig.other.use_ephemeral_replies
        })
    }
);

export default command;