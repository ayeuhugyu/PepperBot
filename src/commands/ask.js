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

const config = globals.config;

const data = new CommandData();
data.setName("ask");
data.setDescription("ask the ai something");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setAliases(["question", "askai"]);
data.addStringOption((option) =>
    option.setName("request").setDescription("what to ask").setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "request",
            message.content
                .slice(prefix.length + commandLength)
        );
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (!args.get("request")) {
            return action.reply(message, "no request provided");
        }
        const ephemeral = gconfig.useEphemeralReplies || gconfig.disableGPTResponses || (gconfig.blacklistedGPTResponseChannelIds && message.channel && gconfig.blacklistedGPTResponseChannelIds.includes(message.channel.id))
        message.content = args.get("request");
        if (!message.cleanContent) {
            message.cleanContent = args.get("request");
        }
        const sent = await action.reply(message, { content: "processing..." });
        let sentContent = "processing...";

        const conversation = await gpt.getConversation(message.author.id);
        sentContent += `\n-# fetched conversation with ${message.author.username} (${message.author.id})`
        await action.editMessage(sent, {
            content: sentContent,
        })
        conversation.emitter.on("tool_call", async (tool) => {
            sentContent += `\n-# processing tool call ${tool.id}: ${tool.function}`
            await action.editMessage(sent, {
                content: sentContent,
            })
        })
        conversation.emitter.on("message", async (message) => {
            await action.editMessage(sent, {
                content: message
            })
        })
        conversation.emitter.on("error", async (message) => {
            sentContent += `\nan error occurred while creating a GPT message. see logs for more details. debug data will persist.`
            await action.editMessage(sent, {
                content: sentContent
            })
        })
        await gpt.respond(message);
        conversation.emitter.removeAllListeners();
    },
    [] // subcommands
);

export default command;