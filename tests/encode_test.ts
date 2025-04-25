import { tablify } from "../src/lib/string_helpers";

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
                result.push(text[i] + count);
                count = 1;
            }
        }
        return result.join('');
    },
};

const algorithmName = "list"
const input = "721011081081113287111114108100"

const algorithm = algorithms[algorithmName];
if (!algorithm) {
    console.log(`algorithm ${algorithmName} not found; use \`list\` to see available algorithms`);
}

if (!input) {
    console.log(`no input provided`);
}

const encoded = algorithm(input);
const response = (algorithmName === "list") ? encoded : `encoded string with ${algorithmName}: \n\`\`\`\n${encoded}\n\`\`\``;
console.log(response);