import * as action from "../lib/discord_action.js";
import fs from "fs";
import { Command, CommandData } from "../lib/types/commands.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const messages = await fs.readFileSync(
    `${config.paths.logs}/messages.log`,
    "utf-8"
);

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

const data = new CommandData();
data.setName("markovold");
data.setDescription(
    "make the bot say really truly something using the previous algorithm"
);
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(false);
data.setDMPermission(true);
const command = new Command(
    data,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args) {
        messages.replaceAll("\n", " ");
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
            if (!word || !markovChain.hasOwnProperty(word))
                word = words[Math.floor(Math.random() * words.length)];
        }
        let results = result.split("\n");
        let randommessage = results[Math.floor(Math.random() * results.length)];
        action.reply(message, { content: randommessage, ephemeral: true });
    }
);

export default command;
