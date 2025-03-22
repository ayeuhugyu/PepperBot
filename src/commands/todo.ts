import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import { Todo, TodoItem, getTodo } from "../lib/classes/todo_manager";
import PagedMenu from "../lib/classes/pagination";
import { Collection, EmbedBuilder, Message } from "discord.js";
import { createThemeEmbed, Theme } from "../lib/theme";

let currentlyEditing: Collection<string, string> = new Collection();

const switchCommand = new Command(
    {
        name: 'switch',
        description: 'switch to a different todo list',
        long_description: 'switch to a different todo list by name',
        tags: [CommandTag.Utility],
        pipable_to: [],
        options: [
            new CommandOption({
                name: "list",
                description: "the name of the list to switch to",
                type: CommandOptionType.String,
                required: true,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/todo switch Work",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["list"]),
    async function execute ({ invoker, args, guild_config }) {
        currentlyEditing.set(invoker.author.id, args.list);
        await action.reply(invoker, { content: `switched to list \`${args.list}\``, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const checkCommand = new Command(
    {
        name: 'check',
        description: 'toggles the completion status of an item in your todo list',
        long_description: 'toggles the completion status of an item in your todo list',
        tags: [CommandTag.Utility],
        pipable_to: [],
        options: [
            new CommandOption({
                name: "index",
                description: "the index of the item to check",
                type: CommandOptionType.Integer,
                required: true,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/todo check 1",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["index"]),
    async function execute ({ invoker, args, guild_config }) {
        const todo = await ensureTodo(invoker.author.id, currentlyEditing.get(invoker.author.id) || "default");
        const index = args.index - 1;

        if (!todo.items[index]) {
            await action.reply(invoker, { content: `item at index ${args.index} does not exist in list ${todo.name}`, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const item = await todo.toggleItemCompletion(index);
        await action.reply(invoker, { content: `marked item \`${args.index}\` as ${item?.completed ? "completed" : "not completed"} in list ${todo.name}`, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const clearCommand = new Command(
    {
        name: 'clear',
        description: 'clear your todo list',
        long_description: 'remove all items from your todo list',
        tags: [CommandTag.Utility],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/todo clear",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, args, guild_config }) {
        const todo = await ensureTodo(invoker.author.id, currentlyEditing.get(invoker.author.id) || "default");
        await todo.del();
        await action.reply(invoker, { content: `deleted list ${todo.name}`, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const removeCommand = new Command(
    {
        name: 'remove',
        description: 'remove an item from your todo list',
        long_description: 'remove an item from your todo list by its index',
        tags: [CommandTag.Utility],
        pipable_to: [],
        options: [
            new CommandOption({
                name: "index",
                description: "the index of the item to remove",
                type: CommandOptionType.Integer,
                required: true,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/todo remove 1",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["index"]),
    async function execute ({ invoker, args, guild_config }) {
        const todo = await ensureTodo(invoker.author.id, currentlyEditing.get(invoker.author.id) || "default");
        const index = args.index - 1;

        if (!todo.items[index]) {
            await action.reply(invoker, { content: `item at index \`${args.index}\` does not exist in list ${todo.name}`, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }
        const item = await todo.removeItem(index);
        await action.reply(invoker, { content: `removed item: \`${args.index}\` from list ${todo.name} ${(item !== undefined) ? `(${item.text})` : ""}`, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

const addCommand = new Command(
    {
        name: 'add',
        description: 'add an item to your todo list',
        long_description: 'add a new item to your todo list',
        tags: [CommandTag.Utility],
        pipable_to: [],
        options: [
            new CommandOption({
                name: "item",
                description: "the item to add",
                type: CommandOptionType.String,
                required: true,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/todo add Buy milk",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["item"]),
    async function execute ({ invoker, args, guild_config }) {
        const todo = await ensureTodo(invoker.author.id, currentlyEditing.get(invoker.author.id) || "default");
        const item = {
            user: invoker.author.id,
            name: todo.name,
            item: todo.items.length,
            text: args.item,
            completed: false,
        }
        await todo.addItem(item);
        await action.reply(invoker, { content: `added item: \`${args.item}\` to list ${todo.name}`, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

async function ensureTodo(user: string, name: string): Promise<Todo> {
    const todo = await getTodo(user, name);
    if (!todo) {
        const newTodo = new Todo([]);
        newTodo.name = name;
        newTodo.user = user;
        await newTodo.write();
        return newTodo;
    }
    return todo;
}

function embedTodo(todo: Todo): PagedMenu {
    const embeds: EmbedBuilder[] = [];
    const itemsPerPage = 15;
    const pages = Math.ceil(todo.items.length / itemsPerPage);

    if (todo.items.length === 0) {
        const embed = createThemeEmbed(Theme.CURRENT);
        embed.setDescription("there are no items in your todo list");
        embed.setTitle(`${todo.name}`);
        embeds.push(embed);
    } else {
        for (let i = 0; i < pages; i++) {
            const embed = createThemeEmbed(Theme.CURRENT);
            const start = i * itemsPerPage;
            const end = start + itemsPerPage;
            const items = todo.items.slice(start, end);

            let description = "";
            items.forEach((item, index) => {
                description += `${index + 1 + i * itemsPerPage}: ${item.text} ${item.completed ? "(✅)" : ""}\n`;
            });

            embed.setDescription(description);
            embed.setTitle(`${todo.name} (page ${i + 1}/${pages})`);

            embeds.push(embed);
        }
    }

    return new PagedMenu(embeds);
}

function todoToText(todo: Todo): string {
    let text = `Todo List: ${todo.name}\n`;
    todo.items.forEach((item, index) => {
        text += `${index + 1}: ${item.text} ${item.completed ? "(✅)" : ""}\n`;
    });
    return text;
}

const viewCommand = new Command(
    {
        name: 'view',
        description: 'view your todo list',
        long_description: 'view the items in your todo list',
        tags: [CommandTag.Utility],
        pipable_to: [CommandTag.TextPipable],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/todo view",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, args, guild_config }) {
        const todo = await ensureTodo(invoker.author.id, currentlyEditing.get(invoker.author.id) || "default");
        const pagedMenu = embedTodo(todo);
        const sent = await action.reply(invoker, { embeds: [pagedMenu.embeds[0]], components: [pagedMenu.getActionRow()], ephemeral: guild_config.other.use_ephemeral_replies });
        pagedMenu.setActiveMessage(sent as Message<true>);
        return new CommandResponse({ pipe_data: { input_text: todoToText(todo) } })
    }
);

const command = new Command(
    {
        name: 'todo',
        description: 'manage your todo list',
        long_description: 'add, remove, check off, and view your todo list items. also allows you to switch between different todo lists.',
        tags: [CommandTag.Utility],
        pipable_to: [CommandTag.TextPipable],
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [viewCommand, addCommand, removeCommand, checkCommand, clearCommand, switchCommand],
        },
        options: [
            new CommandOption({
                name: "subcommand",
                description: "the subcommand to execute",
                type: CommandOptionType.String,
                required: true,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/todo",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {
        const subcommand = args.subcommand;
        if (subcommand) {
            action.reply(invoker, `subcommand ${subcommand} doesn't exist`);
            return;
        }
        const todo = await ensureTodo(invoker.author.id, currentlyEditing.get(invoker.author.id) || "default");
        const pagedMenu = embedTodo(todo);
        const sent = await action.reply(invoker, { embeds: [pagedMenu.embeds[0]], components: [pagedMenu.getActionRow()], ephemeral: guild_config.other.use_ephemeral_replies });
        pagedMenu.setActiveMessage(sent as Message<true>);
        return new CommandResponse({ pipe_data: { input_text: todoToText(todo) } })
    }
);

export default command;