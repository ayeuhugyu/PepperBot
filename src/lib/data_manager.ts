import knex from "knex";
import process from "node:process";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import * as log from "./log";
import { execFile } from "node:child_process";

const start = performance.now();

interface VerificationResponse {
    error: boolean;
    message: string;
    unrecoverable: boolean;
}

function verifyFile(path: string, folder: boolean = false, unrecoverableIfNotExists: boolean = false) {
    if (folder) {
        if (!fs.existsSync(path)) {
            if (unrecoverableIfNotExists) {
                log.error(`failed to find ${path}/`);
                return { error: true, message: `failed to find ${path}/`, unrecoverable: true };
            }
            log.warn(`could not find ${path}/, creating it`);
            try {
                fs.mkdirSync(path, { recursive: true });
            } catch (err) {
                log.error(`failed to create ${path}/, ${err}`);
                return { error: true, message: `failed to create ${path}/, ${err}`, unrecoverable: true };
            }
            return { error: true, message: `failed to find ${path}/, created`, unrecoverable: false };
        } else {
            log.info(`found ${path}/`);
            return { error: false, message: `found ${path}/`, unrecoverable: false };
        }
    }
    if (!fs.existsSync(path)) {
        if (unrecoverableIfNotExists) {
            log.error(`failed to find ${path}`);
            return { error: true, message: `failed to find ${path}`, unrecoverable: true };
        }
        log.warn(`could not find ${path}, creating it`);
        try {
            fs.writeFileSync(path, path.endsWith(".json") ? "{}" : "");
        } catch (err) {
            log.error(`failed to create ${path}, ${err}`);
            return { error: true, message: `failed to create ${path}, ${err}`, unrecoverable: true };
        }
        return { error: true, message: `failed to find ${path}, created`, unrecoverable: false };
    } else {
        log.info(`found ${path}`);
        return { error: false, message: `found ${path}`, unrecoverable: false };
    }
}

const expectedOther: string[] = [
    "resources",
    "resources/sounds",
    "cache",
    "cache/ytdl",
    "cache/containers",
    "cache/luau",
    "logs",
];
const expectedLogs: string[] = [
    "debug.log",
    "info.log",
    "warn.log",
    "error.log",
    "fatal.log",
    "global.log",
]
const nonFatalEnvVariables = [
    { key: "DISCORD_CLIENT_SECRET", message: "missing DISCORD_CLIENT_SECRET in .env; some features may not work, expect errors" },
    { key: "OPENAI_API_KEY", message: "missing OPENAI_API_KEY in .env; some features may not work, expect errors" },
    { key: "GOOGLE_API_KEY", message: "missing GOOGLE_API_KEY in .env; some features may not work, expect errors" },
    { key: "GOOGLE_CUSTOM_SEARCH_ENGINE_ID", message: "missing GOOGLE_CUSTOM_SEARCH_ENGINE_ID in .env; some features may not work, expect errors" },
    { key: "ADOBE_API_KEY", message: "missing ADOBE_API_KEY in .env; some features may not work, expect errors" },
    { key: "LASTFM_API_KEY", message: "missing LASTFM_API_KEY in .env; some features may not work, expect errors" },
];

// really messed up way to avoid verifying multiple times (just makes the logs cleaner)

export function verifyData() {
    log.info("verifying data...");
    let responses: VerificationResponse[] = [];
    for (const folder of expectedOther) {
        responses.push(verifyFile(folder, true, false));
    }
    for (const file of expectedLogs) {
        responses.push(verifyFile(`logs/${file}`, false, false));
    }
    responses.push(verifyFile(".env", false, true));
    if (process.env.DISCORD_TOKEN === undefined) {
        log.error("missing DISCORD_TOKEN in .env");
        responses.push({ error: true, message: "missing DISCORD_TOKEN in .env", unrecoverable: true });
    }

    for (const { key, message } of nonFatalEnvVariables) {
        if (process.env[key] === undefined) {
            log.error(message);
            responses.push({ error: true, message, unrecoverable: false });
        }
    }
    try {
        execFile("yt-dlp", ["--version"], (error, stdout, stderr) => {
            if (error) {
                log.error("yt-dlp not found; some features may not work, expect errors. have you added it to your PATH?");
                responses.push({ error: true, message: "yt-dlp not found; some features may not work, expect errors. have you added it to your PATH?", unrecoverable: false });
            } else {
                log.info("found yt-dlp");
                responses.push({ error: false, message: "found yt-dlp", unrecoverable: false });
            }
        });
    } catch (err) {
        log.error("yt-dlp not found; some features may not work, expect errors. have you added it to your PATH?");
        responses.push({ error: true, message: "yt-dlp not found; some features may not work, expect errors. have you added it to your PATH?", unrecoverable: false });
    }
    try {
        execFile("lune", ["--version"], (error, stdout, stderr) => {
            if (error) {
                log.error("lune not found; some features may not work, expect errors. have you added it to your PATH?");
                responses.push({ error: true, message: "lune not found; some features may not work, expect errors. have you added it to your PATH?", unrecoverable: false });
            } else {
                log.info("found lune");
                responses.push({ error: false, message: "found lune", unrecoverable: false });
            }
        });
    } catch (err) {
        log.error("lune not found; some features may not work, expect errors. have you added it to your PATH?");
        responses.push({ error: true, message: "lune not found; some features may not work, expect errors. have you added it to your PATH?", unrecoverable: false });
    }

    return responses;
}

const verificationResponses = verifyData();
let unrecoverable = verificationResponses.filter((response) => response.unrecoverable);
if (unrecoverable.length > 0) {
    console.error("unrecoverable errors found:");
    unrecoverable.forEach((response) => {
        console.error(response.message);
    });
    console.error("fix the above errors and try again. you may have cloned the repository incorrectly, or you are missing .env properties.");
    process.exit(1);
}

const database = knex({
    client: "sqlite3",
    connection: {
        filename: "resources/database.db",
    },
    useNullAsDefault: true,
});
log.info("opened database connection");

export default database;
export const tables = ["prompts", "todos", "configs", "queues", "sounds", "updates", "statistics"];

['SIGINT', 'SIGTERM', 'SIGQUIT', 'EXIT'].forEach(signal => {
    process.on(signal, () => {
        log.info(`received ${signal}, closing database connection`);
        database.destroy();
        process.exit(0);
    });
});

log.info("all data verified in " + (performance.now() - start).toFixed(3) + "ms");