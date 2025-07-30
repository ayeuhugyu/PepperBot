import database from "./data_manager";

export interface dbUpdate {
    update: number;
    text: string;
    message_id: string;
    time: Date;
    major: boolean;
    usesOldSystem?: boolean;
}

export class Update {
    id: number = 0;
    text: string = "Update undefined.";
    timestamp: Date = new Date();
    message_id: string = "0";
    major: boolean = false;
    usesOldSystem: boolean = false; // migration will make everything before this true
    constructor(dbObject: Partial<dbUpdate>) {
        Object.assign(this, {
            id: dbObject.update || 0,
            timestamp: new Date(dbObject.time || 0),
            text: dbObject.text || "Update undefined.",
            message_id: dbObject.message_id || "0",
            major: Boolean(dbObject.major),
            usesOldSystem: Boolean(dbObject.usesOldSystem)
        });
    }
}

export async function getUpdate(id: number): Promise<Update | undefined> {
    return await database("updates").where({ update: id }).first().then((row) => {
        if (!row) return undefined;
        return new Update(row);
    })
}

export async function deleteUpdate(id: number): Promise<void> {
    await database("updates").where({ update: id }).delete();
    await database("updates").where("id", ">", id).decrement("id", 1);
}

export async function createUpdate(text: string, message_id: string): Promise<Update> {
    const result = await database("updates").count("update as cnt").first();
    const id = (result ? parseInt(result.cnt.toString()) : 0) + 1;
    await database("updates").insert({ update: id, text: text, message_id: message_id, time: new Date() });
    return new Update({ update: id, text: text, message_id: message_id, time: new Date() });
}

export async function writeUpdate(update: Update): Promise<void> {
    const exists = await database("updates").where({ update: update.id }).first();
    if (exists) {
        await database("updates")
            .where({ update: update.id })
            .update({
                text: update.text,
                message_id: update.message_id,
                time: update.timestamp,
                major: Number(update.major),
                usesOldSystem: Number(update.usesOldSystem)
            });
    } else {
        await database("updates").insert({
            update: update.id,
            text: update.text,
            message_id: update.message_id,
            time: update.timestamp,
            major: Number(update.major),
            usesOldSystem: Number(update.usesOldSystem)
        });
    }
}

export async function getCurrentUpdateNumber() {
    const result = await database("updates").count("update as cnt").first();
    return result ? parseInt(result.cnt.toString()) : 0;
}