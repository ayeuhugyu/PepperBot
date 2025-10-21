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
            // then, start by moving every item that ends with "pronoun" to the second column
            const col2: string[] = [];
            col1.forEach(item => {
                if (item.endsWith("pronoun")) {
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
                content: `available parts of speech:\n${codeblock}`,
                ephemeral: guild_config.useEphemeralReplies,
            });
            return;
        }
        const list = args.list.toLowerCase().replaceAll(",", " ").split(" ").filter((part: string) => part !== "");
        const invalidParts: string[] = [];
        list.forEach((part: string) => {
            if (!partsOfSpeechToArray[part]) {
            invalidParts.push(part);
            }
        });

        if (invalidParts.length > 0) {
            action.reply(invoker, {
                content: `invalid parts of speech: ${invalidParts.join(", ")}`,
                ephemeral: guild_config.useEphemeralReplies,
            });
            return new CommandResponse({
                error: true,
                message: `invalid parts of speech: \`${invalidParts.join("\`, \`")}\``,
            });
        }

        const phrase = list.map((part: string) => {
            const array = partsOfSpeechToArray[part];
            const randomnum = Math.floor(Math.random() * array.length);
            return array[randomnum].toLowerCase();
        }).join(" ");

        await action.reply(invoker, {
            content: phrase,
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