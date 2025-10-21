import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import * as thesaurus from "../lib/dictionary";
import * as log from "../lib/log";
import { Container, Separator, TextDisplay } from "../lib/classes/components";
import { tablify } from "../lib/string_helpers";

async function fetchSingleWord(word: string): Promise<thesaurus.ThesaurusData> {
    const data = await thesaurus.getThesaurusData(word);
    if (!data) {
        log.error("no data found for the word");
        process.exit(1);
    }
    log.debug(`thesaurus raw word (${word}) data: ${JSON.stringify(data)}`);
    const theData = typeof data[0] === "string" ? {
        id: word,
        stems: [],
        syns: [data],
        ants: [],
        offensive: false,
    } as thesaurus.APIThesaurusData : data[0]?.meta;
    const formattedData = new thesaurus.ThesaurusData(word, theData);
    log.debug(`thesaurus formatted word (${word}) data: ${JSON.stringify(formattedData)}`);
    return formattedData;
}

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
    async function execute ({ invoker, args, guild_config }) {
        const word = ((args.word ?? "") as string).trim().toLowerCase();
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
        // convert synonyms into a two column list
        const syncol1: string[] = [];
        const syncol2: string[] = [];
        data.synonyms.forEach((syn, index) => {
            if (index % 2 === 0) {
                syncol1.push(syn);
            } else {
                syncol2.push(syn);
            }
        });
        const stringSynonyms = tablify(["1", "2"], [syncol1, syncol2], { no_header: true, column_separator: "  " });
        // convert antonyms into a two column list
        const antcol1: string[] = [];
        const antcol2: string[] = [];
        data.antonyms.forEach((ant, index) => {
            if (index % 2 === 0) {
                antcol1.push(ant);
            } else {
                antcol2.push(ant);
            }
        });
        const stringAntonyms = tablify(["1", "2"], [antcol1, antcol2], { no_header: true, column_separator: "  " });
        const embed = new Container({
            components: [
                new TextDisplay({
                    content: `**${word}**`
                }),
                new Separator(),
                new TextDisplay({
                    content: `**synonyms:**\n\`\`\`\n${stringSynonyms}\n\`\`\``
                }),
                new Separator(),
                new TextDisplay({
                    content: `**antonyms:**\n\`\`\`\n${stringAntonyms}\n\`\`\``
                })
            ]
        });
        await action.reply(invoker, {
            components: [embed],
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
        return new CommandResponse({
            error: false,
            pipe_data: {
                input_text: `word: ${word}\n\nsynonyms:\n\n${data.synonyms.join("\n")}\n\nantonyms:\n\n${data.antonyms.join("\n")}`
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
            list: [get]
        }
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use any of the following subcommands:\n\`${guild_config.other.prefix}thesaurus get\`: get antonyms and synonyms of a specific word\n\`${guild_config.other.prefix}thesaurus translate\`: translate a phrase into synonyms`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        await action.reply(invoker, {
            content: `this command does nothing if you don't supply a subcommand. use any of the following subcommands:\n\`${guild_config.other.prefix}thesaurus get\`: get antonyms and synonyms of a specific word\n\`${guild_config.other.prefix}thesaurus translate\`: translate a phrase into synonyms`,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
    }
);

export default command;