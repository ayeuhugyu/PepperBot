import database from "./data_manager";

export interface dbUpdate {
    update: number;
    text: string;
    message_id: string;
}

export class Update {
    id: number = 0;
    text: string = "Update undefined.";
    message_id: string = "0";
    constructor(dbObject: Partial<dbUpdate>) {
        Object.assign(this, {
            id: dbObject.update || 0,
            text: dbObject.text || "Update undefined.",
            message_id: dbObject.message_id || "0",
        });
    }
}

export async function getUpdate(id: number): Promise<Update | undefined> {
    return await database("updates").where({ id: id }).first().then((row) => {
        if (!row) return undefined;
        return new Update(row);
    })
}

export async function deleteUpdate(id: number): Promise<void> {
    await database("updates").where({ id: id }).delete();
    await database("updates").where("id", ">", id).decrement("id", 1);
}

export async function createUpdate(text: string, message_id: string): Promise<Update> {
    const result = await database("updates").count("id as cnt").first();
    const id = (result ? parseInt(result.cnt.toString()) : 0) + 1;
    await database("updates").insert({ id: id, text: text, message_id: message_id });
    return new Update({ update: id, text: text, message_id: message_id });
}

