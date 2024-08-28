import chalk from "chalk";
import * as util from "util";
import fs from "fs";
import fsextra from "fs-extra";
import process from "node:process";

const Level = {
    Debug: "Debug",
    Info: "Info",
    Warn: "Warn",
    Err: "Error",
    Deleted: "Deleted",
    Fatal: "Fatal",
};

function levelPrefix(level) {
    switch (level) {
        case Level.Debug:
            return chalk.gray("DBG");
        case Level.Info:
            return chalk.white("INF");
        case Level.Warn:
            return chalk.yellow("WRN");
        case Level.Err:
            return chalk.red("ERROR");
        case Level.Fatal:
            return chalk.hex("#FC0202").bold.underline("FATAL");
    }
}

function format(thing) {
    if (typeof thing === "string") {
        return thing;
    } else if (thing instanceof Error) {
        return thing.stack || thing.toString();
    } else {
        return util.inspect(thing, { colors: true, depth: 5 });
    }
}

function log(level, ...message) {
    const formatted = message
        .map((m) => format(m))
        .reduce(
            (l, r) =>
                l.includes("\n") || r.includes("\n")
                    ? l + "\n" + r
                    : l + " " + r,
            ""
        )
        .trim();
    const currentDate = new Date();
    const formattedDate = `${(currentDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${currentDate
        .getDate()
        .toString()
        .padStart(2, "0")} ${currentDate
        .getHours()
        .toString()
        .padStart(2, "0")}:${currentDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${currentDate
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
    const prefix = levelPrefix(level) + " ";
    process.stdout.write(
        `${chalk.grey(formattedDate)} ${prefix}${formatted
            .split("\n")
            .join(`\n${chalk.grey(formattedDate)} ${prefix}`)}\n`
    );
    const fileWriteString = `${formattedDate} ${level.toUpperCase()} ${formatted.split("\n").join(`\n${formattedDate} ${level.toUpperCase()} `)}\n`
    fsextra.ensureFile(`././logs/${level.toLowerCase()}.log`, () => {
        fs.appendFile(`././logs/${level.toLowerCase()}.log`, fileWriteString, () => {});
    });
    fsextra.ensureFile("././logs/global.log", () => {
        fs.appendFile("././logs/global.log", fileWriteString, () => {});
    });
}

export function debug(...message) {
    log(Level.Debug, ...message);
}

export function info(...message) {
    log(Level.Info, ...message);
}

export function warn(...message) {
    log(Level.Warn, ...message);
}

export function error(...message) {
    log(Level.Err, ...message);
}

export function fatal(...message) {
    log(Level.Fatal, ...message);
}
