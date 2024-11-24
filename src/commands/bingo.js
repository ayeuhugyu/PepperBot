import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import {
    Collection,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ComponentType,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import fs from "fs";
import fsextra from "fs-extra";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";
import * as files from "../lib/files.js";
import * as theme from "../lib/theme.js";

const config = globals.config;

class BingoBlock {
    constructor(name, marked = false) {
        this.name = name
        this.marked = marked;
    }
}

class BingoGame {
    rows = [
        [new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false)],
        [new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false)],
        [new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false)],
        [new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false)],
        [new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false), new BingoBlock("unnamed", false)],
    ]
    constructor(name, ownerID) {
        this.name = name;
        this.ownerID = ownerID;
    }
    markBlock(x, y, markedState) {
        this.rows[y][x].marked = markedState;
    }
    nameBlock(x, y, name) {
        this.rows[y][x].name = name;
    }
    getBlock(x, y) {
        return this.rows[y][x];
    }
}

const data = new CommandData();
data.setName("bingo");
data.setDescription("create and manage bingo games");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(false);
;
data.setAliases(["list"]);
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("the subcommand to use")
        .setRequired(false)
        .addChoices(
            { name: "create", value: "create" },
            { name: "switch", value: "switch" },
            { name: "mark", value: "mark" },
            { name: "edit", value: "edit" },
            { name: "get", value: "get" },
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
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set("_SUBCOMMAND", message.content.split(" ")[1]);
        if (args.get("args")) {
            args.set(
                "content",
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
    async function execute(message, args, fromInteraction, gconfig) {
        
    },
    [] // subcommands
);

export default command;
