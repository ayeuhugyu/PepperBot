import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { Collection } from "discord.js";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";
import sharp from "sharp";
import * as theme from "../lib/theme.js";
const config = globals.config;
const supportedFileFormats = ["jpeg", "png", "webp", "gif", "avif", "tiff"]

const composites = [];

class Composite {
    images = [];
    canvas = {
        width: 0,
        height: 0,
        backgroundColor: "000000"
    };
    output = {
        format: "png",
        channels: 4
    };
    addImage = function(img) {
        this.images.push(img);
        img.id = this.images.length - 1;
        return this.images
    }
    removeImage = function(id) {
        this.images.splice(id, 1);
        return this.images
    }
    getImage = function(id) {
        return this.images[id]
    }
}

class CompositeImage {
    buffer = null;
    id = 0;
    size = {
        width: 0,
        height: 0
    };
    position = {
        x: 0,
        y: 0
    };
    constructor(attachment) {
        this.buffer = fetch(attachment.url).then((response) => response.arrayBuffer());
        this.size = {
            width: attachment.width,
            height: attachment.height
        }
    }
}


function isHexColor(hex) {
    return (
        typeof hex === "string" &&
        hex.length === 6 &&
        !isNaN(Number("0x" + hex))
    );
}

function getComposite(userID) {
    if (!composites[userID]) {
        composites[userID] = new Composite();
    }
    return composites[userID];
}

function removeComposite(userID) {
    delete composites[userID];
}

const previewdata = new SubCommandData();
previewdata.setName("preview");
previewdata.setDescription("shows a preview of the composite");
previewdata.setPermissions([]);
previewdata.setPermissionsReadable("");
previewdata.setWhitelist([]);
previewdata.setCanRunFromBot(true);
previewdata.setAliases();
const preview = new SubCommand(
    previewdata,
    async function getArguments(message) {
        return new Collection();
    },
    async function execute(message, args, fromInteraction, gconfig) {
        const composite = getComposite(message.author.id);
        try {
            const canvas = sharp({
                create: {
                    width: composite.canvas.width,
                    height: composite.canvas.height,
                    channels: composite.output.channels,
                    background: `#${composite.canvas.backgroundColor}`
                }
            });
            for (const image of composite.images) {
                const img = sharp(await image.buffer);
                canvas.composite([
                    {
                        input: await img.toBuffer(),
                        left: image.position.x,
                        top: image.position.y
                    }
                ]);
            }
            const buffer = await canvas.toBuffer();
            const embed = theme.createThemeEmbed(theme.themes.CURRENT);
            embed.setTitle(`Preview of composite`);
            embed.setImage("attachment://composite.png");
            action.reply(message, {
                embeds: [embed],
                files: [
                    {
                        attachment: buffer,
                        name: "composite.png"
                    }
                ],
                ephemeral: gconfig.useEphemeralReplies,
            });
        } catch (error) {
            action.reply(message, {
                content: `an error occurred while trying to create the preview: \`${error}\``,
                ephemeral: gconfig.useEphemeralReplies,
            });
            log.error(error);
        }
    }
);


const metacommanddata = new SubCommandData();
metacommanddata.setName("meta");
metacommanddata.setDescription("gets metadata from an image in the composite");
metacommanddata.setPermissions([]);
metacommanddata.setPermissionsReadable("");
metacommanddata.setWhitelist([]);
metacommanddata.setCanRunFromBot(true);
metacommanddata.setAliases();
metacommanddata.addIntegerOption((option) =>
    option
        .setName("imageID")
        .setDescription("the ID of the image that you want to get metadata from")
        .setRequired(true)
);
const meta = new SubCommand(
    metacommanddata,
    async function getArguments(message) {
        const args = new Collection();
        args.set("imageID", parseInt(message.content.split(" ")[2]));
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (!args.get("imageID")) {
            action.reply(message, {
                content: `you need to provide an image ID to get metadata from`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        const composite = getComposite(message.author.id);
        const image = composite.getImage(args.get("imageID"));
        if (!image) {
            action.reply(message, {
                content: `the image you provided does not exist`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        const metadata = await sharp(image.buffer).metadata();
        const embed = theme.createThemeEmbed(theme.themes.CURRENT);
        embed.setTitle(`Metadata for image ${args.get("imageID")}`);
        embed.addField("Format", metadata.format);
        embed.addField("Width", metadata.width);
        embed.addField("Height", metadata.height);
        embed.addField("Channels", metadata.channels);
        embed.addField("Density", metadata.density);
        embed.addField("Has Profile", metadata.hasProfile);
        embed.addField("Space", metadata.space);
        embed.addField("Alpha", metadata.alpha);
        embed.addField("Orientation", metadata.orientation);
        action.reply(message, {
            embeds: [embed],
            ephemeral: gconfig.useEphemeralReplies,
        });
    }
);

const scaledata = new SubCommandData();
scaledata.setName("scale");
scaledata.setDescription("scales an image in the composite");
scaledata.setPermissions([]);
scaledata.setPermissionsReadable("");
scaledata.setWhitelist([]);
scaledata.setCanRunFromBot(true);
scaledata.setAliases();
scaledata.addIntegerOption((option) =>
    option
        .setName("imageID")
        .setDescription("the ID of the image that you want to scale")
        .setRequired(true)
);
scaledata.addIntegerOption((option) =>
    option
        .setName("width")
        .setDescription("the width to scale the image to")
        .setRequired(true)
);
scaledata.addIntegerOption((option) =>
    option
        .setName("height")
        .setDescription("the height to scale the image to")
        .setRequired(true)
);
const scale = new SubCommand(
    scaledata,
    async function getArguments(message) {
        const args = new Collection();
        args.set("imageID", parseInt(message.content.split(" ")[2]));
        args.set("width", parseInt(message.content.split(" ")[3]));
        args.set("height", parseInt(message.content.split(" ")[4]));
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (!args.get("imageID")) {
            action.reply(message, {
                content: `you need to provide an image ID to scale`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        if (!args.get("width") || !args.get("height")) {
            action.reply(message, {
                content: `you need to provide a width and height to scale the image to`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        const composite = getComposite(message.author.id);
        const image = composite.getImage(args.get("imageID"));
        if (!image) {
            action.reply(message, {
                content: `the image you provided does not exist`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        image.size.width = args.get("width");
        image.size.height = args.get("height");
        action.reply(message, {
            content: `scaled image ${args.get("imageID")} to ${args.get("width")}x${args.get("height")}`,
            ephemeral: gconfig.useEphemeralReplies,
        });
    }
);

const movedata = new SubCommandData();
movedata.setName("move");
movedata.setDescription("moves an image in the composite");
movedata.setPermissions([]);
movedata.setPermissionsReadable("");
movedata.setWhitelist([]);
movedata.setCanRunFromBot(true);
movedata.setAliases();
movedata.addIntegerOption((option) =>
    option
        .setName("imageID")
        .setDescription("the ID of the image that you want to move")
        .setRequired(true)
);
movedata.addIntegerOption((option) =>
    option
        .setName("x")
        .setDescription("the x position to move the image to")
        .setRequired(true)
);
movedata.addIntegerOption((option) =>
    option
        .setName("y")
        .setDescription("the y position to move the image to")
        .setRequired(true)
);
const move = new SubCommand(
    movedata,
    async function getArguments(message) {
        const args = new Collection();
        args.set("imageID", parseInt(message.content.split(" ")[2]));
        args.set("x", parseInt(message.content.split(" ")[3]));
        args.set("y", parseInt(message.content.split(" ")[4]));
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (!args.get("imageID")) {
            action.reply(message, {
                content: `you need to provide an image ID to move`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        if (!args.get("x") || !args.get("y")) {
            action.reply(message, {
                content: `you need to provide an x and y position to move the image to`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        const composite = getComposite(message.author.id);
        const image = composite.getImage(args.get("imageID"));
        if (!image) {
            action.reply(message, {
                content: `the image you provided does not exist`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        image.position.x = args.get("x");
        image.position.y = args.get("y");
        action.reply(message, {
            content: `moved image ${args.get("imageID")} to ${args.get("x")}, ${args.get("y")}`,
            ephemeral: gconfig.useEphemeralReplies,
        });
    }
);

const cleardata = new SubCommandData();
cleardata.setName("clear");
cleardata.setDescription("clears the composite");
cleardata.setPermissions([]);
cleardata.setPermissionsReadable("");
cleardata.setWhitelist([]);
cleardata.setCanRunFromBot(true);
cleardata.setAliases();
const clear = new SubCommand(
    cleardata,
    async function getArguments(message) {
        return new Collection();
    },
    async function execute(message, args, fromInteraction, gconfig) {
        removeComposite(message.author.id);
        action.reply(message, {
            content: `cleared composite`,
            ephemeral: gconfig.useEphemeralReplies,
        });
    }
);

const outputdata = new SubCommandData();
outputdata.setName("output");
outputdata.setDescription("sets the output file format");
outputdata.setPermissions([]);
outputdata.setPermissionsReadable("");
outputdata.setWhitelist([]);
outputdata.setCanRunFromBot(true);
outputdata.setAliases();
outputdata.addStringOption((option) =>
    option
        .setName("format")
        .setDescription("the output file format")
        .setRequired(true)
        .setChoices(
            { name: "jpeg", value: "jpeg" },
            { name: "png", value: "png" },
            { name: "webp", value: "webp" },
            { name: "gif", value: "gif" },
            { name: "avif", value: "avif" },
            { name: "tiff", value: "tiff" }
        )
);
const output = new SubCommand(
    outputdata,
    async function getArguments(message) {
        const args = new Collection();
        args.set("format", message.content.split(" ")[2]);
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        const composite = getComposite(message.author.id);
        if (!supportedFileFormats.includes(args.get("format"))) {
            action.reply(message, {
                content: `the format you provided is not supported. supported formats are: ${supportedFileFormats.join(", ")}`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        composite.output.format = args.get("format");
        action.reply(message, {
            content: `set output format to ${args.get("format")}`,
            ephemeral: gconfig.useEphemeralReplies,
        });
    }
);

const canvasdata = new SubCommandData();
canvasdata.setName("canvas");
canvasdata.setDescription("sets the canvas properties");
canvasdata.setPermissions([]);
canvasdata.setPermissionsReadable("");
canvasdata.setWhitelist([]);
canvasdata.setCanRunFromBot(true);
canvasdata.setAliases();
canvasdata.addIntegerOption((option) =>
    option
        .setName("width")
        .setDescription("the width of the canvas")
        .setRequired(true)
);  
canvasdata.addIntegerOption((option) =>
    option
        .setName("height")
        .setDescription("the height of the canvas")
        .setRequired(true)
);
canvasdata.addStringOption((option) =>
    option
        .setName("backgroundColor")
        .setDescription("the background color of the canvas")
        .setRequired(false)
);
const canvas = new SubCommand(
    canvasdata,
    async function getArguments(message) {
        const args = new Collection();
        args.set("width", parseInt(message.content.split(" ")[2]));
        args.set("height", parseInt(message.content.split(" ")[3]));
        args.set("backgroundColor", message.content.split(" ")[4]);
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (!args.get("width") && !args.get("height") && !args.get("backgroundColor")) {
            action.reply(message, {
                content: `you need to provide a width, height or background color for the canvas`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        if ((args.get("width") || args.get("height")) && !(args.get("width") && args.get("height"))) {
            action.reply(message, {
                content: `you need to provide a width and height for the canvas`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        if (args.get("width") < 1 || args.get("height") < 1) {
            action.reply(message, {
                content: `the width and height of the canvas must be greater than 0`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        if (args.get("backgroundColor") && !isHexColor(args.get("backgroundColor"))) {
            action.reply(message, {
                content: `the color you provided is not a valid hex color`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        const composite = getComposite(message.author.id);
        if (args.get("width")) {
            composite.canvas.width = args.get("width");
        }
        if (args.get("height")) {
            composite.canvas.height = args.get("height");
        }
        if (args.get("backgroundColor")) {
            composite.canvas.backgroundColor = args.get("backgroundColor");
        }

        action.reply(message, {
            content: `set canvas properties`,
            ephemeral: gconfig.useEphemeralReplies,
        });
    }
);

const removedata = new SubCommandData();
removedata.setName("remove");
removedata.setDescription("removes an image from the composite");
removedata.setPermissions([]);
removedata.setPermissionsReadable("");
removedata.setWhitelist([]);
removedata.setCanRunFromBot(true);
removedata.setAliases();
removedata.addIntegerOption((option) =>
    option
        .setName("imageID")
        .setDescription("the ID of the image to remove")
        .setRequired(true)
);
const remove = new SubCommand(
    removedata,
    async function getArguments(message) {
        const args = new Collection();
        args.set("imageID", parseInt(message.content.split(" ")[2]));
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (!args.get("imageID")) {
            action.reply(message, {
                content: `you need to provide an image ID to remove from the composite`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        const composite = getComposite(message.author.id);
        composite.removeImage(args.get("imageID"));
        action.reply(message, {
            content: `removed image from composite`,
            ephemeral: gconfig.useEphemeralReplies,
        });
    }
);

const adddata = new SubCommandData();
adddata.setName("add");
adddata.setDescription("adds an image to the composite");
adddata.setPermissions([]);
adddata.setPermissionsReadable("");
adddata.setWhitelist([]);
adddata.setCanRunFromBot(true);
adddata.setAliases();
adddata.addAttachmentOption((option) =>
    option
        .setName("image")
        .setDescription("the image to add to the composite")
        .setRequired(true)
);
const add = new SubCommand(
    adddata,
    async function getArguments(message) {
        const args = new Collection();
        const attachment = message.attachments.first();
        args.set("image", attachment);
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (!args.get("image")) {
            action.reply(message, {
                content: `you need to provide an image to add to the composite`,  
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        const fileExtension = args.get("image").name.split(".").pop();
        if (!supportedFileFormats.includes(fileExtension)) {
            action.reply(message, {
                content: `the file format of the image you provided is not supported. supported formats are: ${supportedFileFormats.join(", ")}`,
                ephemeral: gconfig.useEphemeralReplies,
            });
            return;
        }
        const composite = getComposite(message.author.id);
        const image = new CompositeImage(args.get("image"));
        composite.addImage(image);
        action.reply(message, {
            content: `added image to composite, its ID is ${image.id}.`,
            ephemeral: gconfig.useEphemeralReplies,
        });
    }
);

const data = new CommandData();
data.setName("composite");
data.setDescription("allows you to put images together quickly");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setAliases();
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("the subcommand to use")
        .setRequired(true)
        .setChoices(
            { name: "add", value: "add" },
            { name: "remove", value: "remove" },
            { name: "preview", value: "preview" },
            { name: "meta", value: "meta" },
            { name: "move", value: "move" },
            { name: "scale", value: "scale" },
            { name: "canvas", value: "canvas" },
            { name: "output", value: "output" },
            { name: "clear", value: "clear" }
        )
);
data.addAttachmentOption((option) =>
    option
        .setName("image")
        .setDescription("the image to add to the composite")
        .setRequired(false)
);
data.addIntegerOption((option) => option.setName("imageID").setDescription("the ID of the image that you want to move/scale").setRequired(false));
data.addIntegerOption((option) => option.setName("x").setDescription("the x position to move the image to").setRequired(false));
data.addIntegerOption((option) => option.setName("y").setDescription("the y position to move the image to").setRequired(false));
data.addIntegerOption((option) => option.setName("width").setDescription("the width to scale the image/canvas to").setRequired(false));
data.addIntegerOption((option) => option.setName("height").setDescription("the height to scale the image/canvas to").setRequired(false));
data.addStringOption((option) => option.setName("format").setDescription("the output file format").setRequired(false).setChoices(
    { name: "jpeg", value: "jpeg" },
    { name: "png", value: "png" },
    { name: "webp", value: "webp" },
    { name: "gif", value: "gif" },
    { name: "avif", value: "avif" },
    { name: "tiff", value: "tiff" }
));
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
    async function execute(message, args, fromInteraction, gconfig) {
        const prefix = gconfig.prefix || config.generic.prefix
        action.reply(message, {
            content:
                `you need to supply a subcommand to do anything with this command. if you don't know any, use \`${prefix}help embed\`. also, you might have capitalized it by accident. don't capitalize it.`,
            ephemeral: gconfig.useEphemeralReplies,
        });
    },
    [add, remove, canvas, output, clear, move, scale, meta, preview] // subcommands
);

export default command;
