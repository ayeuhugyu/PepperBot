import chalk from "chalk";
import * as util from "util";
import fs from "fs-extra";
import process from "node:process";
import GlobalEvents from "./communication_manager";

export enum Level {
    Debug,
    Info,
    Warn,
    Error,
    Fatal,
};
const levelPrefixes = {
    [Level.Debug]: "DEBUG",
    [Level.Info]: "INFO",
    [Level.Warn]: "WARN",
    [Level.Error]: "ERROR",
    [Level.Fatal]: "FATAL"
};

const levelColors = {
    [Level.Debug]: chalk.blue,
    [Level.Info]: chalk.green,
    [Level.Warn]: chalk.yellow,
    [Level.Error]: chalk.redBright,
    [Level.Fatal]: (text: string) => {
        return chalk.bold(chalk.underline(chalk.red(text)));
    }
};

const nonGlobalLevels = [
    Level.Debug,
]

function levelPrefix(level: Level): string {
    const highestLevelLength = Math.max(...Object.values(levelPrefixes).map(l => l.length));

    return levelColors[level](levelPrefixes[level].padStart(highestLevelLength));
}
function datePrefix(date: Date): string{
    // evil hack to get the date in the format we want, local timezone
    const timezoneOffset = date.getTimezoneOffset() * 60000; // ms
    const dateLocal = new Date(date.getTime() - timezoneOffset);
    const dateFormatted = dateLocal.toISOString().slice(0, -1); // strip Z, Z=zulu=UTC
    const dateSpaced = dateFormatted.replace("T", " "); // adds a space between the date and the time (ex. 2023-07-17 14:45:30.000)

    return chalk.grey(dateSpaced);
}
function fullPrefix(level: Level, date: Date): string {
    return `${datePrefix(date)} ${levelPrefix(level)}`
}

function format(thing: unknown) {
    if (typeof thing === "string") {
        return thing;
    } else if (thing instanceof Error) {
        return thing.stack || thing.toString();
    } else {
        return util.inspect(thing, { colors: true, depth: 5 });
    }
}

function strtobl(str: string) {
    return str.toLowerCase() === "true" || str === "1" || str === "yes" || str === "y";
}

function log(level: Level, ...message: unknown[]) {
    const formatted = message
        .map(m => format(m))
        .reduce((l, r) => l.includes("\n") || r.includes("\n") ? l + "\n" + r : l + " " + r, "")
        .trim();

    const prefix = fullPrefix(level, new Date()) + " ";
    const cleanPrefix = util.stripVTControlCharacters(prefix);

    const stdoutString = `${prefix}${formatted.split("\n").join("\n" + prefix)}\n`;
    const fileString = `${cleanPrefix}${formatted.split("\n").join("\n" + cleanPrefix)}\n`;

    if (!nonGlobalLevels.includes(level) || strtobl(process.env.PRINT_NON_GLOBAL || "")) process.stdout.write(stdoutString);
    GlobalEvents.emit("log", fileString, level);
    // TODO: catch these?
    fs.appendFile(`./logs/${Level[level].toLowerCase()}.log`, fileString)
    if (!nonGlobalLevels.includes(level)) {
        fs.appendFile(`./logs/global.log`, fileString)
    }
}

export function debug(...message: unknown[]) {
    log(Level.Debug, ...message);
}
export function info(...message: unknown[]) {
    log(Level.Info, ...message);
}
export function warn(...message: unknown[]) {
    log(Level.Warn, ...message);
}
export function error(...message: unknown[]) {
    log(Level.Error, ...message);
}
export function fatal(...message: unknown[]) {
    log(Level.Fatal, ...message);
}