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

function equipmentDataToMessage(equipmentData, requestedGodrollPip) { // todo: bold requested godroll pips
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
    for (const [key, value] of Object.entries(equipmentData.requirements)) { // REQUIREMENTS
        if (typeof value === "number") {
            message += `    ${(key === "power") ? chalk.yellow(`${key.charAt(0).toUpperCase() + key.slice(1)} ${value}`) : chalk.yellow(`${value} ${key.charAt(0).toUpperCase() + key.slice(1)}`)}\n`;
        }
    }

    if (equipmentData.pips.length > 0 || Object.keys(equipmentData.innate).length > 0) message += "\nstats:\n";
    for (const [key, value] of Object.entries(equipmentData.innate)) { // INNATE 
        if (typeof value === "number") {
            const usedKey = pipNameOverrides[key] || key;
            const displayAsPercentage = deepwokenequipment.pips[key].displayAsPercentage;
            const shouldBold = requestedGodrollPip && key === requestedGodrollPip;
            let unboldedMessage = `[2;30m+${value}${displayAsPercentage ? "%" : ""} ${usedKey.charAt(0).toUpperCase() + usedKey.slice(1)}[0m\n`;
            message += "    " 
            message += shouldBold ? chalk.underline(chalk.bold(unboldedMessage)) + "[0m" : unboldedMessage;
        }
        if (typeof value === "string") {
            message += `    [2;30m+Talent: ${key}\n        ${value}[0m\n`;
        }
    }
    equipmentData.pips.forEach((pipData) => { // PIPS
        const usedKey = pipNameOverrides[pipData.pip] || pipData.pip;
        let pipMessage = `+${pipData.value}${pipData.displayAsPercentage ? "%" : ""} ${usedKey.charAt(0).toUpperCase() + usedKey.slice(1)}${pipData.rarity === "star" ? ` (${starMessage})` : ""}`;
        const shouldBold = requestedGodrollPip && pipData.pip === requestedGodrollPip;
        if (shouldBold) pipMessage = chalk.underline(chalk.bold(pipMessage)) + "[0m"; 
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
                message += `    ${chalk.green(pipMessage)}\n`;
                break;
        }
    });
    if (equipmentData.pips.length > 0 || (Object.keys(equipmentData.innate).length > 0 && !Object.keys(equipmentData.innate).every((key) => typeof equipmentData.innate[key] === "string"))) {
        message += `\ntotals: \n`;
        let totals = {}
        for (const [key, value] of Object.entries(equipmentData.innate)) { // INNATE TOTALS
            if (typeof value === "number") {
                if (!totals[key]) totals[key] = 0;
                totals[key] += value;
            }
        }
        equipmentData.pips.forEach((pipData) => { // PIP TOTALS
            if (!totals[pipData.pip]) totals[pipData.pip] = 0;
            totals[pipData.pip] += pipData.value;
        });
        for (const [key, value] of Object.entries(totals)) { // TOTALS
            const displayAsPercentage = deepwokenequipment.pips[key].displayAsPercentage;
            const usedKey = pipNameOverrides[key] || key;
            const shouldBold = requestedGodrollPip && key === requestedGodrollPip;
            let unboldedMessage = `+${value}${displayAsPercentage ? "%" : ""} ${usedKey.charAt(0).toUpperCase() + usedKey.slice(1)}\n`;
            message += "    " 
            message += shouldBold ? chalk.underline(chalk.bold(unboldedMessage)) + "[0m" : unboldedMessage;
        }
    }
    message += "```";
    return message;
}

const statAliases = {
    "hp": "health",
    "monsterarmor": "monster",
    "damagevsmonsters": "dvm",
    "physicalarmor": "physical",
    "elementalarmor": "elemental",
    "shadowarmor": "shadow",
    "flamearmor": "flame",
    "frostarmor": "frost",
    "icearmor": "frost",
    "ice": "frost",
    "thunderarmor": "thunder",
    "galearmor": "gale",
    "windarmor": "gale",
    "wind": "gale",
    "ironsingarmor": "ironsing",
    "lightningarmor": "thunder",
    "thundercallarmor": "thunder",
    "thundercall": "thunder",
    "lightning": "thunder",
    "carryload": "carry",
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
    async function execute(message, args, fromInteraction, gconfig) {
        if (!args.get("equipment")) {
            action.reply(message, { content: "no equipment specified", ephemeral: gconfig.useEphemeralReplies });
            return;
        }
        const equipment = deepwokenequipment.getEquipment(args.get("equipment").replaceAll("_", " ").replaceAll("-", " ").replaceAll("+", " "));
        if (!args.get("stat")) {
            args.set("stat", "health");
        }
        args.set("stat", args.get("stat").toLowerCase().replaceAll("_", " ").replaceAll("-", " ").replaceAll("+", " "));
        if (typeof args.get("stars") == "undefined" || isNaN(args.get("stars"))) {
            args.set("stars", 3);
            if (equipment && deepwokenequipment.maxStarBlacklistTypes.includes(equipment.type)) {
                args.set("stars", 2);
            }
        }
        if (args.get("stat") && statAliases[args.get("stat")]) {
            args.set("stat", statAliases[args.get("stat")]);
        }
        if (!deepwokenequipment.pips[args.get("stat")]) {
            action.reply(message, { content: `invalid pip \`${args.get("stat")}\``, ephemeral: gconfig.useEphemeralReplies });
            return;
        }
        if (args.get("stars") > 3 || args.get("stars") < 0 || Number.isInteger(args.get("stars")) === false) {
            action.reply(message, { content: `invalid star count \`${args.get("stars")}\``, ephemeral: gconfig.useEphemeralReplies });
            return;
        }
        if (!equipment) {
            action.reply(message, { content: `could not find equipment \`${args.get("equipment").replaceAll("_", " ").replaceAll("-", " ").replaceAll("+", " ").replaceAll("'", "")}\``, ephemeral: gconfig.useEphemeralReplies });
            return;
        }
        
        const processedEquipment = deepwokenequipment.calculateEquipmentStats(equipment, args.get("stars"), args.get("stat"));
        const processedMessage = equipmentDataToMessage(processedEquipment, args.get("stat"));
        action.reply(message, { content: processedMessage, ephemeral: gconfig.useEphemeralReplies });
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
    async function execute(message, args, fromInteraction, gconfig) {
        const randomName = deepwokenequipment.getRandomEquipmentName();
        const equipment = deepwokenequipment.getEquipment(randomName);
        const processedEquipment = deepwokenequipment.calculateEquipmentStats(equipment);
        const processedMessage = equipmentDataToMessage(processedEquipment);
        action.reply(message, { content: processedMessage, ephemeral: gconfig.useEphemeralReplies });
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
    async function execute(message, args, fromInteraction, gconfig) {
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
        action.reply(message, { content: "here's a list of all deepwoken equipment and their pips", ephemeral: gconfig.useEphemeralReplies, files: [
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
;
data.setAliases(["deepwokenequipment"]);
data.addStringOption((option) =>
    option.setName("subcommand").setDescription("the subcommand to execute").setRequired(true)
    .addChoices(
        {name: "random", value: "random"},
        {name: "godroll", value: "godroll"},
    )
);
data.addStringOption((option) => 
    option.setName("equipment").setDescription("the equipment to calculate the godroll for; use -, _ and + for spaces. punctuation is not necessary.").setRequired(false)
)
data.addStringOption((option) =>
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
data.addIntegerOption((option) =>
    option.setName("stars").setDescription("the stars of the equipment").setRequired(false)
)
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
    [random, godroll, list] // subcommands
);

export default command;