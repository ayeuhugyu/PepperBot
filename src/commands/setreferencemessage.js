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
import uservariables from "../lib/uservariables.js";

const config = globals.config;

const data = new CommandData();
data.setName("setreferencemessage");
data.setDescription("set a message reference used for some commands");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setAliases(["setreference", "reference", "setmessagereference", "setref"]);
data.addStringOption((option) =>
    option.setName("message").setDescription("ID of the message to set current reference to").setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "message",
            message.content
                .slice(prefix.length + commandLength) || message.reference ? message.reference.messageId : null
        );
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (!args.get("message")) {
            return action.reply(message, "no message provided");
        }
        const messageID = args.get("message");
        const messageChannel = message.channel;
        let referenceMessage
        try { // TODO: fix this to work if args.get("message") isn't a message id and is instead the actual message
            if (typeof args.get("message") === String) {
                referenceMessage = await messageChannel.messages.fetch(messageID);
            } else {
                referenceMessage = args.get("message");
            }
        } catch (err) {
            return action.reply(message, { content: `unable to fetch message`, ephemeral: gconfig.useEphemeralReplies });
        }
        uservariables.setUserVariable(message.author.id, "referenceMessage", referenceMessage);
        action.reply(message, { content: `reference message set to ${messageID}`, ephemeral: gconfig.useEphemeralReplies });
    },
    [] // subcommands
);

export default command;