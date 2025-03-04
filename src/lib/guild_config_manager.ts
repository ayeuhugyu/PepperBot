import type { CommandTag, InvokerType } from "./classes/command_enums";
import database from "./data_manager";
import * as log from "./log"

class GuildCommandsConfig {
    "disable_all_commands": boolean = false;
    "disable_command_piping": boolean = false;
    "blacklisted_commands": string[] = [];
    "blacklisted_channels": string[] = [];
    "blacklisted_categories": CommandTag[] = [];
    "disabled_input_types": InvokerType[] = [];
    constructor(config: any) {
        Object.assign(this, { ...config });
    }
}

class GuildAIConfig {
    "disable_responses": boolean = false;
    "blacklisted_channels": string[] = [];
    constructor(config: any) {
        Object.assign(this, { ...config });
    }
}

class GuildOtherConfig {
    "prefix": string = "p/";
    "auto_crosspost_channels": string[] = [];
    "use_ephemeral_replies": boolean = true;
    "untitled_clip_anger": boolean = false;
    constructor(config: any) {
        Object.assign(this, { ...config });
    }
}

export class GuildConfig {
    [key: string]: any;
    "command": GuildCommandsConfig = new GuildCommandsConfig({});
    "AI": GuildAIConfig = new GuildAIConfig({});
    "other": GuildOtherConfig = new GuildOtherConfig({});
    "guild": string = "";
    constructor(config: any) {
        Object.assign(this, { ...config });
    }
    write() {
        const promises = [];
        for (const category in this) {
            if (category === "guild") {
                continue;
            }
            for (const key in this[category]) {
                const value = this[category][key];
                let data = JSON.stringify(value);
                promises.push(
                    database("configs")
                        .where({ guild: this.guild, key, category })
                        .first()
                        .then(async (row) => {
                            if (row) {
                                await database("configs")
                                    .where({ guild: this.guild, key, category })
                                    .update({ value: data });
                            } else {
                                await database("configs").insert({
                                    guild: this.guild,
                                    key,
                                    value: data,
                                    category,
                                });
                            }
                        })
                );
            }
        }
        return Promise.all(promises);
    }
}

export async function newGuildConfig(guild: string) {
    const config = new GuildConfig({
        guild,
    });
    await config.write();
    return config;
}

export function fetchGuildConfig(guild: string = "") {
    return database("configs")
        .where({ guild })
        .select()
        .then(async (rows) => {
            if (!rows.length) {
                log.info(`no config found for guild ${guild}, returning default`);
                return newGuildConfig(guild);
            }
            const config = new GuildConfig({
                guild,
            });
            for (const row of rows) {
                const rowCategory: string = row.category
                const category: any = config[rowCategory];
                if (category && typeof category === "object") {
                    let data
                    try {
                        data = JSON.parse(row.value);
                    } catch {
                        data = row.value;
                    }
                    category[row.key] = data
                }
            }
            await config.write(); // update any missing keys
            return config;
        }).catch((error) => {
            log.error(`Failed to fetch config for guild ${guild}: ${error.message}`);
            throw error;
        });
}