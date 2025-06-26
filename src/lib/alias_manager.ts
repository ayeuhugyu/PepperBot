import database from "./data_manager";

export class Alias {
    id: number;
    userId: string;
    alias: string;
    value: string;

    constructor(data: Alias) {
        this.id = data.id;
        this.userId = data.userId;
        this.alias = data.alias;
        this.value = data.value;
    }

    async write(): Promise<void> {
        if (this.id) {
            await database('aliases')
                .where({ id: this.id })
                .update({
                    userId: this.userId,
                    alias: this.alias,
                    value: this.value,
                });
        } else {
            const [id] = await database('aliases')
                .insert({
                    userId: this.userId,
                    alias: this.alias,
                    value: this.value,
                });
            this.id = id;
        }
    }

    async delete(): Promise<void> {
        if (this.id) {
            await database('aliases')
                .where({ id: this.id })
                .delete();
        }
    }
}

export async function getAlias(userId: string, alias: string): Promise<Alias | null> {
    const row = await database('aliases')
        .where({ userId, alias })
        .first();

    return row ? new Alias(row) : null;
}

export async function listAliases(userId: string): Promise<Alias[]> {
    const rows = await database('aliases')
        .where({ userId });

    return rows.map(row => new Alias(row));
}