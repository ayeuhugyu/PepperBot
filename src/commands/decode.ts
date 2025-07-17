import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../lib/classes/command_enums";
import { tablify } from "../lib/string_helpers";

const algorithms: Record<string, (text: string) => string> = {
    "list": (_) => {
        const rows: string[][] = Object.keys(algorithms)
            .filter((algorithm) => algorithm !== "list")
            .reduce((acc, algorithm, index) => {
                const rowIndex = Math.floor(index / 2);
                if (!acc[rowIndex]) acc[rowIndex] = [];
                acc[rowIndex].push(algorithm);
                return acc;
            }, [] as string[][]);

        const text = tablify(["1", "2"], rows, {
            no_header: true,
            column_separator: "  ",
        });

        const response = `available algorithms: \n\`\`\`\n${text}\n\`\`\``;
        return response;
    },
    "utf8": (text: string): string => text, // No decoding needed for utf8
    "reverse": (text: string): string => text.split('').reverse().join(''),
    "url": (text: string): string => decodeURIComponent(text),
    "morse": (text: string): string => {
        const morseCode: Record<string, string> = {
            ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F",
            "--.": "G", "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L",
            "--": "M", "-.": "N", "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R",
            "...": "S", "-": "T", "..-": "U", "...-": "V", ".--": "W", "-..-": "X",
            "-.--": "Y", "--..": "Z",
            "-----": "0", ".----": "1", "..---": "2", "...--": "3", "....-": "4",
            ".....": "5", "-....": "6", "--...": "7", "---..": "8", "----.": "9",
            "--..--": ",", ".-.-.-": ".", "..--..": "?", "-..-.": "/", "-....-": "-",
            "-.--.": "(", "-.--.-": ")"
        };
        return text.split(' ')
            .map(code => morseCode[code] || code)
            .join('');
    },
    "binary": (text: string): string => text.split(' ')
        .map(binary => String.fromCharCode(parseInt(binary, 2)))
        .join(''),
    "base64": (text: string): string => Buffer.from(text, 'base64').toString('utf-8'),
    "hex": (text: string): string => Buffer.from(text, 'hex').toString('utf-8'),
    "bitshift": (text: string): string => Array.from(text)
        .map(char => String.fromCharCode(char.charCodeAt(0) - 1))
        .join(''),
    "rle": (text: string): string => {
        const result: { char: string; count: number }[] = [];
        const regex = /\(([\w\s])\)(\d+)/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            const [_, char, countStr] = match;
            const count = parseInt(countStr, 10);
            result.push({ char, count });
        }

        const decoded = result.map(({ char, count }) => char.repeat(count)).join('');
        return decoded;
    },
};

const command = new Command(
    {
        name: 'decode',
        description: 'decodes a string using a given algorithm',
        long_description: 'decodes a string using a given algorithm',
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
                description: 'input to decode',
                long_description: 'input to decode',
                type: CommandOptionType.String,
                required: true,
            }),
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: ["p/decode list", "p/decode base64 SGVsbG8gV29ybGQ="],
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

        const decoded = algorithm(input);
        const response = (algorithmName === "list") ? decoded : `decoded string with ${algorithmName}: \n\`\`\`\n${decoded}\n\`\`\``;
        action.reply(invoker, { content: response, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { input_text: decoded } });
    }
);

export default command;