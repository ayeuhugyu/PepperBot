import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../lib/classes/command_enums";
import { tablify } from "../lib/string_helpers";

const algorithms: Record<string, (text: string) => string> = {
    "list": (_) => {
        const rows: string[][] = Object.keys(algorithms)
            .filter((algorithm) => algorithm !== "list")
            .map((algorithm) => {
                const encoded = algorithms[algorithm]("Hello World");
                return [algorithm, encoded.length > 20 ? encoded.slice(0, 20) + "..." : encoded];
            });
        const columns = ["Name", "Example"];

        const text = tablify(columns, rows);

        return `available algorithms: \n\`\`\`\n${text}\n\`\`\``;
    },
    "utf8": (text: string): string => Buffer.from(text, 'utf-8').toString('utf-8'),
    "reverse": (text: string): string => text.split('').reverse().join(''),
    "url": (text: string): string => encodeURIComponent(text),
    "morse": (text: string): string => {
        const morseCode: Record<string, string> = {
            "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.",
            "G": "--.", "H": "....", "I": "..", "J": ".---", "K": "-.-", "L": ".-..",
            "M": "--", "N": "-.", "O": "---", "P": ".--.", "Q": "--.-", "R": ".-.",
            "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-",
            "Y": "-.--", "Z": "--..",
            "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
            "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
            ",": "--..--", ".": ".-.-.-", "?": "..--..", "/": "-..-.", "-": "-....-",
            "(": "-.--.", ")": "-.--.-"
        };
        return text.toUpperCase().split('').map(char => morseCode[char] || char).join(' ');
    },
    "binary": (text: string): string => Array.from(text)
        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join(' '),
    "base64": (text: string): string => Buffer.from(text).toString('base64'),
    "hex": (text: string): string => Buffer.from(text).toString('hex'),
    "bitshift": (text: string): string => Array.from(text)
        .map(char => String.fromCharCode(char.charCodeAt(0) + 1))
        .join(''),
    "rle": (text: string): string => {
        const result: string[] = [];
        let count = 1;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === text[i + 1]) {
                count++;
            } else {
                result.push(`(${text[i]})${count}`);
                count = 1;
            }
        }
        return result.join('');
    },
};

const command = new Command(
    {
        name: 'encode',
        description: 'encodes a string with a given algorithm',
        long_description: 'encodes a string with a given algorithm',
        tags: [CommandTag.Utility, CommandTag.TextPipable],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'algorithm',
                description: 'algorithm to use',
                long_description: 'algorithm to use',
                type: CommandOptionType.String,
                required: true,
                choices: Object.keys(algorithms).map((algorithm) => ({
                    name: algorithm,
                    value: algorithm
                })),
            }),
            new CommandOption({
                name: 'input',
                description: 'input to encode',
                long_description: 'input to encode',
                type: CommandOptionType.String,
                required: true,
            }),
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: ["p/encode list", "p/encode base64 Hello World"],
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.TwoStringFirstSpaceSecondWholeMessage, ["algorithm", "input"]),
    async function execute ({ invoker, args, guild_config, piped_data }) {
        const algorithmName = args.algorithm;
        const input = args.input || piped_data?.data?.input_text;

        const algorithm = algorithms[algorithmName];
        if (!algorithm) {
            action.reply(invoker, { content: `unknown algorithm: ${algorithmName}; use \`list\` to see available algorithms.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({ error: true, message: `unknown algorithm: ${algorithmName}` });
        }

        if (!input && (algorithmName !== "list")) {
            action.reply(invoker, { content: `no input provided`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({ error: true, message: `no input provided` });
        }

        const encoded = algorithm(input);
        const response = (algorithmName === "list") ? encoded : `encoded string with \`${algorithmName}\`: \n\`\`\`\n${encoded}\n\`\`\``;
        action.reply(invoker, { content: response, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { data: { input_text: response } } });
    }
);

export default command;