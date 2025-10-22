import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import * as thesaurus from "../lib/dictionary";
import * as log from "../lib/log";
import { Container, Separator, TextDisplay } from "../lib/classes/components";
import { Message } from "discord.js";

async function fetchSingleWord(word: string): Promise<thesaurus.ThesaurusData> {
    const data = await thesaurus.getThesaurusData(word);
    if (!data) {
        log.error("no data found for the word");
        process.exit(1);
    }
    log.debug(`thesaurus raw word (${word}) data: ${JSON.stringify(data)}`);
    const formattedData = new thesaurus.ThesaurusData(word, data);
    log.debug(`thesaurus formatted word (${word}) data: ${JSON.stringify(formattedData)}`);
    return formattedData;
}

const translate = new Command(
    {
        name: 'translate',
        description: 'translates a phrase into synonyms',
        long_description: 'identifies the synonyms for each word in a given phrase and constructs a new phrase using those synonyms',
        tags: [CommandTag.Fun, CommandTag.TextPipable],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'phrase',
                description: 'the phrase to translate',
                long_description: 'the phrase to translate into synonyms',
                type: CommandOptionType.String,
                required: true
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/thesaurus translate this is a test",
        aliases: [],
        root_aliases: ["thesaurusize", "synonymize"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["phrase"]),
    async function execute ({ invoker, args, guild_config, piped_data }) {
        let phrase = ((args.phrase ?? "") as string).trim().toLowerCase();
        if (!phrase) {
            // try piped data
            if (piped_data && piped_data.data.input_text) {
                phrase = (piped_data.data.input_text as string).trim().toLowerCase();
            }
        }
        if (!phrase) {
            await action.reply(invoker, {
                content: `please provide a phrase to translate`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                error: true,
                message: "no phrase provided",
            });
        }
        const words = phrase.split(/\s+/);
        const translatedWords: string[] = [];
        for (const word of words) {
            if (!word) continue;
            const data = await fetchSingleWord(word);
            if (data.relatives.length > 0) {
                // pick a random relative
                const relative = data.relatives[Math.floor(Math.random() * data.relatives.length)];
                translatedWords.push(relative);
            } else if (data.synonyms.length > 0) {
                // pick a random synonym
                const synonym = data.synonyms[Math.floor(Math.random() * data.synonyms.length)];
                translatedWords.push(synonym);
            } else {
                translatedWords.push(word); // no synonym found, keep original word
            }
        }
        const translatedPhrase = translatedWords.join(" ");
        await action.reply(invoker, {
            content: translatedPhrase,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
        return new CommandResponse({
            error: false,
            pipe_data: {
                input_text: translatedPhrase
            }
        });
    }
);

function columnize(items: string[]): string[][] {
    const col1: string[] = [];
    const col2: string[] = [];
    const col3: string[] = [];
    const col4: string[] = [];
    let currentCol = 0;
    for (const item of items) {
        if (currentCol === 0) {
            col1.push(item);
        } else if (currentCol === 1) {
            col2.push(item);
        } else if (currentCol === 2) {
            col3.push(item);
        } else {
            col4.push(item);
        }
        currentCol = (currentCol + 1) % 4;
    }
    // equalize their lengths
    const maxLength = Math.max(col1.length, col2.length, col3.length, col4.length);
    while (col1.length < maxLength) {
        col1.push("");
    }
    while (col2.length < maxLength) {
        col2.push("");
    }
    while (col3.length < maxLength) {
        col3.push("");
    }
    while (col4.length < maxLength) {
        col4.push("");
    }
    return [col1, col2, col3, col4];
}

function tablify(columns: string[][]): string {
    const columnCount = columns.length;
    const rowCount = columns[0].length;
    const colWidths: number[] = [];
    for (let i = 0; i < columnCount; i++) {
        let maxWidth = 0;
        for (let j = 0; j < rowCount; j++) {
            if (columns[i][j].length > maxWidth) {
                maxWidth = columns[i][j].length;
            }
        }
        colWidths.push(maxWidth);
    }
    let lines: string[] = [];
    for (let row = 0; row < rowCount; row++) {
        let line = "";
        for (let col = 0; col < columnCount; col++) {
            const item = columns[col][row] || "";
            line += item.padEnd(colWidths[col] + 2, ' ');
        }
        lines.push(line.trimEnd());
    }
    return lines.join('\n');
}

const sentFetches: Record<string, string> = {};
// to prevent spamming the chat with massive embeds we will store recent fetches here and link users back to them

const get = new Command(
    {
        name: 'get',
        description: 'get synonyms and antonyms for a word',
        long_description: 'get synonyms and antonyms for a specific word',
        tags: [CommandTag.Fun, CommandTag.TextPipable],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'word',
                description: 'the word to look up',
                long_description: 'the word to look up in the thesaurus',
                type: CommandOptionType.String,
                required: true
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/thesaurus get happy",
        aliases: ["find", "lookup"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["word"]),
    async function execute ({ invoker, args, guild_config, piped_data }) {
        let word = ((args.word ?? "") as string).trim().toLowerCase();
        if (!word) {
            // try piped data
            if (piped_data && piped_data.data.input_text) {
                word = (piped_data.data.input_text as string).trim().toLowerCase();
            }
        }
        if (!word) {
            await action.reply(invoker, {
                content: `please provide a word to look up`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                error: true,
                message: "no word provided",
            });
        }
        const data = await fetchSingleWord(word);
        if (!data.perDefinition || data.perDefinition.length === 0) {
            await action.reply(invoker, {
                content: `no definitions, synonyms, antonyms, or relatives found for **${word}**`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                error: true,
                message: `no definitions, synonyms, antonyms, or relatives found for ${word}`,
            });
        }

        const containers = data.perDefinition.map((def, idx) =>
            new Container({
                components: [
                    new TextDisplay({ content: `**${word}**` }),
                    new Separator(),
                    new TextDisplay({ content: `**definition ${idx + 1}:** ${def.definition}` }),
                    new TextDisplay({ content: `**synonyms**\n\`\`\`\n${def.synonyms.length > 0 ? tablify(columnize(def.synonyms)) : "N/A"}\n\`\`\`` }),
                    new TextDisplay({ content: `**antonyms**\n\`\`\`\n${def.antonyms.length > 0 ? tablify(columnize(def.antonyms)) : "N/A"}\n\`\`\`` }),
                    new TextDisplay({ content: `**relatives**\n\`\`\`\n${def.relatives.length > 0 ? tablify(columnize(def.relatives)) : "N/A"}\n\`\`\`` }),
                    new Separator()
                ]
            })
        );
        if (!sentFetches[word]) {
            const myResponse = await action.reply(invoker, {
                components: containers,
                ephemeral: true,
                components_v2: true,
            });
            if (myResponse && myResponse instanceof Message) {
                sentFetches[word] = myResponse.url;
            }
        } else {
            await action.reply(invoker, {
                content: `you have recently looked up **${word}**. here is the previous result: ${sentFetches[word]}`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
        }
        // for pipe_data, just join all synonyms/antonyms for all definitions
        const allSynonyms = data.synonyms.join("\n");
        const allAntonyms = data.antonyms.join("\n");
        const allRelatives = data.relatives.join("\n");
        return new CommandResponse({
            error: false,
            pipe_data: {
                input_text: `word: ${word}\n\nsynonyms:\n\n${allSynonyms}\n\nantonyms:\n\n${allAntonyms}\n\nrelatives:\n\n${allRelatives}`
            }
        });
    }
);

const command = new Command(
    {
        name: 'thesaurus',
        description: 'look up a word in the thesaurus',
        long_description: 'allows you to find synonyms and antonyms for a given word. it can also "translate" an entire phrase',
        tags: [CommandTag.Fun, CommandTag.TextPipable],
        pipable_to: [CommandTag.TextPipable],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: ["p/thesaurus get happy", "p/thesaurus translate this sentence is false"],
        aliases: ["synonyms", "antonyms"],
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [get, translate]
        }
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use any of the following subcommands:\n\`${guild_config.other.prefix}thesaurus get\`: get antonyms and synonyms of a specific word\n\`${guild_config.other.prefix}thesaurus translate\`: translate a phrase into synonyms\n\`${guild_config.other.prefix}thesaurus antonymize\`: translate a phrase into antonyms`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        await action.reply(invoker, {
            content: `this command does nothing if you don't supply a subcommand. use any of the following subcommands:\n\`${guild_config.other.prefix}thesaurus get\`: get antonyms and synonyms of a specific word\n\`${guild_config.other.prefix}thesaurus translate\`: translate a phrase into synonyms\n\`${guild_config.other.prefix}thesaurus antonymize\`: translate a phrase into antonyms`,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
    }
);

export default command;