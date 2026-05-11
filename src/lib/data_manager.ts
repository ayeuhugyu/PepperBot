import knex from "knex";
import process from "node:process";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import * as log from "./log";
import { execFile } from "node:child_process";
import { generateDependencyReport } from "@discordjs/voice";

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
    "cache/containers",
    "cache/luau",
    "cache/attachments",
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
    { key: "GROK_API_KEY", message: "missing GROK_API_KEY in .env; some features may not work, expect errors" },
    { key: "GOOGLE_API_KEY", message: "missing GOOGLE_API_KEY in .env; some features may not work, expect errors" },
    { key: "ADOBE_API_KEY", message: "missing ADOBE_API_KEY in .env; some features may not work, expect errors" },
    { key: "LASTFM_API_KEY", message: "missing LASTFM_API_KEY in .env; some features may not work, expect errors" },
    { key: "DICTIONARY_API_KEY", message: "missing DICTIONARY_API_KEY in .env; some features may not work, expect errors" },
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
    log: {
        warn(message) {
            log.warn("database: " + message);
        },
        error(message) {
            log.error("database: " + message);
        },
        deprecate(message) {
            log.warn("database: " + message);
        },
        debug(message) {
            log.debug("database: " + message);
        },
    },
    useNullAsDefault: true,
});
log.info("opened database connection");

/**
 *         await knex.schema.createTable('prompts', (table) => {
            table.string('name').notNullable();
            table.string('author_id').notNullable();
            table.string('author_username').notNullable();
            table.string('author_avatar')
            table.text('content').notNullable();

            table.bigInteger('created_at').notNullable();
            table.bigInteger('updated_at').notNullable();

            table.bigInteger('published_at').nullable();
            table.boolean('published').notNullable();
            table.string('description').notNullable();

            table.string('origin').nullable();

            table.string('model').notNullable();

            table.text('enabled_tools').notNullable();
            table.text('custom_tools').notNullable();

            table.text('model_parameters').notNullable();
            table.text('prompt_parameters').notNullable();

            table.primary(['author_id', 'name']);
        });
 */


export interface DBPrompt {
    name: string;
    author_id: string;
    author_username: string;
    author_avatar: string | null;
    content: string;

    created_at: number;
    updated_at: number;

    published_at: number | null;
    published: boolean;
    description: string | null;

    origin: string | null;

    model: string;

    enabled_tools: string;
    custom_tools: string;

    model_parameters: string;
    prompt_parameters: string;
}
declare module "knex/types/tables" {
    interface SoundEntry {
        guild: string | null;
        user: string | null;
        name: string;
        path: string;
        created_at: string;
    }

    interface ScheduledEventEntry {
        id: string;
        creator_id: string;
        channel_id: string | null;
        content: string;
        time: string;
        type: string;
    }

    interface MaintenanceEntry {
        id: number;
        enabled: boolean;
        end_timestamp: string | null;
        created_at: string | null;
        updated_at: string | null;
    }

    interface ConfigEntry {
        guild: string;
        key: string;
        value: string;
        category: string;
    }
    interface ThesaurusCacheEntry {
        id: number;
        word: string;
        data: string;
        created_at: number;
    }
    interface PromptDefaultEntry {
        user_id: string;
        author_id: string;
        prompt_name: string;
    }

    interface DBGPTConversationMeta {
        id: string;
        prompt_author_id: string;
        prompt_name: string;
        prompt_parameter_overrides: string; // json
        model_parameter_overrides: string; // json
        model: string;
    }
    interface DBGPTUser {
        conversation_id: string;
        id: string;
        username: string;
        avatar: string;
    }

    interface DBGPTAttachment {
        message_id: string;
        type: "image" | "video" | "audio" | "text" | "unknown" | "error";
        id: string;
        filename: string;
        url: string;
        url_as_file: boolean;
        size: number;
        expires_at: Date | string | number;
    }
    interface DBGPTMessage {
        id: string;
        conversation_id: string;
        type: "user" | "assistant" | "tool_call" | "tool_response" | "system";
        created_at: Date | string | number;

        content: string | null;

        author_id: string | null; // specific to user messages

        discord_message_id?: string;
        discord_reference_id?: string | null;
        discord_channel_id?: string;
        discord_guild_id?: string | null;

        tool_call_id?: string; // specific to tool calls & responses
        tool_name?: string; // specific to tool calls & responses
        arguments?: string; // json
        response?: string; // json
        tool_call_ids?: string; // specific to assistant messages, json

        been_deleted?: boolean; // specific to discordable messages
        sent?: boolean; // specific to assistant messages
        answered?: boolean; // specific to tool calls
    }

    interface Tables {
        prompts: DBPrompt;
        prompt_defaults: PromptDefaultEntry;
        sounds: SoundEntry;
        configs: ConfigEntry;
        scheduled: ScheduledEventEntry;
        thesaurus_cache: ThesaurusCacheEntry;
        maintenance_mode: MaintenanceEntry;

        gpt_conversation_meta: DBGPTConversationMeta;
        gpt_users: DBGPTUser;

        gpt_messages: DBGPTMessage;
        gpt_attachments: DBGPTAttachment;

        gpt_user_messages: DBGPTMessage;
        gpt_assistant_messages: DBGPTMessage;
        gpt_tool_call_messages: DBGPTMessage;
        gpt_tool_response_messages: DBGPTMessage;
        gpt_system_messages: DBGPTMessage;
    }
}

export default database;
async function getTables(): Promise<string[]> {
    try {
        const result = await database.raw("SELECT name FROM sqlite_master WHERE type='table'");

        let tableData;
        if (Array.isArray(result)) {
            tableData = result;
        } else if (result && Array.isArray(result[0])) {
            tableData = result[0];
        } else if (result && result.rows) {
            tableData = result.rows;
        } else {
            log.error("unexpected result format:", result);
            return [];
        }

        return tableData?.map((row: any) => row.name).filter(Boolean) ?? [];
    } catch (error) {
        log.error("error getting tables:", error);
        return [];
    }
}

export const tables = await getTables();

['SIGINT', 'SIGTERM', 'SIGQUIT', 'EXIT'].forEach(signal => {
    process.on(signal, () => {
        log.info(`received ${signal}, closing database connection`);
        database.destroy();
        process.exit(0);
    });
});

log.debug("@discordjs/voice DEPENDENCY REPORT:", generateDependencyReport())

log.info("all data verified in " + (performance.now() - start).toFixed(3) + "ms");