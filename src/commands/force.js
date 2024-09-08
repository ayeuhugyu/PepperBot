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
import * as voice from "../lib/voice.js";
import * as textfiles from "../lib/files.js";
import fsExtra from "fs-extra";
import stream from "stream";

const config = globals.config;

const replydata = new SubCommandData();
replydata.setName("reply");
replydata.setDescription("reply to a message");
replydata.setPermissions([]);
replydata.setPermissionsReadable("");
replydata.setWhitelist([]);
replydata.setCanRunFromBot(true);
replydata.setAliases([]);
replydata.setDisabledContexts(["dm"])
replydata.setNormalAliases(["reply"])
replydata.addStringOption((option) =>
    option.setName("message").setDescription("id of the message to reply to").setRequired(true)
);
replydata.addStringOption((option) =>
    option.setName("text").setDescription("what to reply with").setRequired(true)
);
const reply = new SubCommand(
    replydata,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        const messageid = message.reference ? message.reference.messageId : message.content.split(" ")[1]
        args.set("message", messageid);
        if (args.get("message")) {
            args.set("text", message.reference ? message.content.slice(prefix.length + commandLength) : message.content.slice(prefix.length + commandLength + args.get("message").toString().length + 1));
        }
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (args.get('message')) {
            let didError = false
            try {
                await message.channel.messages.fetch(args.get("message"))
            } catch (e) {
                action.reply(message, {
                    content: `invalid message: \`${args.get("message")}\``,
                    ephemeral: gconfig.useEphemeralReplies
                })
                didError = true
            }
            if (didError) return
            const requestedMessage = await message.channel.messages.fetch(args.get("message"))
            if (!requestedMessage) {
                action.reply(message, {
                    content: `invalid message: \`${args.get("message")}\``,
                    ephemeral: gconfig.useEphemeralReplies
                })
                return;
            }
            if (args.get("text")) {
                try {
                    action.reply(requestedMessage, { content: args.get("text") })
                } catch (e) {
                    didError = true
                    log.error(e)
                    action.reply(message, {
                        content: "an error occured while reacting to this message, the error has been logged.",
                        ephemeral: gconfig.useEphemeralReplies
                    })
                }
                if (didError) return
                if (!fromInteraction) {
                    action.deleteMessage(message)
                } else {
                    action.reply(message, {
                        content: "the deed is done.",
                        ephemeral: gconfig.useEphemeralReplies
                    })
                }
            } else {
                action.reply(message, {
                    content: "how tf am i supposed to reply with nothing baffoon...",
                    ephemeral: gconfig.useEphemeralReplies
                })
            }
        } else {
            action.reply(message, {
                content: "supply a message you baffoon!",
                ephemeral: gconfig.useEphemeralReplies
            })
        }
    },
    [] // subcommands
);

const reactdata = new SubCommandData();
reactdata.setName("react");
reactdata.setDescription("react to a message");
reactdata.setPermissions([]);
reactdata.setPermissionsReadable("");
reactdata.setWhitelist([]);
reactdata.setCanRunFromBot(true);
reactdata.setAliases([]);
reactdata.setNormalAliases(["react"])
reactdata.setDisabledContexts(["dm"])
reactdata.addStringOption((option) =>
    option.setName("message").setDescription("id of the message to react to").setRequired(true)
);
reactdata.addStringOption((option) =>
    option.setName("reaction").setDescription("the emoji to react with").setRequired(true)
);
const react = new SubCommand(
    reactdata,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        const messageid = message.reference ? message.reference.messageId : message.content.split(" ")[1]
        args.set("message", messageid);
        if (args.get("message")) {
            args.set("reaction", message.reference ? message.content.slice(prefix.length + commandLength) : message.content.slice(prefix.length + commandLength + args.get("message").toString().length + 1));
        }
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (args.get('message')) {
            let didError = false
            try {
                await message.channel.messages.fetch(args.get("message"))
            } catch (e) {
                action.reply(message, {
                    content: `invalid message: \`${args.get("message")}\``,
                    ephemeral: gconfig.useEphemeralReplies
                })
                didError = true
            }
            if (didError) return
            const requestedMessage = await message.channel.messages.fetch(args.get("message"))
            if (!requestedMessage) {
                action.reply(message, {
                    content: `invalid message: \`${args.get("message")}\``,
                    ephemeral: gconfig.useEphemeralReplies
                })
                return;
            }
            if (args.get("reaction")) {
                try {
                    await requestedMessage.react(args.get("reaction"))
                } catch (e) {
                    if (e.code === 10014) {
                        action.reply(message, {
                            content: `invalid emoji: \`${args.get("reaction")}\``,
                            ephemeral: gconfig.useEphemeralReplies
                        })
                        didError = true
                        return;
                    }
                    didError = true
                    log.error(e)
                    action.reply(message, {
                        content: "an error occured while reacting to this message, the error has been logged.",
                        ephemeral: gconfig.useEphemeralReplies
                    })
                }
                if (didError) return
                if (!fromInteraction) {
                    action.deleteMessage(message)
                } else {
                    action.reply(message, {
                        content: "the deed is done.",
                        ephemeral: gconfig.useEphemeralReplies
                    })
                }
            } else {
                action.reply(message, {
                    content: "supply a reaction you baffoon!",
                    ephemeral: gconfig.useEphemeralReplies
                })
            }
        } else {
            action.reply(message, {
                content: "supply a message you baffoon!",
                ephemeral: gconfig.useEphemeralReplies
            })
        }
    },
    [] // subcommands
);

const dmdata = new SubCommandData();
dmdata.setName("dm");
dmdata.setDescription("make the bot dm someone");
dmdata.setPermissions([]);
dmdata.setPermissionsReadable("");
dmdata.setWhitelist([]);
dmdata.setCanRunFromBot(false);
dmdata.setAliases(["dmuser", "send"]);
dmdata.setDisabledContexts(["dm"])
dmdata.setNormalAliases(["dmuser", "dm", "send"])
dmdata.addUserOption((option) =>
    option.setName("user").setDescription("who to dm").setRequired(true)
);
dmdata.addStringOption((option) =>
    option.setName("message").setDescription("what to say").setRequired(true)
);
const dm = new SubCommand(
    dmdata,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        if (message.mentions.users.first()) {
            args.set("user", message.mentions.users.first());
        } else {
            if (message.client.users.cache.get(message.content.split(" ")[1])) {
                args.set(
                    "user",
                    message.client.users.cache.get(
                        message.content.split(" ")[1]
                    )
                );
            }
        }
        if (args.get("user")) {
            args.set(
                "message",
                message.content.slice(
                    prefix.length +
                        commandLength +
                        message.content.split(" ")[1].length +
                        1
                )
            );
        }
        return args;
    },
    async function execute(message, args, isInteraction, gconfig) {
        if (args.get("text") && !args.get("message")) {
            args.set("message", args.get("text"));
        }
        if (args.get("user")) {
            if (args.get("message")) {
                action.sendDM(args.get("user"), args.get("message"));
                action.deleteMessage(message);
                if (isInteraction) {
                    action.reply(message, {
                        content: "sent!",
                        ephemeral: gconfig.useEphemeralReplies,
                    });
                }
            } else {
                action.reply(message, "provide a valid message you baffoon!");
            }
        } else {
            action.reply(message, "provide a valid user to dm you baffoon!");
        }
    }
);

const saydata = new SubCommandData();
saydata.setName("say");
saydata.setDescription("make the bot say something");
saydata.setPermissions([]);
saydata.setPermissionsReadable("");
saydata.setWhitelist([]);
saydata.setNormalAliases(["say"])
saydata.setCanRunFromBot(true);
saydata.setDisabledContexts(["dm"])
saydata.addStringOption((option) =>
    option.setName("message").setDescription("what to say").setRequired(true)
);
const say = new SubCommand(
    saydata,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "message",
            message.content
                .slice(prefix.length + commandLength)
                .trim()
        );
        //args.set("attachments", message.attachments);
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        const prefix = gconfig.prefix || config.generic.prefix
        if (
            message.content.startsWith(
                `${prefix}say ${prefix}say`
            ) ||
            message.content.startsWith(`d/say d/say`) ||
            message.content.startsWith(`p/say p/say`) ||
            message.content.startsWith(`p/say d/say`) ||
            message.content.startsWith(`d/say p/say`) // fuck you idc this shit sucks it fucking works and if i don't make a solution yall are gonna keep spamming me "Uhhh... You should fix that!!!" despite it literally not being an issue in the fucking first place
        ) {
            action.reply(message, `bro really thought 😂😂😂`);
            return;
        }
        if (!args.get("message") && args.get("text")) {
            args.set("message", args.get("text"));
        }
        if (args.get("message") || args.get("attachments")) {
            const obj = {};
            if (args.get("message")) {
                obj.content = args.get("message");
            }
            if (args.get("attachments")) {
                const realAttachments = [];
                args.get("attachments").forEach((attachment) => {
                    if (attachment.size > 20 * 1024 * 1024) {
                        return; // due to the way discordjs works, it downloads the image to a buffer and then reuploads it. i have no fking clue why it does this, but there's no way around it, so instead im just going to limit the file size
                    }
                    const att = {
                        attachment: attachment.url,
                        name: attachment.name,
                    };
                    realAttachments.push(att);
                });

                // Assign the processed attachments to obj.files
                obj.files = realAttachments; // THIS IS CURRENTLY DISABLED DUE TO BROKEN FUNCTIONALITY
            }
            action.sendMessage(message.channel, obj); // THIS FOR SOME FUCKING REASON GETS EXECUTED MULTIPLE TIMES AND I HAVE NO IDEA HOW TO FIX IT????
            if (fromInteraction) {
                action.reply(message, {
                    content: "the deed is done.",
                    ephemeral: gconfig.useEphemeralReplies,
                });
            }
            action.deleteMessage(message);
        } else {
            action.reply(message, "provide a message to say you baffoon!");
        }
    }
);

const data = new CommandData();
data.setName("force");
data.setDescription("force the bot to do something");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setdisableExternalGuildUsage(true)
data.setAliases(["sounds"]);
data.setDisabledContexts(["dm"])
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("subcommand to run")
        .setRequired(true)
        .addChoices(
            { name: "say", value: "say" },
            { name: "dm", value: "dm" },
            { name: "react", value: "react" },
            { name: "reply", value: "reply" },
        )
);
data.addStringOption((option) =>
    option
        .setName("message")
        .setDescription(
            "what to say/what to react to/what to reply to, depending on subcommand"
        )
        .setRequired(false)
);
data.addUserOption((option) =>
    option
        .setName("user")
        .setDescription(
            "who to dm"
        )
        .setRequired(false)
);
data.addStringOption((option) =>
    option
        .setName("reaction")
        .setDescription(
            "what to react with"
        )
        .setRequired(false)
);
data.addStringOption((option) =>
    option
        .setName("text")
        .setDescription(
            "what to reply with"
        )
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
    [say, dm, react, reply] // subcommands
);

export default command;