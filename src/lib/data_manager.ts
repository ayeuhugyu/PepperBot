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
const nonFatalEnvVariables = [
    { key: "DISCORD_CLIENT_SECRET", message: "missing DISCORD_CLIENT_SECRET in .env; some features may not work" },
    { key: "OPENAI_API_KEY", message: "missing OPENAI_API_KEY in .env; some features may not work" },
    { key: "GOOGLE_API_KEY", message: "missing GOOGLE_API_KEY in .env; some features may not work" },
    { key: "GOOGLE_CUSTOM_SEARCH_ENGINE_ID", message: "missing GOOGLE_CUSTOM_SEARCH_ENGINE_ID in .env; some features may not work" },
    { key: "ADOBE_API_KEY", message: "missing ADOBE_API_KEY in .env; some features may not work" },
    { key: "LASTFM_API_KEY", message: "missing LASTFM_API_KEY in .env; some features may not work" },
];

let dataVerified = false;
await fetch("http://localhost:50000/verified").then((res) => res.text()).then((text) => { 
    if (text === "true") dataVerified = true;
}).catch(() => {
    log.warn("failed to check if data has already been verified with internal server, assuming unverified")
});
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

    // TODO: verify .env file
    dataVerified = true;
    return responses;
}
if (!dataVerified) {
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
}

const database = knex({
    client: "sqlite3",
    connection: {
        filename: "resources/database.db",
    },
    useNullAsDefault: true,
});
log.info("opened database connection");

async function ensureTable(tableName: string) {
    const exists = await database.schema.hasTable(tableName);
    if (!exists) {
        log.warn(`adding missing table "${tableName}"`);
        await database.schema.createTable(tableName, (table) => {
            table.binary("_Dummy") // sqlite errors if you try to create a table with no columns
        });
    }
}

async function ensureColumn(tableName: string, columnName: string, columnDefinition: (table: any) => void) {
    const exists = await database.schema.hasColumn(tableName, columnName);
    if (!exists) {
        log.warn(`adding missing column "${columnName}" to table "${tableName}"`);
        await database.schema.table(tableName, async (table) => {
            await columnDefinition(table);
        });
    }
}

async function finishTable(tableName: string) {
    if (await database.schema.hasColumn(tableName, "_Dummy")) {
        await database.schema.table(tableName, (table) => {
            log.info(`removing dummy column from ${tableName}`);
            table.dropColumn("_Dummy");
        });
    }
}

await ensureTable("prompts");
await ensureColumn("prompts", "name", (table) => table.string("name").notNullable());
await ensureColumn("prompts", "content", (table) => table.text("content").notNullable());
await ensureColumn("prompts", "author_id", (table) => table.string("author_id").notNullable());
await ensureColumn("prompts", "author_username", (table) => table.string("author_username").notNullable());
await ensureColumn("prompts", "author_avatar", (table) => table.string("author_avatar"));
await ensureColumn("prompts", "created_at", (table) => table.timestamp("created_at").defaultTo(database.fn.now()));
await ensureColumn("prompts", "updated_at", (table) => table.timestamp("updated_at").defaultTo(database.fn.now()));
await ensureColumn("prompts", "published_at", (table) => table.timestamp("published_at"));
await ensureColumn("prompts", "description", (table) => table.string("description").notNullable().defaultTo("No description provided."));
await ensureColumn("prompts", "published", (table) => table.boolean("published").notNullable().defaultTo(false));
await ensureColumn("prompts", "nsfw", (table) => table.boolean("nsfw").notNullable().defaultTo(false));
await finishTable("prompts");

await ensureTable("todos");
await ensureColumn("todos", "user", (table) => table.string("user").notNullable());
await ensureColumn("todos", "name", (table) => table.string("name").notNullable());
await ensureColumn("todos", "item", (table) => table.integer("item").notNullable());
await ensureColumn("todos", "text", (table) => table.string("text").notNullable());
await ensureColumn("todos", "completed", (table) => table.boolean("completed").notNullable().defaultTo(false));
await ensureColumn("todos", "created_at", (table) => table.timestamp("created_at").defaultTo(database.fn.now()));
await finishTable("todos");

await ensureTable("configs");
await ensureColumn("configs", "guild", (table) => table.string("guild").notNullable());
await ensureColumn("configs", "key", (table) => table.string("key").notNullable());
await ensureColumn("configs", "value", (table) => table.json("value").notNullable());
await ensureColumn("configs", "category", (table) => table.string("category").notNullable());
await finishTable("configs");

await ensureTable("queues");
await ensureColumn("queues", "guild", (table) => table.string("guild"));
await ensureColumn("queues", "user", (table) => table.string("user"));
await ensureColumn("queues", "queue_name", (table) => table.string("queue_name").notNullable());
await ensureColumn("queues", "index", (table) => table.integer("index").notNullable());
await ensureColumn("queues", "link", (table) => table.string("link").notNullable());
await ensureColumn("queues", "title", (table) => table.string("title").notNullable());
await ensureColumn("queues", "currentIndex", (table) => table.string("currentIndex"));
await ensureColumn("queues", "created_at", (table) => table.timestamp("created_at").defaultTo(database.fn.now()));
await finishTable("queues");

await ensureTable("sounds");
await ensureColumn("sounds", "guild", (table) => table.string("guild"));
await ensureColumn("sounds", "user", (table) => table.string("user"));
await ensureColumn("sounds", "name", (table) => table.string("name").notNullable());
await ensureColumn("sounds", "path", (table) => table.string("path").notNullable());
await ensureColumn("sounds", "created_at", (table) => table.timestamp("created_at").defaultTo(database.fn.now()));
await finishTable("sounds");

await ensureTable("updates");
await ensureColumn("updates", "update", (table) => table.integer("update").primary().notNullable());
await ensureColumn("updates", "text", (table) => table.string("text").notNullable());
await ensureColumn("updates", "time", (table) => table.timestamp("time").defaultTo(database.fn.now()));
await finishTable("updates");

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