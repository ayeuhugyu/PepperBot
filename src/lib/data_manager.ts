import knex from "knex";
import process from "node:process";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import * as log from "./log";

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

const expected_constants: string[] = [
    "deepwoken_names.json",
    "emojis.json",
    "nouns.json",
    "verbs.json",
    "the_english_lexicon.json"
];
const expectedOther: string[] = [
    "resources",
    "resources/sounds",
    "cache",
    "cache/ytdl",
    "cache/containers",
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

export function verifyData() {
    log.info("verifying data...");
    let responses: VerificationResponse[] = [];
    for (const folder of expectedOther) {
        responses.push(verifyFile(folder, true, false));
    }
    for (const file of expected_constants) {
        responses.push(verifyFile(`constants/${file}`, false, true));
    }
    for (const file of expectedLogs) {
        responses.push(verifyFile(`logs/${file}`, false, false));
    }
    responses.push(verifyFile(".env", false, true));
    if (process.env.DISCORD_TOKEN === undefined) {
        log.error("missing DISCORD_TOKEN in .env");
        responses.push({ error: true, message: "missing DISCORD_TOKEN in .env", unrecoverable: true });
    }
    // TODO: verify .env file

    return responses;
}

const database = knex({
    client: "sqlite3",
    connection: {
        filename: "resources/database.db",
    },
    useNullAsDefault: true,
});
log.info("opened database connection");

await database.schema.hasTable("prompts").then(async (exists) => {
    if (!exists) {
        log.warn("creating missing prompts table");
        return await database.schema.createTable("prompts", (table) => {
            table.string("user").primary().notNullable();
            table.string("name").notNullable();
            table.string("text").notNullable();
            table.timestamp("created_at").defaultTo(database.fn.now());
        });
    }
})

await database.schema.hasTable("todos").then(async (exists) => {
    if (!exists) {
        log.warn("creating missing todos table");
        return await database.schema.createTable("todos", (table) => {
            table.string("user").primary().notNullable();
            table.string("name").notNullable();
            table.integer("item").notNullable();
            table.string("text").notNullable();
            table.boolean("completed").notNullable().defaultTo(false);
            table.timestamp("created_at").defaultTo(database.fn.now());
        });
    }
});

await database.schema.hasTable("configs").then(async (exists) => {
    if (!exists) {
        log.warn("creating missing configs table");
        return await database.schema.createTable("configs", (table) => {
            table.string("guild").primary().notNullable();
            table.string("key").notNullable();
            table.json("value").notNullable();
        })
    }
});

await database.schema.hasTable("queues").then(async (exists) => {
    if (!exists) {
        log.warn("creating missing queues table");
        return await database.schema.createTable("queues", (table) => {
            table.string("guild").primary()
            table.string("user");
            table.string("queue_name").notNullable();
            table.integer("index").notNullable();
            table.string("link").notNullable();
            table.string("title").notNullable();
            table.string("currentIndex")
            table.timestamp("created_at").defaultTo(database.fn.now());
        })
    }
});

await database.schema.hasTable("sounds").then(async (exists) => {
    if (!exists) {
        log.warn("creating missing sounds table");
        return await database.schema.createTable("sounds", (table) => {
            table.string("guild").primary();
            table.string("user");
            table.string("name").notNullable();
            table.string("path").notNullable();
            table.timestamp("created_at").defaultTo(database.fn.now());
        })
    }
});

await database.schema.hasTable("updates").then(async (exists) => {
    if (!exists) {
        log.warn("creating missing updates table");
        return await database.schema.createTable("updates", (table) => {
            table.integer("update").primary().notNullable();
            table.string("text").notNullable();
            table.timestamp("time").defaultTo(database.fn.now());
        })
    }
});

log.info("database verified");

export default database;

['SIGINT', 'SIGTERM', 'SIGQUIT', 'EXIT'].forEach(signal => {
    process.on(signal, () => {
        log.info(`received ${signal}, closing database connection`);
        database.destroy();
        process.exit(0);
    });
});

log.info("all data verified in " + (performance.now() - start).toFixed(3) + "ms");