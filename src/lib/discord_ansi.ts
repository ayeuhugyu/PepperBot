// discord_ansi.ts
// Utility for Discord-compatible ANSI coloring (subset of chalk)
// Only uses colors supported by Discord's code block highlighting

export const DiscordAnsi = {
    bold: (str: string) => `[1;2m${str}[0m`,
    gray: (str: string) => `[2;30m${str}[0m`,
    white: (str: string) => `[2;37m${str}[0m`,
    red: (str: string) => `[2;32m[2;31m${str}[0m`,
    green: (str: string) => `[2;32m${str}[0m`,
    gold: (str: string) => `[2;33m${str}[0m`,
    blue: (str: string) => `[2;34m${str}[0m`,
    magenta: (str: string) => `[2;35m${str}[0m`,
    cyan: (str: string) => `[2;36m${str}[0m`,
    bgBlack: (str: string) => `[2;40m${str}[0m`,
    bgRust: (str: string) => `[2;41m${str}[0m`,
    bgBlue: (str: string) => `[2;34m${str}[0m`, // since discord is dumb and doesnt support every color, we use blue for bgBlue
    bgBlurple: (str: string) => `[2;45m${str}[0m`,
    bgGreen: (str: string) => `[2;32m${str}[0m`, // since discord is dumb and doesnt support every color, we use green for bgGreen
    reset: (str: string) => `[0m${str}`,
};

// Example usage:
// DiscordAnsi.red("text")
// DiscordAnsi.bold(DiscordAnsi.blue("text"))
