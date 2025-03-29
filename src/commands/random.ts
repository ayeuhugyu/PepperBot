import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import fs from "fs";
import { createThemeEmbed, Theme } from "../lib/theme";
import { data } from "cheerio/dist/commonjs/api/attributes";

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
                long_description: 'list of parts of speech',
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
            return;
        }
        if (args.list == "list" || args.list == "help" || args.list == "ls") {
            const partsOfSpeech = Object.keys(partsOfSpeechToArray);
            action.reply(invoker, {
                content: `available parts of speech: \`${partsOfSpeech.join("\`, \`")}\``,
                ephemeral: guild_config.useEphemeralReplies,
            });
            return;
        }
        const list = args.list.toLowerCase().split(" ");
        let errored = false;
        list.forEach((part: string) => {
            if (!partsOfSpeechToArray[part]) {
                action.reply(invoker, {
                    content: `invalid part of speech: ${part}`,
                    ephemeral: guild_config.useEphemeralReplies,
                });
                errored = true;
                return;
            }
        });
        if (errored) return;

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
        root_aliases: ["pepper"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, args, guild_config }) {
        const maxRan = pepperfiles.length;
        const randomnum = Math.floor(Math.random() * maxRan);
        const file = pepperfiles[randomnum];
        const embed = createThemeEmbed(Theme.CURRENT)
        embed.setImage(`attachment://${file}`);
        embed.setTitle("🌶🌶🌶 RANDOM PEPPER!!!!!!!! 🌶🌶🌶");

        action.reply(invoker, {
            embeds: [embed],
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
        if (!args.subcommand) {
            action.reply(invoker, {
                content: "invalid subcommand: " + args.subcommand,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        action.reply(invoker, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: guild_config.other.use_ephemeral_replies
        });
    }
);

export default command;