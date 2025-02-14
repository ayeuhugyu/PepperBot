import database from "./data_manager";

export interface PromptAuthor {
    id: string;
    username: string;
    avatar: string | undefined;
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

    constructor(dbObject: any) {
        Object.assign(this, {
            name: dbObject.name,
            content: dbObject.content,
            created_at: dbObject.created_at,
            updated_at: dbObject.updated_at,
            published_at: dbObject.published_at || undefined,
            author: {
                id: dbObject.author_id,
                username: dbObject.author_username,
                avatar: dbObject.author_avatar || undefined,
            },
            published: Boolean(dbObject.published), // sqlite stores 0/1 for booleans so you gotta do this
            description: dbObject.description,
            nsfw: Boolean(dbObject.nsfw),
        });
    }
}

export async function getPrompt(name: string, user: string): Promise<Prompt | undefined> {
    return await database("prompts").where({ name, author_id: user }).first().then((row) => {
        if (!row) return undefined;
        return new Prompt(row);
    })
}

export async function getUserPrompts(user: string) {
    return await database("prompts").where({ author_id: user }).then((rows) => {
        return rows.map((row) => new Prompt(row));
    });
}

export async function getPublishedPrompts() {
    return await database("prompts").where({ published: 1 }).then((rows) => {
        return rows.map((row) => new Prompt(row));
    });
}