import database from "./data_manager";
import officialPrompts from "../../constants/official_prompts.json" assert { type: "json" };

export interface PromptAuthor {
    id: string;
    username: string;
    avatar: string | undefined;
}

export interface dbPrompt {
    name: string;
    content: string;
    author_id: string;
    author_username: string;
    author_avatar: string | undefined;

    created_at: Date;
    updated_at: Date;
    published_at: Date | undefined;

    published: boolean;
    description: string;
    nsfw: boolean;
    default: boolean;
}

export class Prompt {
    name: string = "Undefined";
    content: string = "Prompt undefined.";

    created_at: Date = new Date();
    updated_at: Date = new Date();
    published_at: Date | undefined = undefined;

    author: PromptAuthor = { id: "0", username: "Unknown", avatar: undefined }; // just makes it so i dont need to store the Entire User (a massive object) to only end up using a few values
    published: boolean = false;
    description: string = "No description provided.";
    nsfw: boolean = false;
    default: boolean = false;

    constructor(dbObject: Partial<dbPrompt>) {
        Object.assign(this, {
            name: dbObject.name || "Undefined",
            content: dbObject.content || "Prompt undefined.",
            created_at: new Date(dbObject.created_at || Date.now()),
            updated_at: new Date(dbObject.updated_at || Date.now()),
            published_at: dbObject.published_at ? new Date(dbObject.published_at) : undefined,
            author: {
                id: dbObject.author_id || "0",
                username: dbObject.author_username || "Unknown",
                avatar: dbObject.author_avatar || undefined,
            },
            published: Boolean(dbObject.published), // sqlite stores 0/1 for booleans so you gotta do this
            description: dbObject.description || "No description provided.",
            nsfw: Boolean(dbObject.nsfw),
            default: Boolean(dbObject.default),
        });
    }
}

export async function getPrompt(name: string | undefined, user: string): Promise<Prompt | undefined> {
    if (!name) {
        return await database("prompts").where({ author_id: user, default: 1 }).first().then((row) => {
            if (!row) return undefined;
            return new Prompt(row);
        });
    }
    return await database("prompts").where({ name, author_id: user }).first().then((row) => {
        if (!row) return undefined;
        return new Prompt(row);
    })
}

export async function getPromptByUsername(promptName: string, username: string) {
    return await database("prompts").where({ name: promptName, author_username: username }).first().then((row) => {
        if (!row) return undefined;
        return new Prompt(row);
    })
}

export async function getUserPrompts(user: string) {
    return await database("prompts").where({ author_id: user }).then((rows) => {
        return rows.map((row) => new Prompt(row));
    });
}

export async function getPromptsByUsername(username: string) {
    return await database("prompts").where({ author_username: username }).then((rows) => {
        return rows.map((row) => new Prompt(row));
    });
}

export async function getPublishedPrompts() {
    return await database("prompts").where({ published: 1 }).then((rows) => {
        return rows.map((row) => new Prompt(row));
    });
}

export async function writePrompt(prompt: Prompt) {
    const date = new Date();
    prompt.updated_at = date;
    if (!prompt.created_at) prompt.created_at = date;

    const existingPrompt = await database("prompts")
        .where({ name: prompt.name, author_id: prompt.author.id })
        .first();

    let result;
    if (prompt.default) {
        await database("prompts").where({ author_id: prompt.author.id, default: 1 }).update({ default: 0 });
    }
    if (existingPrompt) {
        result = await database("prompts")
            .where({ name: prompt.name, author_id: prompt.author.id })
            .update({
                content: prompt.content,
                author_username: prompt.author.username,
                author_avatar: prompt.author.avatar,
                updated_at: prompt.updated_at,
                published_at: prompt.published_at ? prompt.published_at : null,
                published: Number(prompt.published),
                description: prompt.description,
                nsfw: Number(prompt.nsfw),
                default: Number(prompt.default),
            });
    } else {
        result = await database("prompts")
            .insert({
                name: prompt.name,
                content: prompt.content,
                author_id: prompt.author.id,
                author_username: prompt.author.username,
                author_avatar: prompt.author.avatar,
                created_at: prompt.created_at,
                updated_at: prompt.updated_at,
                published_at: prompt.published_at,
                published: Number(prompt.published),
                description: prompt.description,
                nsfw: Number(prompt.nsfw),
                default: Number(prompt.default),
            });
    }

    return result;
}

export async function removeDefaultPrompt(user: string) {
    return await database("prompts").where({ author_id: user, default: 1 }).update({ default: 0 });
}

export async function removePrompt(name: string, user: string) {
    return await database("prompts").where({ author_id: user, name }).del();
}

(officialPrompts as dbPrompt[]).forEach((officialPrompt: dbPrompt) => {
    const prompt = new Prompt(officialPrompt);
    if (!getPrompt(prompt.name, prompt.author.id)) writePrompt(prompt);
});