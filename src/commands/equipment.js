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
import * as deepwokenequipment from "../lib/deepwokenequipment.js";
import chalk from "chalk";
import * as files from "../lib/files.js";

const config = globals.config;

const starMessages = ["", "★", "★★", "★★★"];

/*
rarity colors:
common: white
uncommon: yellow
rare: red
legendary: cyan
mythic: purple
relic: lime
hallowtide: orange
*/

const pipNameOverrides = {
    "monster": "monster armor",
    "dvm": "damage vs monsters",
    "physical": "physical armor",
    "elemental": "elemental armor",
    "shadow": "shadow armor",
    "flame": "flame armor",
    "frost": "frost armor",
    "thunder": "thunder armor",
    "gale": "gale armor",
    "ironsing": "ironsing armor",
    "carry": "carry load",
}

function equipmentDataToMessage(equipmentData) {
    const starMessage = starMessages[equipmentData.stars] || "";
    const titleMessage = `--${starMessage ? ` ${starMessage} ` : ""}${equipmentData.name.toUpperCase()}--`
    let processedTitleMessage = "";
    switch (equipmentData.rarity) {
        case "common":
            processedTitleMessage = titleMessage
            break;
        case "uncommon":
            processedTitleMessage = chalk.yellow(titleMessage);
            break;
        case "rare":
            processedTitleMessage = chalk.red(titleMessage);
            break;
        case "legendary":
            processedTitleMessage = chalk.cyan(titleMessage);
            break;
        case "mythic":
            processedTitleMessage = chalk.magenta(chalk.underline(chalk.bold(titleMessage))) + "[0m";
            break;
        case "relic":
            processedTitleMessage = chalk.green(chalk.underline(chalk.bold(titleMessage))) + "[0m";
            break;
        case "hallowtide":
            processedTitleMessage = chalk.yellow(chalk.underline(chalk.bold(titleMessage))) + "[0m";
            break;
        default: 
            processedTitleMessage = titleMessage;
            break;
    }
    let message = `\`\`\`ansi
${processedTitleMessage}${equipmentData.flagInvalidStar ? chalk.red(" (★★★ is not obtainable on this item)") : ""}
type: ${equipmentData.type}\n`;
    if (Object.keys(equipmentData.requirements).length > 0) message += "\nrequirements:\n";
    for (const [key, value] of Object.entries(equipmentData.requirements)) {
        if (typeof value === "number") {
            message += `    ${chalk.yellow(`${value} ${key.charAt(0).toUpperCase() + key.slice(1)}`)}\n`;
        }
    }

    if (equipmentData.pips.length > 0 || Object.keys(equipmentData.innate).length > 0) message += "\nstats:\n";
    for (const [key, value] of Object.entries(equipmentData.innate)) {
        if (typeof value === "number") {
            const usedKey = pipNameOverrides[key] || key;
            const displayAsPercentage = deepwokenequipment.pips[key].displayAsPercentage;
            message += `    [2;30m+${value}${displayAsPercentage ? "%" : ""} ${usedKey.charAt(0).toUpperCase() + usedKey.slice(1)}[0m\n`;
        }
        if (typeof value === "string") {
            message += `    [2;30m+Talent: ${key}\n        ${value}[0m\n`;
        }
    }
    equipmentData.pips.forEach((pipData) => {
        const usedKey = pipNameOverrides[pipData.pip] || pipData.pip;
        const pipMessage = `+${pipData.value}${pipData.displayAsPercentage ? "%" : ""} ${usedKey.charAt(0).toUpperCase() + usedKey.slice(1)}`;
        switch (pipData.rarity) {
            case "common":
                message += `    ${pipMessage}\n`;
                break;
            case "uncommon":
                message += `    ${chalk.yellow(pipMessage)}\n`;
                break;
            case "rare":
                message += `    ${chalk.red(pipMessage)}\n`;
                break;
            case "legendary": 
                message += `    ${chalk.cyan(pipMessage)}\n`;
                break;
            case "star":
                message += `    ${chalk.green(`${pipMessage} (${starMessage})`)}\n`;
                break;
        }
    });
    if (equipmentData.pips.length > 0 || (Object.keys(equipmentData.innate).length > 0 && !Object.keys(equipmentData.innate).every((key) => typeof equipmentData.innate[key] === "string"))) {
        message += `\ntotals: \n`;
        let totals = {}
        for (const [key, value] of Object.entries(equipmentData.innate)) {
            if (typeof value === "number") {
                if (!totals[key]) totals[key] = 0;
                totals[key] += value;
            }
        }
        equipmentData.pips.forEach((pipData) => {
            if (!totals[pipData.pip]) totals[pipData.pip] = 0;
            totals[pipData.pip] += pipData.value;
        });
        for (const [key, value] of Object.entries(totals)) {
            const displayAsPercentage = deepwokenequipment.pips[key].displayAsPercentage;
            const usedKey = pipNameOverrides[key] || key;
            message += `    +${value}${displayAsPercentage ? "%" : ""} ${usedKey.charAt(0).toUpperCase() + usedKey.slice(1)}\n`;
        }
    }
    message += "```";
    return message;
}

const godrolldata = new SubCommandData();
godrolldata.setName("godroll");
godrolldata.setDescription("calculates the godroll for a stat of a given piece of equipment and its stars");
godrolldata.setPermissions([]);
godrolldata.setPermissionsReadable("");
godrolldata.setWhitelist([]);
godrolldata.setCanRunFromBot(true);
godrolldata.setNormalAliases(["godroll"]);
godrolldata.addStringOption((option) => 
    option.setName("equipment").setDescription("the equipment to calculate the godroll for; use -, _ and + for spaces. punctuation is not necessary.").setRequired(true)
)
godrolldata.addStringOption((option) =>
    option.setName("stat").setDescription("the stat to calculate the godroll for").setRequired(false)
    .addChoices(
        {name: "health", value: "health"},
        {name: "ether", value: "ether"},
        {name: "sanity", value: "sanity"},
        {name: "posture", value: "posture"},
        {name: "dvm", value: "dvm"},
        {name: "physical", value: "physical"},
        {name: "elemental", value: "elemental"},
        {name: "monster armor", value: "monster"},
    )
)
godrolldata.addIntegerOption((option) =>
    option.setName("stars").setDescription("the stars of the equipment").setRequired(false)
)
const godroll = new SubCommand(
    godrolldata,
    async function getArguments(message, gconfig) {
        const args = new Collection();
        args.set("equipment", message.content.split(" ")[1]);
        args.set("stat", message.content.split(" ")[2]);
        args.set("stars", parseInt(message.content.split(" ")[3]));
        return args;
    },
    async function execute(message, args, fromInteraction) {
        const equipment = deepwokenequipment.getEquipment(args.get("equipment").replaceAll("_", " ").replaceAll("-", " ").replaceAll("+", " "));
        if (!args.get("stat")) {
            args.set("stat", "health");
        }
        if (typeof args.get("stars") == "undefined" || isNaN(args.get("stars"))) {
            args.set("stars", 3);
            if (equipment && deepwokenequipment.maxStarBlacklistTypes.includes(equipment.type)) {
                args.set("stars", 2);
            }
        }
        if (!deepwokenequipment.pips[args.get("stat")]) {
            action.reply(message, { content: `invalid pip \`${args.get("stat")}\``, ephemeral: true });
            return;
        }
        if (args.get("stars") > 3 || args.get("stars") < 0 || Number.isInteger(args.get("stars")) === false) {
            action.reply(message, { content: `invalid star count \`${args.get("stars")}\``, ephemeral: true });
            return;
        }
        if (!equipment) {
            action.reply(message, { content: `could not find equipment \`${args.get("equipment").replaceAll("_", " ").replaceAll("-", " ").replaceAll("+", " ")}\``, ephemeral: true });
            return;
        }
        
        const processedEquipment = deepwokenequipment.calculateEquipmentStats(equipment, args.get("stars"), args.get("stat"));
        const processedMessage = equipmentDataToMessage(processedEquipment);
        action.reply(message, { content: processedMessage, ephemeral: true });
    }
);

const randomdata = new SubCommandData();
randomdata.setName("random");
randomdata.setDescription("returns a random piece of equipment");
randomdata.setPermissions([]);
randomdata.setPermissionsReadable("");
randomdata.setWhitelist([]);
randomdata.setCanRunFromBot(true);

const random = new SubCommand(
    randomdata,
    async function getArguments(message, gconfig) {
        const args = new Collection();
        return args;
    },
    async function execute(message, args, fromInteraction) {
        const randomName = deepwokenequipment.getRandomEquipmentName();
        const equipment = deepwokenequipment.getEquipment(randomName);
        const processedEquipment = deepwokenequipment.calculateEquipmentStats(equipment);
        const processedMessage = equipmentDataToMessage(processedEquipment);
        action.reply(message, { content: processedMessage, ephemeral: true });
    }
);

const listdata = new SubCommandData();
listdata.setName("list");
listdata.setDescription("returns a list of all equipment and their pips");
listdata.setPermissions([]);
listdata.setPermissionsReadable("");
listdata.setWhitelist([]);
listdata.setCanRunFromBot(true);
listdata.setAliases(["ls"]);
const list = new SubCommand(
    listdata,
    async function getArguments(message, gconfig) {
        const args = new Collection();
        return args;
    },
    async function execute(message, args, fromInteraction) {
        let lsmessage = "";
        let previousType = ""
        for (const [key, value] of Object.entries(deepwokenequipment.equipment)) {
            if (previousType !== value.type) {
                lsmessage += `${previousType === "" ? "" : "\n"}--${value.type.toUpperCase()} EQUIPMENT--\n\n`;
                previousType = value.type
            }
            const result = value.pips.reduce((acc, pip) => {
                // Capitalize the first letter of the pip type
                const capitalizedPip = pip.charAt(0).toUpperCase() + pip.slice(1);
                // Increment the count for the pip type
                acc[capitalizedPip] = (acc[capitalizedPip] || 0) + 1;
                return acc;
            }, {});
            
            let formattedResult = Object.entries(result)
                .map(([pip, count]) => `${count} ${pip}`)
                .join(', ');
            formattedResult += " pips";
            lsmessage += `${key}: ${formattedResult}\n`;
        }
        const file = await files.textToFile(lsmessage, "equipmentlist");
        action.reply(message, { content: "here's a list of all deepwoken equipment and their pips", ephemeral: true, files: [
            {
                name: "equipmentlist.txt",
                attachment: file,
            },
        ], });
    }
);

const data = new CommandData();
data.setName("equipment");
data.setDescription("various deepwoken equipment related commands");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["deepwokenequipment"]);
data.addStringOption((option) =>
    option.setName("subcommand").setDescription("the subcommand to execute").setRequired(true)
    .addChoices(
        {name: "random", value: "random"},
        {name: "godroll", value: "godroll"},
    )
);
godrolldata.addStringOption((option) => 
    option.setName("equipment").setDescription("the equipment to calculate the godroll for; use -, _ and + for spaces. punctuation is not necessary.").setRequired(false)
)
godrolldata.addStringOption((option) =>
    option.setName("stat").setDescription("the stat to calculate the godroll for").setRequired(false)
    .addChoices(
        {name: "health", value: "health"},
        {name: "ether", value: "ether"},
        {name: "sanity", value: "sanity"},
        {name: "posture", value: "posture"},
        {name: "dvm", value: "dvm"},
        {name: "physical", value: "physical"},
        {name: "elemental", value: "elemental"},
        {name: "monster armor", value: "monster"},
    )
)
godrolldata.addIntegerOption((option) =>
    option.setName("stars").setDescription("the stars of the equipment").setRequired(false)
)
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const args = new Collection();
        args.set("_SUBCOMMAND", message.content.split(" ")[1]);
        return args;
    },
    async function execute(message, args, fromInteraction, guildConfig) {
        if (args.get("_SUBCOMMAND")) {
            action.reply(message, {
                content: "invalid subcommand: " + args.get("_SUBCOMMAND"),
                ephemeral: true
            })
            return;
        }
        action.reply(message, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: true
        })
    },
    [random, godroll, list] // subcommands
);

export default command;

/*
example subcommand:
const subcommand1data = new CommandData();
subcommand1data.setName("");
subcommand1data.setDescription("");
subcommand1data.setPermissions([]);
subcommand1data.setPermissionsReadable("");
subcommand1data.setWhitelist([]);
subcommand1data.setCanRunFromBot(true);
subcommand1data.addStringOption((option) =>
    option.setName("").setDescription("").setRequired(true)
);

const subcommand1 = new SubCommand(
    subcommand1data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "ARGUMENT",
                message.content
                .slice(prefix.length + commandLength)
                .split(" ")[0]
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {}
);

additional notes:
subcommands do not (as of now) support aliases, only the main command does
subcommands do not (as of now) support additional subcommands, only the main command does
subcommands need to have their own argument in the getArgs function.
if you're going to use subcommands, your getArgs function in the main command should include somewhere:
        args.set(
            "_SUBCOMMAND",
            message.content.split(" ")[1].trim()
        );
or similiar
you also need to have the following in your main data:
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("subcommand to run")
        .setRequired(false)
        .addChoices(
            {name: "subcommandname", value: "subcommandname"},
        )
);
but obviously choices would have all of your subcommands
this just allows for the use of subcommands from slash commands

*/
