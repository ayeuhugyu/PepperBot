import stream from "stream";
import database from "./data_manager";
import { fixFileName } from "./attachment_manager";
import fs from "fs-extra";

export interface dbSound {
    guild: string | null;
    user: string | null;
    name: string;
    path: string;
    created_at: string;
}

export class CustomSound {
    guild: string | null = null;
    user: string | null = null;
    path: string = "";
    name: string = "";
    created_at: Date = new Date();
    constructor(data: Partial<dbSound>) {
        Object.assign(this, {
            ...data,
            created_at: new Date(data.created_at || new Date()),
        });
    }
}

export function downloadSound(url: string, filename: string) {
    return new Promise((resolve, reject) => {
        const fixedFileName = fixFileName(filename);
        fs.ensureFileSync(`resources/sounds/${fixedFileName}`);
        fetch(url).then((res) => {
            const ws = fs.createWriteStream(
                `resources/sounds/${fixedFileName}`
            );
            if (res.body) {
                stream.Readable.from(res.body as any).pipe(ws); // todo: change this to not be any
            } else {
                reject(new Error("Response body is null"));
            }
            ws.on("finish", () => resolve(`resources/sounds/${fixedFileName}`));
            ws.on("error", (err) => reject(err));
        });
    });
}

export function addSound(guildId: string | null, userId: string | null, url: string, name: string) {
    return new Promise((resolve, reject) => {
        downloadSound(url, name).then((path) => {
            if (!path) {
                reject(new Error("Path is null"));
                return;
            }
            if (!guildId && !userId) {
                reject(new Error("Both guildId and userId are null"));
                return;
            }
            if (!name) {
                reject(new Error("Name is null"));
                return;
            }
            database("sounds").where({ name }).first().then((existingSound) => {
                if (existingSound) {
                    reject(new Error("A sound with this name already exists"));
                    return;
                }
                database("sounds").insert({
                    guild: guildId,
                    user: userId,
                    name,
                    path,
                    created_at: new Date(),
                }).then(() => resolve(path)).catch(reject);
            })
        });
    });
}

export async function getSoundNoAutocorrect(name: string): Promise<CustomSound | null> {
    return await database("sounds")
        .where({ name })
        .first()
        .then((data) => {
            if (!data) {
                return null;
            }
            return new CustomSound(data);
        });
}

export async function getSound(name: string): Promise<CustomSound | null> {
    let sound = await getSoundNoAutocorrect(fixFileName(name));
    if (!sound) {
        sound = await database("sounds")
            .where("name", "like", `%${name}%`)
            .first()
            .then((data) => {
                if (!data) {
                    return null;
                }
                return new CustomSound(data);
            });
    }
    return sound;
}

export async function listSounds() {
    return (await database("sounds").select("*")).map((sound) => new CustomSound(sound));
}