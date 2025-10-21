import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import fs from "fs";
import { Container, MediaGallery, Separator, TextDisplay, Thumbnail } from "../lib/classes/components";

const partsOfSpeechToArray: Record<string, Array<string>> = {};

const partsOfSpeechDir = "constants/parts_of_speech";
fs.readdirSync(partsOfSpeechDir).forEach((file) => {
    if (file.endsWith(".json")) {
        const partOfSpeech = file.replace("s.json", "");
        partsOfSpeechToArray[partOfSpeech] = JSON.parse(
            fs.readFileSync(`${partsOfSpeechDir}/${file}`, "utf8")
        );
    }
});

partsOfSpeechToArray["any"] = Object.keys(partsOfSpeechToArray)
    .filter((key) => key !== "word")
    .flatMap((key) => partsOfSpeechToArray[key]);

const repeatedRegex = /(?:\w+|\(.*?\)|custom: ?"[^"]*")\*(\d{1,2})/gm;
const customRegex = /custom: ?"(.+?)"/gm;

const phrasecommand = new Command(
    {
        name: 'phrase',
        description: 'create a random phrase from a list of parts of speech',
        long_description: 'create a random phrase from a list of parts of speech',
        tags: [CommandTag.Fun],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'list',
                description: 'list of parts of speech',
                long_description: 'list of parts of speech. use `list` to see available parts of speech',
                type: CommandOptionType.String,
                required: true
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "",
        aliases: [],
        root_aliases: ["phrase"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["list"]),
    async function execute ({ invoker, args, guild_config }) {
        if (!args.list) {
            action.reply(invoker, {
                content: "missing list of parts of speech",
                ephemeral: guild_config.useEphemeralReplies,
            });
            return new CommandResponse({
                error: true,
                message: "missing list of parts of speech",
            });
        }
        if (args.list == "list" || args.list == "help" || args.list == "ls") {
            const partsOfSpeech = Object.keys(partsOfSpeechToArray);
            // Sort for consistency
            partsOfSpeech.sort();
            // Split into two columns
            // we do this in a special way:
            // first, put everything into the first column
            const col1: string[] = partsOfSpeech.map(part => part);
            // then, start by moving every item that ends with "pronoun" or "conjunction" to the second column
            const col2: string[] = [];
            col1.forEach(item => {
                if (item.endsWith("pronoun") || item.endsWith("conjunction")) {
                    col2.push(item);
                    col1.splice(col1.indexOf(item), 1);
                }
            });

            // then, move everything else to the second column, one by one, until the columns are roughly equal length
            while (col2.length < col1.length) {
                const item = col1.pop();
                if (item) {
                    col2.push(item);
                }
            }

            // pad columns to equal length
            while (col1.length < col2.length) col1.push("");
            while (col2.length < col1.length) col2.push("");

            // format as two columns
            let longestLength = 0;
            col1.forEach(item => {
                if (item.length > longestLength) {
                    longestLength = item.length;
                }
            });
            longestLength += 2; // add some padding
            const lines = col1.map((item, idx) => {
                const col1Item = item.padEnd(longestLength, " ");
                const col2Item = col2[idx] || "";
                return `${col1Item}${col2Item}`;
            });

            const codeblock = "```" + "\n" + lines.join("\n") + "\n```";

            action.reply(invoker, {
                content: `available parts of speech:\n${codeblock}\nyou can use \`partofspeech*number\` to repeat a part of speech x times, for example like this: \n\`noun*2\` or group them together: \`(adjective noun)*5\`\nyou can also use \`custom:"your custom text here"\` to insert your own text, which can also be repeated using the same syntax`,
                ephemeral: guild_config.useEphemeralReplies,
            });
            return;
        }
        const repeated = args.list.matchAll(repeatedRegex);
        for (const match of repeated) {
            const fullMatch = match[0];
            const count = parseInt(match[1]);
            let toRepeat = fullMatch.split("*")[0];
            // if toRepeat is in parentheses, remove them
            if (toRepeat.startsWith("(") && toRepeat.endsWith(")")) {
                toRepeat = toRepeat.slice(1, -1);
            }
            const repeatedString = Array(count).fill(toRepeat).join(" ");
            args.list = args.list.replace(fullMatch, repeatedString);
        }

        const customs = args.list.matchAll(customRegex);
        for (const match of customs) {
            // replace spaces in them with an obscure unicode character string so they dont get split later
            // is it a good way of doing it? no
            // do i give a shit? also no
            let fullMatch = match[0];
            // if it uses "custom: ""<custom_text>"" then we remove the space after the colon
            let customText = fullMatch.replaceAll(" ", "⁂⁒℗‽¤");
            if (fullMatch.startsWith("custom: \"")) {
                customText = customText.replace("custom:⁂⁒℗‽¤\"", "custom:\"");
            }
            args.list = args.list.replace(fullMatch, customText);
            // yea yea i could just like store a position and put it back in afterwards
            // but that would be the RESPONSIBLE thing to do
            // we don't do that around here
        }

        const list = args.list.toLowerCase().replaceAll(",", " ").split(" ").filter((part: string) => part !== "");
        const invalidParts: string[] = [];
        list.forEach((part: string) => {
            if (!partsOfSpeechToArray[part] && (!part.startsWith("custom:\"") || !part.endsWith("\""))) {
                invalidParts.push(part);
            }
        });

        if (invalidParts.length > 0) {
            action.reply(invoker, {
                content: `invalid parts of speech: \`${invalidParts.join("\`, \`")}\``,
                ephemeral: guild_config.useEphemeralReplies,
            });
            return new CommandResponse({
                error: true,
                message: `invalid parts of speech: \`${invalidParts.join("\`, \`")}\``,
            });
        }

        const phrase = list.map((part: string) => {
            if (part.startsWith("custom:\"") && part.endsWith("\"")) {
                const customText = part.slice(8, -1);
                return customText;
            }
            const array = partsOfSpeechToArray[part];
            const randomnum = Math.floor(Math.random() * array.length);
            return array[randomnum].toLowerCase();
        }).join(" ");
        const punctuation = partsOfSpeechToArray["punctuation"];
        // replace all " punctuation" with just "punctuation" so that punctuation doesnt have a weird space before it
        let finalPhrase = phrase;
        punctuation.forEach((punc: string) => {
            finalPhrase = finalPhrase.replaceAll(` ${punc}`, punc);
        });
        // replace customs back to what they should be
        finalPhrase = finalPhrase.replaceAll("⁂⁒℗‽¤", " ");
        // remove space after newlines
        finalPhrase = finalPhrase.replaceAll("\n ", "\n");

        await action.reply(invoker, {
            content: finalPhrase,
            ephemeral: guild_config.useEphemeralReplies,
        });
        return new CommandResponse({ pipe_data: { input_text: phrase } });
    }
);

const pepperfiles = fs
    .readdirSync("constants/media/the_peppers")
    .filter((file) => file.endsWith(".png") || file.endsWith(".jpg"));

const peppercommand = new Command(
    {
        name: 'pepper',
        description: 'returns a random pepper',
        long_description: 'returns a random pepper',
        tags: [CommandTag.Fun],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/random pepper",
        aliases: [],
        root_aliases: ["pepper"],
        requiredPermissions: ["AttachFiles"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, args, guild_config }) {
        const maxRan = pepperfiles.length;
        const randomnum = Math.floor(Math.random() * maxRan);
        const file = pepperfiles[randomnum];
        const embed = new Container({
            components: [
                new TextDisplay({
                    content: `## 🌶🌶🌶 RANDOM PEPPER!!!!!!!! 🌶🌶🌶`
                }),
                new Separator(),
                new MediaGallery({
                    media: [
                        new Thumbnail({
                            url: `attachment://${file}`,
                        })
                    ]
                })
            ]
        })

        action.reply(invoker, {
            components: [embed],
            components_v2: true,
            files: [`constants/media/the_peppers/${file}`],
            ephemeral: guild_config.useEphemeralReplies,
        });
    }
);

const command = new Command(
    {
        name: 'random',
        description: 'various commands that return random things',
        long_description: 'various commands that return random things',
        tags: [CommandTag.Fun],
        pipable_to: [],
        options: [],
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [peppercommand, phrasecommand]
        },
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/random pepper",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use any of the following subcommands:\n\`${guild_config.other.prefix}random pepper\`: get a random pepper\n\`${guild_config.other.prefix}random phrase\`: generate a random phrase from a list of parts of speech`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        await action.reply(invoker, {
            content: `this command does nothing if you don't supply a subcommand. use any of the following subcommands:\n\`${guild_config.other.prefix}random pepper\`: get a random pepper\n\`${guild_config.other.prefix}random phrase\`: generate a random phrase from a list of parts of speech`,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
    }
);

export default command;