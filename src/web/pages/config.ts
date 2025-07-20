import { Router, Request, Response, NextFunction } from "express";
import { Client, ChannelType } from "discord.js";
import { getUser, fetchGuilds } from "../oauth2";
import { configSchema, fetchGuildConfig } from "../../lib/guild_config_manager";
import { CommandTag, InvokerType, CommandEntryType } from "../../lib/classes/command_enums";
import commands from "../../lib/command_manager";
import * as log from "../../lib/log";

// Configuration validation function
function validateConfigData(configData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if configData has the expected structure
    if (!configData || typeof configData !== 'object') {
        errors.push('Invalid configuration data structure');
        return { valid: false, errors };
    }

    // Validate prefix (must not be empty)
    if (configData.other && configData.other.prefix !== undefined) {
        const prefix = configData.other.prefix;
        if (typeof prefix !== 'string' || prefix.trim().length === 0) {
            errors.push('Prefix cannot be empty');
        }
    }

    // Validate max piped commands (must be > 0 and < 10)
    if (configData.command && configData.command.max_piped_commands !== undefined) {
        const maxPiped = configData.command.max_piped_commands;
        if (typeof maxPiped !== 'number' || maxPiped <= 0) {
            errors.push('Max piped commands must be greater than 0');
        }
        if (typeof maxPiped === 'number' && maxPiped >= 10) {
            errors.push('Max piped commands must be less than 10');
        }
    }

    // Validate boolean fields
    const booleanFields = [
        { category: 'command', field: 'disable_all_commands' },
        { category: 'command', field: 'disable_command_piping' },
        { category: 'AI', field: 'disable_responses' },
        { category: 'other', field: 'use_ephemeral_replies' },
        { category: 'other', field: 'untitled_clip_anger' }
    ];

    booleanFields.forEach(({ category, field }) => {
        if (configData[category] && configData[category][field] !== undefined) {
            if (typeof configData[category][field] !== 'boolean') {
                errors.push(`${category}.${field} must be a boolean value`);
            }
        }
    });

    // Validate array fields
    const arrayFields = [
        { category: 'command', field: 'blacklisted_commands' },
        { category: 'command', field: 'blacklisted_channels' },
        { category: 'command', field: 'blacklisted_tags' },
        { category: 'command', field: 'disabled_input_types' },
        { category: 'AI', field: 'blacklisted_channels' },
        { category: 'other', field: 'auto_crosspost_channels' }
    ];

    arrayFields.forEach(({ category, field }) => {
        if (configData[category] && configData[category][field] !== undefined) {
            if (!Array.isArray(configData[category][field])) {
                errors.push(`${category}.${field} must be an array`);
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}

export function createConfigRoutes(client: Client): Router {
    const router = Router();

    // Guild list page
    router.get("/config", async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.cookies.LIBERAL_LIES) {
                res.redirect('/auth');
                return;
            }

            const user = await getUser(req.cookies.LIBERAL_LIES);
            if (!user || typeof user !== "object" || !("id" in user)) {
                res.redirect('/auth');
                return;
            }

            const guilds = await fetchGuilds(req.cookies.LIBERAL_LIES);
            const manageableGuilds = Array.isArray(guilds) ? guilds.filter((guild: any) => {
                const permissions = BigInt(guild.permissions || '0');
                const hasManageGuild = (permissions & BigInt(0x20)) === BigInt(0x20);
                return guild.owner || hasManageGuild;
            }) : [];

            res.render("config", {
                title: "configuration",
                description: "Select Guild - PepperBot Configuration",
                path: req.path,
                stylesheet: "config.css",
                user: user,
                guilds: manageableGuilds,
                error: !Array.isArray(guilds) ? "Failed to load guilds" : undefined
            });
        } catch (err) {
            next(err);
        }
    });

    // Guild config page
    router.get("/config/:guild", async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.cookies.LIBERAL_LIES) {
                res.redirect('/auth');
                return;
            }

            const user = await getUser(req.cookies.LIBERAL_LIES);
            if (!user || typeof user !== "object" || !("id" in user)) {
                res.redirect('/auth');
                return;
            }

            const guilds = await fetchGuilds(req.cookies.LIBERAL_LIES);
            if (!Array.isArray(guilds)) {
                return res.status(403).render("error", {
                    title: "error",
                    description: "Unable to verify permissions",
                    path: req.path,
                    stylesheet: "error.css",
                    status: 403,
                    message: "unable to verify permissions"
                });
            }

            const targetGuild = guilds.find((guild: any) => guild.id === req.params.guild);
            if (!targetGuild) {
                return res.status(404).render("error", {
                    title: "error",
                    description: "Guild not found",
                    path: req.path,
                    stylesheet: "error.css",
                    status: 404,
                    message: "guild not found or you don't have access"
                });
            }

            const permissions = BigInt(targetGuild.permissions || '0');
            const hasManageGuild = (permissions & BigInt(0x20)) === BigInt(0x20);
            if (!targetGuild.owner && !hasManageGuild) {
                return res.status(403).render("error", {
                    title: "error",
                    description: "Insufficient permissions",
                    path: req.path,
                    stylesheet: "error.css",
                    status: 403,
                    message: "insufficient permissions"
                });
            }

            const guildConfig = await fetchGuildConfig(req.params.guild);
            let guild = client.guilds.cache.get(req.params.guild);
            if (!guild) {
                guild = await client.guilds.fetch(req.params.guild).catch(() => undefined);
            }
            if (!guild) {
                return res.status(404).render("error", {
                    title: "error",
                    description: "Guild not found",
                    path: req.path,
                    stylesheet: "error.css",
                    status: 404,
                    message: "guild not found"
                });
            }

            // Fetch all channels and roles
            const channels = (await guild.channels.fetch()).filter(channel => {
                // Only include channels the user can view (VIEW_CHANNEL permission)
                try {
                    return channel && channel.permissionsFor(user.id)?.has('ViewChannel');
                } catch {
                    return false;
                }
            });

            const member = await guild.members.fetch(user.id).catch(() => undefined);
            const roles = (await guild.roles.fetch()).filter(role => {
                // Only include roles below the user's highest role and not @everyone
                if (!member) return false;
                if (role.id === guild.id) return false; // skip @everyone
                return member.roles.highest.comparePositionTo(role) > 0;
            });

            const schema = Object.entries(configSchema).map(([sectionKey, section]) => {
                return {
                    title: section.title,
                    key: sectionKey,
                    description: section.description,
                    properties: Object.entries(section.properties).map(([key, property]) => {
                        const data = {
                            title: property.title,
                            key: key,
                            description: property.description,
                            default: property.default,
                            current: guildConfig[sectionKey][key],
                            type: property.type,
                            channelType: property.channelType ? property.channelType : undefined
                        }
                        if (data.type === "commandTag") {
                            (data as any).tags = Object.values(CommandTag)
                        }
                        if (data.type === "invokerType") {
                            (data as any).invokerTypes = Object.values(InvokerType)
                        }
                        if (data.type === "command") {
                            (data as any).commands = Object.values(commands.mappings.filter(c => c.type === CommandEntryType.Command).map(c => c.command.name))
                        }
                        if (data.type === "channel") {
                            let channelType: string | ChannelType[] = data.channelType ?? "any";
                            const availableChannels = (channelType === "any") ? channels : channels.filter(c => ((channelType as ChannelType[]).includes(c!.type)));
                            const channelNames = Array.from(availableChannels.values()).map(c => c?.name);
                            if (channelNames.length == 0) {
                                (data as any).displayNoChannels = true;
                            }
                            (data as any).channels = channelNames;
                        }
                        if (data.type === "role") {
                            const roleNames = Array.from(roles.map(role => role.name));
                            (data as any).roles = roleNames;
                        }

                        return data;
                    })
                }
            });

            res.render("config-detail", {
                title: "configuration",
                description: `${targetGuild.name} - PepperBot Configuration`,
                path: req.path,
                stylesheet: "config-detail.css",
                user: user,
                guild: {
                    id: targetGuild.id,
                    name: targetGuild.name,
                    icon: targetGuild.icon
                },
                config: schema,
                rawSchema: JSON.stringify(schema, null, 2),
                saved: req.query.saved === 'true',
                error: req.query.error
            });
        } catch (err) {
            next(err);
        }
    });

    // API endpoint to save guild configuration
    router.post("/api/config/:guild", async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.cookies.LIBERAL_LIES) {
                res.status(401).json({ error: "unauthorized" });
                return;
            }

            const guilds = await fetchGuilds(req.cookies.LIBERAL_LIES);
            if (!Array.isArray(guilds)) {
                res.status(403).json({ error: "unable to verify permissions" });
                return;
            }

            const targetGuild = guilds.find((guild: any) => guild.id === req.params.guild);
            if (!targetGuild) {
                res.status(404).json({ error: "guild not found" });
                return;
            }

            const permissions = BigInt(targetGuild.permissions || '0');
            const hasManageGuild = (permissions & BigInt(0x20)) === BigInt(0x20);
            if (!targetGuild.owner && !hasManageGuild) {
                res.status(403).json({ error: "Insufficient permissions" });
                return;
            }

            const guildConfig = await fetchGuildConfig(req.params.guild);
            const configData = req.body;

            // Validate configuration data
            const validation = validateConfigData(configData);
            if (!validation.valid) {
                res.status(400).json({
                    error: "validation failed",
                    details: validation.errors
                });
                return;
            }

            // Update guild configuration with new data
            for (const category in configData) {
                if (category === "guild") continue; // Skip guild field

                if (guildConfig[category] && typeof guildConfig[category] === "object") {
                    for (const key in configData[category]) {
                        guildConfig[category][key] = configData[category][key];
                    }
                }
            }

            // Save the updated configuration
            await guildConfig.write();

            log.info(`Configuration updated for guild ${req.params.guild}`);
            res.json({ success: true, message: "Configuration saved successfully" });
        } catch (error) {
            log.error("Error saving guild config:", error);
            res.status(500).json({ error: "internal server error" });
        }
    });

    return router;
}
