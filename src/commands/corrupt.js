import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

function literalPuncuate(message) {
    const punctuation = {
        ".": "PERIOD",
        ",": "COMMA",
        "!": "EXCLAMATION",
        "?": "QUESTION",
        ";": "SEMICOLON",
        ":": "COLON",
        "-": "HYPHEN",
        "(": "LEFTPAREN",
        ")": "RIGHTPAREN",
        "[": "LEFTBRACKET",
        "]": "RIGHTBRACKET",
        "{": "LEFTBRACE",
        "}": "RIGHTBRACE",
        "<": "LEFTANGLE",
        ">": "RIGHTANGLE",
        "/": "SLASH",
        "\\": "BACKSLASH",
        "|": "PIPE",
        "@": "AT",
        "#": "POUND",
        $: "DOLLAR",
        "%": "PERCENT",
        "^": "CARET",
        "&": "AMPERSAND",
        "*": "ASTERISK",
        _: "UNDERSCORE",
        "+": "PLUS",
        "=": "EQUALS",
        "~": "TILDE",
        "`": "GRAVE",
        '"': "DOUBLEQUOTE",
        "'": "SINGLEQUOTE",
    };
    let newMessage = message;
    for (const [key, value] of Object.entries(punctuation)) {
        newMessage = newMessage.replaceAll(key, key + value);
    }
    return newMessage;
}

function capitalizeRandom(message) {
    const chars = Array.from(message);
    for (let i = 0; i < chars.length / 4; i++) {
        const num = Math.floor(Math.random() * chars.length);
        chars[num] = chars[num].toUpperCase();
    }
    let newMessage = "";
    for (const [key, value] of Object.entries(chars)) {
        newMessage += value;
    }
    return newMessage;
}

function moveWords(message) {
    const words = message.split(" ");
    for (let i = 0; i < words.length / 8; i++) {
        const num = Math.floor(Math.random() * words.length);
        const num2 = Math.floor(Math.random() * words.length);
        words[num] = words[num2];
    }
    let newMessage = "";
    for (const [key, value] of Object.entries(words)) {
        newMessage += value + " ";
    }
    return newMessage;
}

function thatThingHeSuggested(message) {
    const chars = Array.from(message);
    for (let i = 0; i < chars.length / 16; i++) {
        const num = Math.floor(Math.random() * chars.length);
        chars[num] = chars[num] ^ 0x11;
    }
    let newMessage = "";
    for (const [key, value] of Object.entries(chars)) {
        newMessage += value;
    }
    return newMessage;
}

const data = new CommandData();
data.setName("corrupt");
data.setDescription("fuck up your message (image support Soon:tm:)");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.addStringOption((option) =>
    option
        .setName("message")
        .setDescription("what to fuck up")
        .setRequired(false)
);
data.addAttachmentOption((option) =>
    option
        .setName("image")
        .setDescription("image to fuck up")
        .setRequired(false)
);
data.addIntegerOption((option) =>
    option
        .setName("severity")
        .setDescription(
            "the severity to fuck up your image/message to, defaults to max number"
        )
        .setRequired(false)
        .addChoices(
            { name: "1", value: 1 },
            { name: "2", value: 2 },
            { name: "3", value: 3 },
            { name: "4", value: 4 }
        )
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 2;
        const args = new Collection();
        args.set("image", message.attachments.first());
        args.set(
            "message",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        if (message.content.includes("SEVERITY:")) {
            args.set(
                "severity",
                message.content.substring(
                    message.content.indexOf("SEVERITY:"),
                    message.content.indexOf(
                        " ",
                        message.content.indexOf("SEVERITY:")
                    )
                )
            );
            if (!isNaN(args.get("severity"))) {
                if (args.get("severity") > 4) {
                    args.set("severity", 4);
                }
            } else {
                args.set("severity", 4);
            }
        }
        return args;
    },
    async function execute(message, args) {
        let finalText = { ephemeral: true };
        let severity = 4;
        if (args.get("severity")) {
            severity = args.get("severity");
        }
        severity--;
        if (args.get("message")) {
            const original = args.get("message");
            let fuckups = {};
            fuckups.punctuation = literalPuncuate(original);
            fuckups.randomCapitalize = capitalizeRandom(fuckups.punctuation);
            fuckups.moveWords = moveWords(fuckups.randomCapitalize);
            fuckups.thatThingHeSuggested = thatThingHeSuggested(
                fuckups.moveWords
            );
            const corruptions = [
                fuckups.punctuation,
                fuckups.randomCapitalize,
                fuckups.moveWords,
                fuckups.thatThingHeSuggested,
            ];
            finalText.content = corruptions[severity];
        }
        if (args.get("image")) {
            const image = args.get("image");

            finalText.attachments = [image];
        }

        if (!args.get("message") && !args.get("image")) {
            finalText.content =
                "provide a message or image to fuck up you baffoon!";
        }
        action.reply(message, finalText);
    }
);

export default command;
