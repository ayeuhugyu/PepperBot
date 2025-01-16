import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";
import * as gpt from "../lib/gpt.js";
import * as stream from "stream";
import * as files from "../lib/files.js"
import fsExtra from "fs-extra";
import * as files from "../lib/files.js";
import * as util from "util"

const config = globals.config;

// TODO: add to guide.html

const savedata = new SubCommandData();
savedata.setName("save");
savedata.setDescription("saves a prompt as the given name");
savedata.setPermissions([]);
savedata.setPermissionsReadable("");
savedata.setWhitelist([]);
savedata.setCanRunFromBot(true);
savedata.setDisabledContexts(["dm"])
savedata.addStringOption((option) =>
    option
        .setName("name")
        .setDescription("what to save the prompt as")
        .setRequired(false)
);
const save = new SubCommand(
    savedata,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set("name", message.content.slice(prefix.length + commandLength)?.trim());
        return args;
    },
    async function execute(message, args, isInteraction, gconfig) {
        const conversation = await gpt.getConversation(message.author, message, false, true);
        const prompt = conversation.messages[0].content;
        if (prompt == gpt.botPrompt) {
            action.reply(
                message,
                { content: "there's no reason to save the default prompt, use p/prompt set to change it first. ", ephemeral: gconfig.useEphemeralReplies}
            );
            return;
        }
        if (!args.get("name")) {
            action.reply(message, { content: "what tf am i supposed to save this as", ephemeral: gconfig.useEphemeralReplies});
            return;
        }
        if (args.get("name") == "ls") {
            action.reply(
                message,
                { content: "you can't save a prompt as ls cuz i use that bucko", ephemeral: gconfig.useEphemeralReplies}
            );
            return;
        }
        const filename = files.fixFileName(args.get("name"));
        fsExtra.ensureFileSync(`resources/data/prompts/${message.author.id}/${filename}.txt`);
        fs.writeFileSync(`resources/data/prompts/${message.author.id}/${filename}.txt`, prompt);
        action.reply(
            message,
            { content: `saved prompt as \`${filename}\``, ephemeral: gconfig.useEphemeralReplies }
        );
    }
);

const loaddata = new SubCommandData();
loaddata.setName("load");
loaddata.setDescription("loads a prompt");
loaddata.setPermissions([]);
loaddata.setPermissionsReadable("");
loaddata.setWhitelist([]);
loaddata.setCanRunFromBot(true);
loaddata.addStringOption((option) =>
    option
        .setName("name")
        .setDescription("which prompt to load, use ls to list all prompts")
        .setRequired(false)
);
const load = new SubCommand(
    loaddata,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set("name", message.content.slice(prefix.length + commandLength)?.trim());
        return args;
    },
    async function execute(message, args, isInteraction, gconfig) {
        if (!args.get("name")) {
            action.reply(message, {content: "what tf am i supposed to load", ephemeral: gconfig.useEphemeralReplies});
            return;
        }
        if (args.get("name") == "ls") {
            const text = files.generateLSText("resources/data/prompts/" + message.author.id);
            action.reply(
                message,
                { content: `prompts for ${message.author.username}:\n\`\`\`${text}\`\`\``, ephemeral: gconfig.useEphemeralReplies }
            );
            return;
        }
        const filename = files.fixFileName(args.get("name"));
        const path = `resources/data/prompts/${message.author.id}/${filename}.txt`;
        if (!fs.existsSync(path)) {
            action.reply(message, { content: "that prompt doesn't exist", ephemeral: gconfig.useEphemeralReplies });
            return;
        }
        const prompt = fs.readFileSync(path)
        let conversation = await gpt.getConversation(message.author, message, false, true);
        conversation.setPrompt(prompt);
        gpt.resetExceptions[message.author.id] = true;
        action.reply(
            message,
            { content: `loaded prompt \`${filename}\` for the next conversation you have with pepperbot`}
        );
    }
);

const getdata = new SubCommandData();
getdata.setName("get");
getdata.setDescription("fetches a prompt and returns it");
getdata.setPermissions([]);
getdata.setPermissionsReadable("");
getdata.setWhitelist([]);
getdata.setCanRunFromBot(true);
getdata.addStringOption((option) =>
    option
        .setName("name")
        .setDescription("which prompt to get, use ls to list all prompts")
        .setRequired(false)
);
const get = new SubCommand(
    getdata,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set("name", message.content.slice(prefix.length + commandLength)?.trim());
        return args;
    },
    async function execute(message, args, isInteraction, gconfig) {
        if (!args.get("name")) {
            action.reply(message, {content: "what tf am i supposed to get", ephemeral: gconfig.useEphemeralReplies});
            return;
        }
        if (args.get("name") == "ls") {
            const text = files.generateLSText("resources/data/prompts/" + message.author.id);
            action.reply(
                message,
                {content: `prompts for ${message.author.username}:\n\`\`\`${text}\`\`\``, ephemeral: gconfig.useEphemeralReplies}
            );
            return;
        }
        const filename = files.fixFileName(args.get("name"));
        const path = `resources/data/prompts/${message.author.id}/${filename}.txt`;
        if (!fs.existsSync(path)) {
            action.reply(message, {content: "that prompt doesn't exist", ephemeral: gconfig.useEphemeralReplies});
            return;
        }
        const prompt = fs.readFileSync(path)
        action.reply(
            message,
            {
                content: `prompt \`${filename}\`:\n\`\`\`${prompt}\`\`\``,
            }
        );
    }
);

const setpromptdata = new SubCommandData();
setpromptdata.setName("set");
setpromptdata.setDescription("adjusts the prompt for the next conversation");
setpromptdata.setPermissions([]);
setpromptdata.setPermissionsReadable("");
setpromptdata.setWhitelist([]);
setpromptdata.setCanRunFromBot(true);
setpromptdata.setAliases([]);
setpromptdata.setNormalAliases(["setprompt", "sp"]);
setpromptdata.setDisabledContexts()
setpromptdata.addStringOption((option) =>
    option
        .setName("prompt")
        .setDescription("the prompt to use")
        .setRequired(false)
);
const setprompt = new SubCommand(
    setpromptdata,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "prompt",
            message.content
                .slice(prefix.length + commandLength)
                .trim() + (await fixIncomingMessage(message))
        );
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (args.get("prompt")) {
            let conversation = await gpt.getConversation(message.author, message, false, true);
            conversation.setPrompt(args.get("prompt"));
            gpt.resetExceptions[message.author.id] = true;
            const shortPrompt = ((args.get("prompt").split(" ").length < 15) || (args.get("prompt").length < 100))
            action.reply(
                message,
                { content: `the next conversation you have with pepperbot will be influenced by your prompt: \`\`\`${args.get("prompt")}\`\`\`rather than the default. pinging him twice will reset the prompt. you might need to use p/gpt clear to prevent him from talking like he has previously.` + (shortPrompt ? "\nvia my Super Ultra Prompt Shortness Detector, i have detected that **your prompt is probably too short.** short prompts usaully don't give great results, try using p/prompt generate to make a better and more elaborate prompt!" : ""), ephemeral: gconfig.useEphemeralReplies }
            );
        } else {
            action.reply(message, {content: "provide a prompt to use you baffoon!", ephemeral: gconfig.useEphemeralReplies});
        }
    }
);

const generatedata = new SubCommandData();
generatedata.setName("generate");
generatedata.setDescription("generates a more elaborate prompt based off an inputted prompt");
generatedata.setPermissions([]);
generatedata.setPermissionsReadable("");
generatedata.setWhitelist([]);
generatedata.setCanRunFromBot(true);
generatedata.setAliases([]);
generatedata.setNormalAliases(["generateprompt"]);
generatedata.setDisabledContexts()
const generate = new SubCommand(
    generatedata,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "prompt",
            message.content
                .slice(prefix.length + commandLength)
                .trim() + (await fixIncomingMessage(message))
        );
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        const prompt = args.get("prompt")
        const sent = await action.reply(message, {
            content: `generating prompt based off of: \`\`\`${prompt}\`\`\``,
            ephemeral: gconfig.useEphemeralReplies
        })
        const generated = await gpt.generatePrompt(prompt);
        action.editMessage(sent, {
            content: `generated prompt: \`\`\`${generated}\`\`\`use p/prompt set to use this prompt in your next conversation.`,
            ephemeral: gconfig.useEphemeralReplies
        });
    }
);

const data = new CommandData();
data.setName("prompt");
data.setDescription("gpt prompt related commands");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setAliases();
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("subcommand to run")
        .setRequired(true)
        .addChoices(
            { name: "set", value: "set" }, 
            { name: "generate", value: "generate" },
            { name: "save", value: "save" },
            { name: "load", value: "load" },
            { name: "get", value: "get" }
        )
);
data.addStringOption((option) =>
    option
        .setName("prompt")
        .setDescription("the prompt to use / generate an image from")
        .setRequired(false)
);
data.addStringOption((option) =>
    option
        .setName("name")
        .setDescription("the name of the prompt to save / load / get")
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const args = new Collection();
        args.set("_SUBCOMMAND", message.content.split(" ")[1]);
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (args.get("_SUBCOMMAND")) {
            action.reply(message, {
                content: "invalid subcommand: " + args.get("_SUBCOMMAND"),
                ephemeral: gconfig.useEphemeralReplies
            })
            return;
        }
        action.reply(message, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: gconfig.useEphemeralReplies
        })
    },
    [generate, setprompt, save, load, get] // subcommands
);

export default command;
