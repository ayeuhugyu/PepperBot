import * as action from "../lib/discord_action.js";
import fs from "fs";
import { tokenize, textify } from "../lib/tokenizer.js";
import { Command, CommandData, SubCommand, SubCommandData } from "../lib/types/commands.js";
import * as globals from "../lib/globals.js";
import { integrations } from "googleapis/build/src/apis/integrations/index.js";
import { Collection } from "discord.js";
import { content } from "googleapis/build/src/apis/content/index.js";

const config = globals.config;

const escapeString = (token) => `_+${token}`;
const fromTokens = (tokens) => escapeString(tokens.join(""));
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = (list) => list[random(0, list.length - 1)];

function sliceCorpus(corpus, sampleSize) {
    return corpus
        .map((_, index) => corpus.slice(index, index + sampleSize))
        .filter((group) => group.length === sampleSize);
}

function collectTransitions(samples) {
    return samples.reduce((transitions, sample) => {
        // Split the sample into key tokens and the transition token:
        const lastIndex = sample.length - 1;
        const lastToken = sample[lastIndex];
        const restTokens = sample.slice(0, lastIndex);

        // The first tokens constitute the key
        // which we will use to get the list of potential transitions:
        const state = fromTokens(restTokens);
        const next = lastToken;

        // And later it's all like we did earlier:
        transitions[state] = transitions[state] ?? [];
        transitions[state].push(next);
        return transitions;
    }, {});
}

function predictNext(chain, transitions, sampleSize) {
    const lastState = fromTokens(chain.slice(-(sampleSize - 1)));
    const nextWords = transitions[lastState] ?? [];
    return pickRandom(nextWords);
}

function createChain(startText, transitions) {
    const head = startText ?? pickRandom(Object.keys(transitions));
    return tokenize(head);
}

function* generateChain(startText, transitions, sampleSize) {
    const chain = createChain(startText, transitions);

    while (true) {
        const state = predictNext(chain, transitions, sampleSize);
        yield state;

        if (state) chain.push(state);
        else chain.pop();
    }
}

export function generate({ source, start = null, wordsCount = 100 } = {}) {
    const corpus = tokenize(String(source));
    const samples = sliceCorpus(corpus, wordsCount);
    const transitions = collectTransitions(samples, 20);
    const generator = generateChain(start, transitions, wordsCount);
    const generatedTokens = [];

    for (let i = 0; i < wordsCount; i++) {
        generatedTokens.push(generator.next().value);
    }
    return textify(generatedTokens);
}

const text = await fs
    .readFileSync(`logs/messages.log`, "utf-8")
    .replaceAll("\n", " \n");
const messages = await fs.readFileSync(`logs/messages.log`, "utf-8")
//const corpus = tokenize(text);
//const samples = sliceCorpus(corpus, 20);
//const transitions = collectTransitions(samples, 20);

function markovChainGenerator(text) {
    const textArr = text.split(" ");
    const markovChain = {};
    for (let i = 0; i < textArr.length; i++) {
        let word = textArr[i].toLowerCase().replace(/[\W_]/, " ");
        if (!markovChain[word]) {
            markovChain[word] = [];
        }
        if (textArr[i + 1]) {
            if (markovChain[word] && markovChain[word] instanceof Array)
                markovChain[word].push(
                    textArr[i + 1].toLowerCase().replace(/[\W_]/, " ")
                );
        }
    }
    return markovChain;
}

const olddata = new SubCommandData();
olddata.setName("old");
olddata.setDescription("make the bot say something #SPECIAL!!! but using the old algorithm");
olddata.setPermissions([]);
olddata.setPermissionsReadable("");
olddata.setWhitelist([]);
olddata.setCanRunFromBot(false);
olddata.setNormalAliases([["markovold"]])
olddata.setAliases(["trigger", "markovchain"]);
const old = new SubCommand(
    olddata,
    async function getArguments(message) {
        const args = new Collection();
        return args;
    },
    async function execute(message, args, isInteraction, gconfig) {
        messages.replaceAll("\n", " ")
        const markovChain = markovChainGenerator(messages);
        const words = Object.keys(markovChain);
        let word = words[Math.floor(Math.random() * words.length)];
        let result = "";
        for (let i = 0; i < words.length; i++) {
            result += word + " ";
            let newWord =
                markovChain[word][
                    Math.floor(Math.random() * markovChain[word].length)
                ];
            word = newWord;
            if (!word || !(word in markovChain))
                word = words[Math.floor(Math.random() * words.length)];
        }
        let results = result.split("\n");
        let randommessage = results[Math.floor(Math.random() * results.length)];
        action.reply(message, { content: randommessage, ephemeral: gconfig.useEphemeralReplies });
    }
);

const data = new CommandData();
data.setName("markov");
data.setDescription("make the bot say something #SPECIAL!!!");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(false);
data.setAliases(["trigger", "markovchain"]);
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("the subcommand to use")
        .setRequired(false)
        .addChoices(
            { name: "old", value: "old" },
        )    
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        const commandLength = message.content.split(" ")[0].length - 1;
        args.set(
            "_SUBCOMMAND",
            message.content
                .slice(prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, isInteraction, gconfig) {
        if (args.get("_SUBCOMMAND")) {
            action.reply(message, { content: `invalid subcommand: ${args.get("_SUBCOMMAND")}`, ephemeral: gconfig.useEphemeralReplies });
            return
        }
        const wordsCount = Math.floor(Math.random() * 25) + 1;
        const sentMessage = await action.reply(message, {
            content: "processing...",
            ephemeral: gconfig.useEphemeralReplies,
        })
        const msg = await generate({ source: text, wordsCount: wordsCount });
        if (msg.replaceAll(" ", "") === "") {
            let newText = await generate({
                source: text,
                wordsCount: wordsCount,
            });
            let count = 0;
            while (true) {
                if (newText.replaceAll(" ", "") === "") {
                    if (count >= 5) {
                        newText = pickRandom(text.split("\n"));
                        break;
                    }
                    newText = await generate({
                        source: text,
                        wordsCount: wordsCount,
                    });
                    count += 1;
                } else {
                    break;
                }
            }
            if (newText.replaceAll(" ", "") === "") {
                action.editMessage(sentMessage, {
                    content: "generated message contained no content",
                    ephemeral: gconfig.useEphemeralReplies,
                });
                return;
            }
            action.editMessage(sentMessage, { content: newText, ephemeral: gconfig.useEphemeralReplies });
            return;
        }
        action.editMessage(sentMessage, { content: msg, ephemeral: gconfig.useEphemeralReplies });
    },
    [old]
);

export default command;
