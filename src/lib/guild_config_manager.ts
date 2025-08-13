import { ChannelType } from "discord.js";
import type { CommandTag, InvokerType } from "./classes/command_enums";
import database from "./data_manager";
import * as log from "./log"

export type ConfigPropertyType = "string" | "number" | "boolean" | "channel" | "command" | "role" | "invokerType" | "commandTag"

export interface ConfigPropertySchema {
    type: ConfigPropertyType;
    channelType?: ChannelType[] | "any";
    title: string;
    description: string;
    default?: any;
}

export interface ConfigSectionSchema {
    title: string;
    description: string;
    properties: Record<string, ConfigPropertySchema>;
}

const SendableChannel = [ChannelType.GuildAnnouncement, ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildStageVoice];

export const configSchema: Record<"command" | "AI" | "other", ConfigSectionSchema> = {
    "command": {
        title: "Commands",
        description: "config options for commands",
        properties: {
            "disable_all_commands": {
                type: "boolean",
                title: "Disable All Commands",
                description: "whether or not to disable all command usage",
                default: false,
            },
            "disable_command_piping": {
                type: "boolean",
                title: "Disable Command Piping",
                description: "whether or not to disable command piping",
                default: false,
            },
            "max_piped_commands": {
                type: "number",
                title: "Max Piped Commands",
                description: "the maximum number of commands that can be piped",
                default: 3,
            },
            "blacklisted_commands": {
                type: "command",
                title: "Enabled/Disabled Commands",
                description: "commands that are enabled or disabled",
                default: [],
            },
            "blacklisted_channels": {
                type: "channel",
                title: "Enabled/Disabled Channels",
                channelType: SendableChannel,
                description: "channels in which commands can and cannot be used",
                default: [],
            },
            "blacklisted_tags": {
                type: "commandTag",
                title: "Enabled/Disabled Tags",
                description: "command tags which are enabled or disabled",
                default: [],
            },
            "disabled_input_types": {
                type: "invokerType",
                title: "Disabled Input Types",
                description: "enabled/disabled input types",
                default: [],
            },
        }
    },
    "AI": {
        title: "AI",
        description: "config options for AI",
        properties: {
            "disable_responses": {
                type: "boolean",
                title: "Disable Responses",
                description: "whether or not to disable AI responses",
                default: false,
            },
            "blacklisted_channels": {
                type: "channel",
                title: "Enabled/Disabled Channels",
                channelType: SendableChannel,
                description: "channels in which AI can and cannot respond",
                default: [],
            },
        }
    },
    "other": {
        title: "Other",
        description: "config options for other",
        properties: {
            "prefix": {
                type: "string",
                title: "Prefix",
                description: "the command prefix",
                default: "p/",
            },
            "auto_crosspost_channels": {
                type: "channel",
                title: "Auto Crosspost Channels",
                channelType: [ChannelType.GuildAnnouncement],
                description: "announcement channels to automatically publish messages within",
                default: [],
            },
            "use_ephemeral_replies": {
                type: "boolean",
                title: "Use Ephemeral Replies",
                description: "whether or not to use ephemeral replies whenever possible",
                default: true,
            },
            "untitled_clip_anger": {
                type: "boolean",
                title: "Untitled Clip Anger",
                description: "whether or not to enable untitled clip anger",
                default: false,
            },
        }
    }
}

class GuildCommandsConfig {
    "disable_all_commands": boolean = false;
    "disable_command_piping": boolean = false;
    "max_piped_commands": number = 3;
    "blacklisted_commands": string[] = [];
    "blacklisted_channels": string[] = [];
    "blacklisted_tags": CommandTag[] = [];
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

export async function newGuildConfig(guild?: string) {
    if (!guild) {
        log.info("no guild provided, using exterior config");
        return exteriorConfig;
    }
    const config = new GuildConfig({
        guild,
    });
    await config.write();
    return config;
}

export function fetchGuildConfig(guild?: string) {
    if (!guild) {
        return exteriorConfig;
    }
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
            log.error(`failed to fetch config for guild ${guild}: ${error.message}`);
            throw error;
        });
}

export const exteriorConfig = new GuildConfig({});
exteriorConfig.other.use_ephemeral_replies = false;