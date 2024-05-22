import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

let embeds = [];

function createEmbed(id) {
    const embed = new EmbedBuilder();
    embeds[id] = embed;
    return embed;
}

function isHexColor(hex) {
    return (
        typeof hex === "string" &&
        hex.length === 6 &&
        !isNaN(Number("0x" + hex))
    );
}

const restartData = new CommandData();
restartData.setName("restart");
restartData.setDescription("restarts the creation of your embed");
restartData.setPermissions([]);
restartData.setPermissionsReadable("");
restartData.setWhitelist([]);
restartData.setCanRunFromBot(true);

const restart = new SubCommand(
    restartData,
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
        let embed = embeds[message.author.id];
        if (!embed) {
            action.reply(message, {
                content: "you aint created shit",
                ephemeral: true,
            });
            return;
        }
        delete embeds[message.author.id];
        action.reply(message, {
            content: "removed current save of your embed",
            ephemeral: true,
        });
    }
);

const setImageData = new CommandData();
setImageData.setName("setimage");
setImageData.setDescription("sets the image of the embed");
setImageData.setPermissions([]);
setImageData.setPermissionsReadable("");
setImageData.setWhitelist([]);
setImageData.setCanRunFromBot(true);
setImageData.addStringOption((option) =>
    option
        .setName("content")
        .setDescription("url to set the image to")
        .setRequired(true)
);

const setImage = new SubCommand(
    setImageData,
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
                content: "you need to supply an image",
                ephemeral: true,
            });
            return;
        }
        let embed = embeds[message.author.id];
        if (!embed) {
            embed = createEmbed(message.author.id);
        }
        try {
            embed.setImage(args.get("content"));
        } catch (err) {
            action.reply(message, {
                content:
                    "something went wrong changing the image of your embed, the url probably isn't valid",
                ephemeral: true,
            });
            return;
        }
        action.reply(message, {
            content: `changed thumbnail of your embed to \`${args.get(
                "content"
            )}\`. please note if this is not a valid url discord may have issues displaying it.`,
            ephemeral: true,
        });
    }
);

const setThumbnailData = new CommandData();
setThumbnailData.setName("setthumbnail");
setThumbnailData.setDescription("sets the thumbnail of the embed");
setThumbnailData.setPermissions([]);
setThumbnailData.setPermissionsReadable("");
setThumbnailData.setWhitelist([]);
setThumbnailData.setCanRunFromBot(true);
setThumbnailData.addStringOption((option) =>
    option
        .setName("content")
        .setDescription("url to set the thumbnail to")
        .setRequired(true)
);

const setThumbnail = new SubCommand(
    setThumbnailData,
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
                content: "you need to supply a thumbnail",
                ephemeral: true,
            });
            return;
        }
        let embed = embeds[message.author.id];
        if (!embed) {
            embed = createEmbed(message.author.id);
        }
        try {
            embed.setThumbnail(args.get("content"));
        } catch (err) {
            action.reply(message, {
                content:
                    "something went wrong changing the thumbnail of your embed, the url probably isn't valid",
                ephemeral: true,
            });
            return;
        }
        action.reply(message, {
            content: `changed thumbnail of your embed to \`${args.get(
                "content"
            )}\`. please note if this is not a valid url discord may have issues displaying it.`,
            ephemeral: true,
        });
    }
);

const setAuthorData = new CommandData();
setAuthorData.setName("setauthor");
setAuthorData.setDescription("sets the author of the embed");
setAuthorData.setPermissions([]);
setAuthorData.setPermissionsReadable("");
setAuthorData.setWhitelist([]);
setAuthorData.setCanRunFromBot(true);
setAuthorData.addStringOption((option) =>
    option
        .setName("content")
        .setDescription("content to set the author to")
        .setRequired(true)
);

const setAuthor = new SubCommand(
    setAuthorData,
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
                content: "you need to supply an author",
                ephemeral: true,
            });
            return;
        }
        if (args.get("content").length > 256) {
            action.reply(message, {
                content:
                    "discord limits embed authors to 256 characters, please shorten your author.",
                ephemeral: true,
            });
            return;
        }
        let embed = embeds[message.author.id];
        if (!embed) {
            embed = createEmbed(message.author.id);
        }
        embed.setAuthor({ name: args.get("content") });
        action.reply(message, {
            content: `changed author of your embed to \`${args.get(
                "content"
            )}\``,
            ephemeral: true,
        });
    }
);

const setFooterData = new CommandData();
setFooterData.setName("setfooter");
setFooterData.setDescription("sets the footer of the embed");
setFooterData.setPermissions([]);
setFooterData.setPermissionsReadable("");
setFooterData.setWhitelist([]);
setFooterData.setCanRunFromBot(true);
setFooterData.addStringOption((option) =>
    option
        .setName("content")
        .setDescription("content to set the footer to")
        .setRequired(true)
);

const setFooter = new SubCommand(
    setFooterData,
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
                content: "you need to supply a footer",
                ephemeral: true,
            });
            return;
        }
        if (args.get("content").length > 2048) {
            action.reply(message, {
                content:
                    "discord limits embed footers to 2048 characters, please shorten your footer.",
                ephemeral: true,
            });
            return;
        }
        let embed = embeds[message.author.id];
        if (!embed) {
            embed = createEmbed(message.author.id);
        }
        embed.setFooter({ text: args.get("content") });
        action.reply(message, {
            content: `changed footer of your embed to \`${args.get(
                "content"
            )}\``,
            ephemeral: true,
        });
    }
);

const setColorData = new CommandData();
setColorData.setName("setcolor");
setColorData.setDescription("sets the color of the embed (THIS IS IN HEX)");
setColorData.setPermissions([]);
setColorData.setPermissionsReadable("");
setColorData.setWhitelist([]);
setColorData.setCanRunFromBot(true);
setColorData.addStringOption((option) =>
    option
        .setName("content")
        .setDescription("color to set the color to (THIS IS IN HEX)")
        .setRequired(true)
);

const setColor = new SubCommand(
    setColorData,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        let content = message.content
            .slice(config.generic.prefix.length + commandLength)
            .trim();
        if (content.startsWith("0x")) {
            content = content.slice(2);
        }
        if (content.startsWith("#")) {
            content = content.slice(1);
        }
        args.set("content", content);
        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (!args.get("content")) {
            action.reply(message, {
                content: "you need to supply a color",
                ephemeral: true,
            });
            return;
        }
        if (!isHexColor(args.get("content"))) {
            action.reply(message, {
                content: "that's not a valid hex color",
                ephemeral: true,
            });
            return;
        }
        let embed = embeds[message.author.id];
        if (!embed) {
            embed = createEmbed(message.author.id);
        }
        embed.setColor(args.get("content"));
        action.reply(message, {
            content: `changed color of your embed to \`${args.get(
                "content"
            )}\``,
            ephemeral: true,
        });
    }
);

const setDescriptionData = new CommandData();
setDescriptionData.setName("setdescription");
setDescriptionData.setDescription("sets the description of the embed");
setDescriptionData.setPermissions([]);
setDescriptionData.setPermissionsReadable("");
setDescriptionData.setWhitelist([]);
setDescriptionData.setCanRunFromBot(true);
setDescriptionData.addStringOption((option) =>
    option
        .setName("content")
        .setDescription("content to set the description to")
        .setRequired(true)
);

const setDescription = new SubCommand(
    setDescriptionData,
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
                content: "you need to supply a description",
                ephemeral: true,
            });
            return;
        }
        if (args.get("content").length > 4096) {
            action.reply(message, {
                content:
                    "discord limits embed descriptions to 4096 characters, please shorten your description.",
                ephemeral: true,
            });
            return;
        }
        let embed = embeds[message.author.id];
        if (!embed) {
            embed = createEmbed(message.author.id);
        }
        embed.setDescription(args.get("content"));
        action.reply(message, {
            content: `changed description of your embed to \`${args.get(
                "content"
            )}\``,
            ephemeral: true,
        });
    }
);

const setTitleData = new CommandData();
setTitleData.setName("settitle");
setTitleData.setDescription("sets the title of the embed");
setTitleData.setPermissions([]);
setTitleData.setPermissionsReadable("");
setTitleData.setWhitelist([]);
setTitleData.setCanRunFromBot(true);
setTitleData.addStringOption((option) =>
    option
        .setName("content")
        .setDescription("content to set the title to")
        .setRequired(true)
);

const setTitle = new SubCommand(
    setTitleData,
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
                content: "you need to supply a title",
                ephemeral: true,
            });
            return;
        }
        if (args.get("content").length > 256) {
            action.reply(message, {
                content:
                    "discord limits embed titles to 256 characters, please shorten your title.",
                ephemeral: true,
            });
            return;
        }
        let embed = embeds[message.author.id];
        if (!embed) {
            embed = createEmbed(message.author.id);
        }
        embed.setTitle(args.get("content"));
        action.reply(message, {
            content: `changed title of your embed to \`${args.get(
                "content"
            )}\``,
            ephemeral: true,
        });
    }
);

const previewData = new CommandData();
previewData.setName("preview");
previewData.setDescription("previews your current embed");
previewData.setPermissions([]);
previewData.setPermissionsReadable("");
previewData.setWhitelist([]);
previewData.setCanRunFromBot(true);

const preview = new SubCommand(
    previewData,
    async function getArguments(message) {
        return undefined;
    },
    async function execute(message, args, fromInteraction) {
        let embed = embeds[message.author.id];
        if (!embed) {
            action.reply(message, {
                content: "you aint created shit",
                ephemeral: true,
            });
            return;
        }
        let totalLength = 0;
        for (const key in embed.data) {
            if (typeof embed.data[key] === "string") {
                totalLength += embed.data[key].length;
            }
        }
        if (embed.data.footer && embed.data.footer.text) {
            totalLength += embed.data.footer.text.length;
        }
        if (embed.data.author && embed.data.author.name) {
            totalLength += embed.data.author.name.length;
        }
        if (embed.data.image && embed.data.image.url) {
            totalLength += embed.data.image.url.length;
        }
        if (embed.data.thumbnail && embed.data.thumbnail.url) {
            totalLength += embed.data.thumbnail.url.length;
        }
        if (totalLength > 6000) {
            action.reply(message, {
                content:
                    "discord limits the length of all fields of an embed to not exceed 6000, please shorten some fields and then try again.",
                ephemeral: true,
            });
            return;
        }
        if (totalLength == 0) {
            action.reply(message, {
                content:
                    "embeds are required to have at least 1 field containing data",
                ephemeral: true,
            });
            return;
        }
        action.reply(message, { embeds: [embed], ephemeral: true });
    }
);

const sendData = new CommandData();
sendData.setName("send");
sendData.setDescription("sends your current embed in the channel you're in");
sendData.setPermissions([]);
sendData.setPermissionsReadable("");
sendData.setWhitelist([]);
sendData.setCanRunFromBot(true);

const send = new SubCommand(
    sendData,
    async function getArguments(message) {
        return undefined;
    },
    async function execute(message, args, fromInteraction) {
        let embed = embeds[message.author.id];
        if (!embed) {
            action.reply(message, {
                content: "you aint created shit",
                ephemeral: true,
            });
            return;
        }
        let totalLength = 0;
        for (const key in embed.data) {
            if (typeof embed.data[key] === "string") {
                totalLength += embed.data[key].length;
            }
        }
        if (embed.data.footer && embed.data.footer.text) {
            totalLength += embed.data.footer.text.length;
        }
        if (embed.data.author && embed.data.author.name) {
            totalLength += embed.data.author.name.length;
        }
        if (embed.data.image && embed.data.image.url) {
            totalLength += embed.data.image.url.length;
        }
        if (embed.data.thumbnail && embed.data.thumbnail.url) {
            totalLength += embed.data.thumbnail.url.length;
        }
        if (totalLength > 6000) {
            action.reply(message, {
                content:
                    "discord limits the length of all fields of an embed to not exceed 6000, please shorten some fields and then try again.",
                ephemeral: true,
            });
            return;
        }
        if (totalLength == 0) {
            action.reply(message, {
                content:
                    "embeds are required to have at least 1 field containing data",
                ephemeral: true,
            });
            return;
        }
        action.sendMessage(message.channel, { embeds: [embed] });
    }
);

const data = new CommandData();
data.setName("embed");
data.setDescription("create a formatted embed");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases();
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("the subcommand to use")
        .setRequired(true)
        .setChoices(
            { name: "send", value: "send" },
            { name: "preview", value: "preview" },
            { name: "setTitle", value: "setTitle" },
            { name: "setDescription", value: "setDescription" },
            { name: "setColor", value: "setColor" },
            { name: "setAuthor", value: "setAuthor" },
            { name: "setFooter", value: "setFooter" },
            { name: "setImage", value: "setImage" },
            { name: "setThumbnail", value: "setThumbnail" },
            { name: "restart", value: "restart" }
        )
);
data.addStringOption((option) =>
    option
        .setName("content")
        .setDescription(
            "content to pass to the subcommand. usually a phrase or url"
        )
        .setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const args = new Collection();
        let content = message.content.split(" ")[1];
        if (content) {
            content = content.trim();
        }

        args.set("_SUBCOMMAND", content);
        return args;
    },
    async function execute(message, args, fromInteraction) {
        action.reply(message, {
            content:
                "you need to supply a subcommand to do anything with this command. if you don't know any, use `p/help embed`. also, you might have capitalized it by accident. don't capitalize it.",
            ephemeral: true,
        });
    },
    [
        send,
        preview,
        setTitle,
        setDescription,
        setColor,
        setAuthor,
        setFooter,
        setImage,
        setThumbnail,
        restart,
    ] // subcommands
);

export default command;
