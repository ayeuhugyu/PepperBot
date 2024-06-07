import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import fs from "fs";
import fsextra from "fs-extra";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";
import * as files from "../lib/files.js";
import default_embed from "../lib/default_embed.js";

const config = globals.config;

class listValue {
    constructor(name, value, checked) {
        this.name = name;
        this.value = value;
        this.completed = checked;
    }
}

function createListFiles(id, name) {
    fsextra.ensureDirSync(`resources/data/todos/${id}`);
    fsextra.ensureFileSync(
        `resources/data/todos/${id}/${files.fixFileName(name)}.json`
    );

    fs.writeFileSync(
        `resources/data/todos/${id}/${files.fixFileName(name)}.json`,
        JSON.stringify([])
    );

    return `resources/data/todos/${id}/${files.fixFileName(name)}.json`;
}
function ensureList(id, name) {
    if (
        !fs.existsSync(
            `resources/data/todos/${id}/${files.fixFileName(name)}.json`
        )
    ) {
        return createListFiles(id, name);
    }
    return `resources/data/todos/${id}/${files.fixFileName(name)}.json`;
}
function readList(id, name) {
    return JSON.parse(
        fs.readFileSync(
            `resources/data/todos/${id}/${files.fixFileName(name)}.json`
        )
    );
}
function editList(id, name, key, value, checked) {
    const list = readList(id, name);
    list[key] = new listValue(key, value, checked);
    fs.writeFileSync(
        `resources/data/todos/${id}/${files.fixFileName(name)}.json`,
        JSON.stringify(list, null, 4)
    );
}
function removeListItem(id, name, key) {
    const list = readList(id, name);
    list.splice(key, 1);
    fs.writeFileSync(
        `resources/data/todos/${id}/${files.fixFileName(name)}.json`,
        JSON.stringify(list, null, 4)
    );
}

let whichListForUser = {};

const whichData = new SubCommandData();
whichData.setName("which");
whichData.setDescription("displays which list you are currently editing");
whichData.setPermissions([]);
whichData.setPermissionsReadable("");
whichData.setWhitelist([]);
whichData.setCanRunFromBot(true);
whichData.setAliases(["current"])

const which = new SubCommand(
    whichData,
    async function getArguments(message) {
        return new Collection();
    },
    async function execute(message, args, fromInteraction) {
        const whichList = whichListForUser[message.author.id] || "main";
        action.reply(message, {
            content: `currently editing list "${whichList}"`,
            ephemeral: true,
        });
    }
);

const switchData = new SubCommandData();
switchData.setName("switch");
switchData.setDescription("switches your current list to another list");
switchData.setPermissions([]);
switchData.setPermissionsReadable("");
switchData.setWhitelist([]);
switchData.setCanRunFromBot(true);
switchData.setAliases(["change"])
switchData.addStringOption((option) =>
    option
        .setName("content")
        .setDescription("which list to switch to")
        .setRequired(true)
);

const switchc = new SubCommand(
    switchData,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "content",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (!args.get("content")) {
            action.reply(message, {
                content: "you need to supply a list to switch to",
                ephemeral: true,
            });
            return;
        }
        if (args.get("content") === "ls") {
            const fileList = await files.generateLSText(
                `resources/data/todos/${message.author.id}`,
                true
            );
            console.log(fileList);
            const file = await files.textToFile(fileList, "todolists");
            action.reply(message, {
                files: [{ attachment: file, name: "todolists.txt" }],
                ephemeral: true,
            });
            return;
        }
        const oldWhichList = whichListForUser[message.author.id] || "main";
        const oldList = readList(message.author.id, oldWhichList);
        const oldListLength = oldList.length;
        let content = "";
        if (oldListLength === 0) {
            fs.unlinkSync(
                `resources/data/todos/${message.author.id}/${files.fixFileName(
                    oldWhichList
                )}.json`
            );
            content += `deleted old list "${oldWhichList}" as it contained no entries. `;
        }

        whichListForUser[message.author.id] = args.get("content");
        ensureList(message.author.id, args.get("content"));
        content += `switched to list "${args.get("content")}"`;
        action.reply(message, {
            content: content,
            ephemeral: true,
        });
    }
);

const addTaskData = new SubCommandData();
addTaskData.setName("add");
addTaskData.setDescription("adds a task to your todo list");
addTaskData.setPermissions([]);
addTaskData.setPermissionsReadable("");
addTaskData.setWhitelist([]);
addTaskData.setCanRunFromBot(true);
addTaskData.addStringOption((option) =>
    option
        .setName("content")
        .setDescription("content to add to your list")
        .setRequired(true)
);

const addTask = new SubCommand(
    addTaskData,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "content",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (!args.get("content")) {
            action.reply(message, {
                content: "you need to supply an item to add to the list",
                ephemeral: true,
            });
            return;
        }
        const whichList = whichListForUser[message.author.id] || "main";
        const list = ensureList(message.author.id, whichList);
        const listLength = readList(message.author.id, whichList).length;
        editList(
            message.author.id,
            whichList,
            listLength,
            args.get("content"),
            false
        );
        action.reply(message, {
            content: `added ${args.get("content")} to list "${whichList}"`,
            ephemeral: true,
        });
    }
);

const removeTaskData = new SubCommandData();
removeTaskData.setName("remove");
removeTaskData.setDescription("removes a task from your todo list");
removeTaskData.setPermissions([]);
removeTaskData.setPermissionsReadable("");
removeTaskData.setWhitelist([]);
removeTaskData.setCanRunFromBot(true);
removeTaskData.addStringOption((option) =>
    option
        .setName("content")
        .setDescription("index of the item to remove from your list")
        .setRequired(true)
);

const removeTask = new SubCommand(
    removeTaskData,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "content",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (!args.get("content")) {
            action.reply(message, {
                content: "you need to supply an item to remove from the list",
                ephemeral: true,
            });
            return;
        }
        const whichList = whichListForUser[message.author.id] || "main";
        const list = ensureList(message.author.id, whichList);
        const listLength = readList(message.author.id, whichList).length;
        const taskIndex = parseInt(args.get("content"));
        if (isNaN(taskIndex) || taskIndex < 1 || taskIndex > listLength) {
            action.reply(message, {
                content: "invalid task index",
                ephemeral: true,
            });
            return;
        }
        const task = readList(message.author.id, whichList)[taskIndex - 1];
        removeListItem(message.author.id, whichList, taskIndex - 1);
        action.reply(message, {
            content: `removed task #${taskIndex} from list "${whichList}": "${task.value}"`,
            ephemeral: true,
        });
    }
);

const checkOffTaskData = new SubCommandData();
checkOffTaskData.setName("check");
checkOffTaskData.setDescription("checks off a task from your todo list");
checkOffTaskData.setPermissions([]);
checkOffTaskData.setPermissionsReadable("");
checkOffTaskData.setWhitelist([]);
checkOffTaskData.setCanRunFromBot(true);
checkOffTaskData.setAliases(["uncheck", "complete", "uncomplete", "toggle", "finish", "unfinish"])
checkOffTaskData.addStringOption((option) =>
    option
        .setName("content")
        .setDescription("index of the item to check off from your list")
        .setRequired(true)
);

const checkOffTask = new SubCommand(
    checkOffTaskData,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "content",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (!args.get("content")) {
            action.reply(message, {
                content:
                    "you need to supply an item to check off from the list",
                ephemeral: true,
            });
            return;
        }
        const whichList = whichListForUser[message.author.id] || "main";
        const l = ensureList(message.author.id, whichList);
        const list = readList(message.author.id, whichList);
        const listLength = list.length;
        const taskIndex = parseInt(args.get("content"));
        if (isNaN(taskIndex) || taskIndex < 1 || taskIndex > listLength) {
            action.reply(message, {
                content: "invalid task index",
                ephemeral: true,
            });
            return;
        }
        let repl = `checked off task #${taskIndex} from list "${whichList}"`;
        const task = list[taskIndex - 1];
        let setTaskCompleted = true;
        if (task.completed) {
            setTaskCompleted = false;
            repl = `unchecked task #${taskIndex} from list "${whichList}"`;
        }
        editList(
            message.author.id,
            whichList,
            taskIndex - 1,
            task.value,
            setTaskCompleted
        );
        action.reply(message, { content: repl, ephemeral: true });
    }
);

const data = new CommandData();
data.setName("todo");
data.setDescription("manages a todo list for yourself");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(false);
data.setDMPermission(true);
data.setAliases();
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("the subcommand to use")
        .setRequired(false)
        .addChoices(
            { name: "add", value: "add" },
            { name: "remove", value: "remove" },
            { name: "check", value: "check" },
            { name: "switch", value: "switch" }
        )
);
data.addStringOption((option) =>
    option
        .setName("content")
        .setDescription(
            "the args to pass to the subcommand, commonly an index or an item on the list"
        )
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set("_SUBCOMMAND", message.content.split(" ")[1]);
        if (args.get("args")) {
            args.set(
                "content",
                message.content.slice(
                    config.generic.prefix.length +
                        commandLength +
                        message.content.split(" ")[1].length +
                        1
                )
            );
        }
        return args;
    },
    async function execute(message, args, fromInteraction) {
        const whichList = whichListForUser[message.author.id] || "main";
        const l = ensureList(message.author.id, whichList);
        const list = readList(message.author.id, whichList);
        const embed = default_embed().setTitle(
            `${message.author.username}'s "${whichList}"`
        );

        let text = "";

        list.forEach((item, index) => {
            text += `${item.completed ? "✅" : ""}[${index + 1}] - ${
                item.value
            }\n`;
        });
        if (!text) {
            embed.setDescription("there are no items in this list");
        } else {
            embed.setDescription(text);
        }

        action.reply(message, { embeds: [embed], ephemeral: true });
    },
    [addTask, removeTask, checkOffTask, switchc, which] // subcommands
);

export default command;
