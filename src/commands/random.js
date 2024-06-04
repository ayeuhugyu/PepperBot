import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import { createRandomFreshie } from "../lib/types/deepwokenCharacter.js";
import * as voice from "../lib/voice.js";
import default_embed from "../lib/default_embed.js";
import fs from "fs";
import * as log from "../lib/log.js";
import { randomBuildIdea as randomUnbiasedBuildIdea } from "../lib/deepwokenUnbiasedBuildIdea.js";
import { randomBuildIdea as randomBiasedBuildIdea } from "../lib/deepwokenBiasedBuildIdea.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const deepwoken_names = globals.deepwoken_names
const allWords = globals.allWords

const rmessagedata = new SubCommandData();
rmessagedata.setName("message");
rmessagedata.setDescription("returns a random message from the channel it's used in");
rmessagedata.setPermissions([]);
rmessagedata.setPermissionsReadable("");
rmessagedata.setWhitelist([]);
rmessagedata.setCanRunFromBot(true);
const rmessage = new SubCommand(
    rmessagedata,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction) {
        const channel = message.channel
        const messages = channel.messages
        const messageCache = messages.cache
        let acc = 0
        let randomMessage = messageCache.random();
        while (randomMessage.content.startsWith(config.generic.prefix) || randomMessage.author.bot) {
            randomMessage = messageCache.random();
            acc++
            if (acc > 500) {
                action.reply(message, "too many attempts to find a valid message, exiting. rerun the command and hope you get lucky")
                return
            }
        }
        action.reply(message, { content: randomMessage.content, files: randomMessage.attachments, })
    }
);

const namedata = new SubCommandData();
namedata.setName("name");
namedata.setDescription("return a random deepwoken name");
namedata.setPermissions([]);
namedata.setPermissionsReadable("");
namedata.setWhitelist([]);
namedata.setCanRunFromBot(true);
const name = new SubCommand(
    namedata,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction) {
        const randomFirstName =
            deepwoken_names.default.firstNames[
                Math.floor(
                    Math.random() * deepwoken_names.default.firstNames.length
                )
            ];
        const randomLastName =
            deepwoken_names.default.lastNames[
                Math.floor(
                    Math.random() * deepwoken_names.default.lastNames.length
                )
            ];
        if (message)
            action.reply(message, randomFirstName + " " + randomLastName);
        return randomFirstName, randomLastName;
    }
);

const sounddata = new SubCommandData();
sounddata.setName("sound");
sounddata.setDescription("play a random noise from the soundboard");
sounddata.setPermissions([]);
sounddata.setPermissionsReadable("");
sounddata.setWhitelist([]);
sounddata.setCanRunFromBot(true);
const sound = new SubCommand(
    sounddata,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction) {
        let connection = await voice.getVoiceConnection(message.guild.id);
        if (!connection) {
            // join vc by default
            if (!message.member.voice.channel) {
                action.reply(
                    message,
                    "you're not in a voice channel, and im not already in one. baffoon."
                );
                return;
            }
            connection = await voice.joinVoiceChannel(
                message.member.voice.channel
            );
            action.reply(
                message,
                `joined <#${message.member.voice.channel.id}>`
            );
        }
        const audioPlayer = await voice.createAudioPlayer();
        connection.subscribe(audioPlayer);
        const sounds = await fs.readdirSync(config.paths.soundboard);
        let randomValue = Math.floor(Math.random() * sounds.length);
        const resource = await voice.createAudioResource(
            `${config.paths.soundboard}/${sounds[randomValue]}`
        );
        voice.playResource(resource, audioPlayer);
        action.reply(message, `playing \`${sounds[randomValue]}\``);
    }
);

const wordsdata = new SubCommandData();
wordsdata.setName("words");
wordsdata.setDescription("return an amount of random words");
wordsdata.setPermissions([]);
wordsdata.setPermissionsReadable("");
wordsdata.setWhitelist([]);
wordsdata.setCanRunFromBot(true);
wordsdata.addNumberOption((option) =>
    option
        .setName("amount")
        .setDescription("amount of random words to reply with")
        .setRequired(true)
);
const words = new SubCommand(
    wordsdata,
    async function getArguments(message) {
        let args = new Collection();
        const commandLength = message.content.split(" ")[0].length - 1;
        args = new Collection();
        let amount = message.content
            .slice(config.generic.prefix.length + commandLength)
            .trim();
        args.set("amount", amount);
        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (args.get("amount") > config.commands.randomwords_max) {
            args.set("amount", config.commands.randomwords_max);
        }
        if (args.get("amount") < 1) {
            args.set("amount", 1);
        }

        let content = "";
        if (!args.get("amount")) {
            action.reply(message, "gimme an amount of words damnit");
            return;
        }
        for (let i = 0; i < args.get("amount"); i++) {
            const allWordsNum = Math.floor(Math.random() * allWords.length);
            content += allWords[allWordsNum] + " ";
        }
        action.reply(message, content);
    }
);

const pepperfiles = fs
.readdirSync(config.paths.peppers)
.filter((file) => file.endsWith(".png") || file.endsWith(".jpg"));

const pepperdata = new SubCommandData();
pepperdata.setName("pepper");
pepperdata.setDescription("return a random pepper");
pepperdata.setPermissions([]);
pepperdata.setPermissionsReadable("");
pepperdata.setWhitelist([]);
pepperdata.setCanRunFromBot(true);
const pepper = new SubCommand(
    pepperdata,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction) {
        const maxRan = pepperfiles.length;
        const randomnum = Math.floor(Math.random() * maxRan);
        const file = pepperfiles[randomnum];
        const embed = default_embed();
        embed.setImage(`attachment://${file}`);
        embed.setTitle("🌶🌶🌶 RANDOM PEPPER!!!!!!!! 🌶🌶🌶");

        action.reply(message, {
            embeds: [embed],
            files: [`${config.paths.peppers}/${file}`],
            ephemeral: true,
        });
    }
);

const freshiedata = new SubCommandData();
freshiedata.setName("freshie");
freshiedata.setDescription("return a random deepwoken freshie");
freshiedata.setPermissions([]);
freshiedata.setPermissionsReadable("");
freshiedata.setWhitelist([]);
freshiedata.setCanRunFromBot(true);
const freshie = new SubCommand(
    freshiedata,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction) {
        const freshie = createRandomFreshie();
        const embed = await default_embed();
        const boons = freshie.boonsAndFlaws.boons;
        const flaws = freshie.boonsAndFlaws.flaws;
        let boonsText = "";
        let flawsText = "";
        boonsText += boons[0];
        if (boons[1]) boonsText += ", " + boons[1];
        flawsText += flaws[0] + " ";
        if (flaws[1]) flawsText += ", " + flaws[1];

        embed.setTitle(freshie.name);
        embed.setImage(`attachment://${freshie.racialVariant}.png`);
        embed.setDescription(`
RACE: ${freshie.race}
VARIANT: ${freshie.racialVariant}
PRESENTATION: ${freshie.presentation}
ORIGIN: ${freshie.origin}
BOONS: ${boonsText}
FLAWS: ${flawsText}
STATS:
    **ATTUNEMENTS:**
        Flamecharm: ${freshie.attributes.attunements.Flamecharm}
        Frostdraw: ${freshie.attributes.attunements.Frostdraw}
        Galebreathe: ${freshie.attributes.attunements.Galebreathe}
        Thundercall: ${freshie.attributes.attunements.Thundercall}
        Shadowcast: ${freshie.attributes.attunements.Shadowcast}
        Ironsing: ${freshie.attributes.attunements.Ironsing}
    **BASIC:**
        Strength: ${freshie.attributes.basic.Strength}
        Fortitude: ${freshie.attributes.basic.Fortitude}
        Agility: ${freshie.attributes.basic.Agility}
        Intelligence: ${freshie.attributes.basic.Intelligence}
        Willpower: ${freshie.attributes.basic.Willpower}
        Charisma: ${freshie.attributes.basic.Charisma}

POINTS LEFT: ${freshie.pointsLeft}`);
        action.reply(message, {
            embeds: [embed],
            files: [
                `resources/images/deepwokenRaces/${freshie.race}/${freshie.racialVariant}.png`,
            ],
            ephemeral: true,
        });
    }
);

const buildideadata = new SubCommandData();
buildideadata.setName("buildidea");
buildideadata.setDescription("return a random build idea for deepwoken");
buildideadata.setPermissions([]);
buildideadata.setPermissionsReadable("");
buildideadata.setWhitelist([]);
buildideadata.setCanRunFromBot(true);
const buildidea = new SubCommand(
    buildideadata,
    async function getArguments(message) {
        let args = new Collection();
        args.set("weighted", message.content.split(" ")[1]);
        return args;
    },
    async function execute(message, args, fromInteraction) {
        let buildIdea;
        const embed = default_embed();
        embed.setTitle("Random Build Idea");
        if (!args.get("weighted")) buildIdea = randomUnbiasedBuildIdea();
        else buildIdea = randomBiasedBuildIdea();
        let text = `
WEAPON: ${buildIdea.weapon}
ATTUNEMENTS: ${buildIdea.attunements.join(", ")}
ARMOR: ${buildIdea.armor}
OATH: ${buildIdea.oath}
FOCUS: ${buildIdea.focus}
`;
        embed.setDescription(text);
        action.reply(message, { embeds: [embed], ephemeral: true });
    }
);

const data = new CommandData();
data.setName("random");
data.setDescription("do a random something (you pick)");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases();
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("the subcommand to run")
        .setRequired(true)
        .addChoices(
            { name: "name", value: "name" },
            { name: "sound", value: "sound" },
            { name: "words", value: "words" },
            { name: "pepper", value: "pepper" },
            { name: "freshie", value: "freshie" },
            { name: "buildidea", value: "buildidea" }
        )
);
data.addStringOption((option) =>
    option
        .setName("amount")
        .setDescription(
            "amount of random words to reply with (does nothing if subcommand is not words)"
        )
        .setRequired(false)
);
data.addBooleanOption((option) =>
    option
        .setName("weighted")
        .setDescription(
            "affects whether or not the random build will be weighted"
        )
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set("_SUBCOMMAND", message.content.split(" ")[1]);
        if (args.get("type")) {
            args.set(
                "amount",
                message.content.slice(
                    config.generic.prefix.length +
                        commandLength +
                        args.get("type").toString().length +
                        1
                )
            );
        }
        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (!args.get("_SUBCOMMAND")) {
            action.reply(
                message,
                "provide a type of random to do you baffoon!"
            );
            return;
        }
        action.reply(
            message,
            `invalid type of random \`${args.get(
                "_SUBCOMMAND"
            )}\`, you baffoon!`
        );
    },
    [buildidea, freshie, pepper, words, sound, name, rmessage]
);

export default command;
