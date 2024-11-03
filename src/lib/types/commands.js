import * as action from "../discord_action.js";
import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import fs from "fs";
import guildConfigs from "../guildConfigs.js";
import statistics from "../statistics.js";
import * as globals from "../globals.js";
import * as gpt from "../gpt.js";
import * as log from "../log.js";

const config = globals.config;

export class BaseCommandData {
    whitelist = [];
    permissions = [];
    permissionsReadable = [];
    canRunFromBot = true;
    aliases = [];
    invalidInputTypes = [];
    disabledContexts = [];
    setWhitelist(whitelist) {
        this.whitelist = whitelist;
        if (whitelist.length > 0) {
            this.doNotDeploy = true;
        }
        return this;
    }
    setPermissions(permissions) {
        this.permissions = permissions;
        return this;
    }
    setPermissionsReadable(permissionsReadable) {
        this.permissionsReadable = permissionsReadable;
        return this;
    }
    setCanRunFromBot(canRunFromBot) {
        this.canRunFromBot = canRunFromBot;
        return this;
    }
    setAliases(aliases) {
        this.aliases = aliases;
        if (!this.name) {
            this.setName(aliases[0]);
        }
        return this;
    }
    setInvalidInputTypes(inputTypes) {
        this.invalidInputTypes = inputTypes;
        return this;
    }
    setDisabledContexts(disabledContexts) {
        this.disabledContexts = disabledContexts;
        return this;
    }
    setdisableExternalGuildUsage(disableExternalGuildUsage) {
        this.disableExternalGuildUsage = disableExternalGuildUsage;
        return this;
    }
}

export class SubCommandData extends SlashCommandSubcommandBuilder {
    normalAliases = [];
    constructor() {
        super();
        for (const method of Object.getOwnPropertyNames(
            BaseCommandData.prototype
        )) {
            if (typeof BaseCommandData.prototype[method] === "function") {
                this[method] = BaseCommandData.prototype[method];
            }
        } // probably isn't the best way to do this, but i don't really care cuz it works.
    }
    setNormalAliases(aliases) {
        this.normalAliases = aliases;
        return this;
    }
}

export class CommandData extends SlashCommandBuilder {
    primarySubcommand = undefined;
    integration_types = [0, 1];
    disableExternalGuildUsage = false;
    doNotDeploy = false;
    constructor() {
        super();
        for (const method of Object.getOwnPropertyNames(
            BaseCommandData.prototype
        )) {
            if (typeof BaseCommandData.prototype[method] === "function") {
                this[method] = BaseCommandData.prototype[method];
            }
        }
        this.setContexts([0, 1, 2]);
    }
    setPrimarySubcommand(primarySubcommand) {
        this.primarySubcommand = primarySubcommand;
        return this;
    }
    setIntegrationTypes(integrationTypes) {
        this.integration_types = integrationTypes;
        return this;
    }
    setDoNotDeploy(doNotDeploy) {
        this.doNotDeploy = doNotDeploy;
        return this;
    }
}

export class Command {
    constructor(data, getArguments, exc, subcommands) {
        this.data = data;
        this.getArguments = getArguments;
        this.subcommands = subcommands;
        this.execute = async (message, args, fromInteraction) => {
            if (!this.data.canRunFromBot) {
                if (message.author.bot) {
                    return;
                }
            }
            this.inputType = `${fromInteraction ? "interaction" : "text"}`;
            if (this.data.invalidInputTypes) {
                if (this.data.invalidInputTypes.includes(this.inputType)) {
                    action.reply(message, {
                        content: `input type \`${this.inputType}\` is marked as invalid for this command`,
                        ephemeral: true,
                    });
                    return;
                }
            }
            this.inputContext = `${message.guild ? "guild" : "dm"}`;
            if (this.data.disabledContexts) {
                if (this.data.disabledContexts.includes(this.inputContext)) {
                    action.reply(message, {
                        content: `input context \`${this.inputContext}\` is marked as invalid for this command`,
                        ephemeral: true,
                    });
                    return;
                }
            }
            this.isExternalGuild = (message.appPermissions && !message.appPermissions.has("Administrator"))
            if (this.data.disableExternalGuildUsage) {
                if (this.isExternalGuild) {
                    action.reply(message, {
                        content: `this command is disabled for use in guilds the bot is not in`,
                        ephemeral: true,
                    });
                    return;
                }
            }
            let shouldNotRun = false;
            if (this.data.permissions && this.data.permissions.length > 0) {
                for (let permission of this.data.permissions) {
                    if (message.member && message.member.permissions && message.member.permissions.has && !message.member.permissions.has(permission)) {
                        if (!message.author.bot) {
                            message.content +=
                                "**This user tried to use a command they don't have the permissions to use. Make fun of this user!**";
                            let completion = await gpt
                                .respond(message)
                                .catch((err) => {
                                    log.error(err);
                                });
                            if (completion) {
                                log.info(`gpt response succssful for ${message.author.id}`);
                                action.reply(
                                    message,
                                    completion.choices[0].message.content
                                );
                            } else {
                                action.reply(
                                    message,
                                    "the fact bro REALLY thought he actually had the permission to run this command??? baffoon 😂😂😂"
                                );
                            }
                        } else {
                            action.reply(message, {
                                content:
                                    "the fact bro REALLY thought he actually had the permission to run this command??? baffoon 😂😂😂",
                                ephemeral: true,
                            });
                        }
                        return;
                    }
                }
            }
            if (this.data.whitelist && this.data.whitelist.length > 0) {
                if (!this.data.whitelist.includes(message.author.id)) {
                    if (!message.author.bot) {
                        message.content +=
                            "**This user tried to use a command they weren't whitelisted to use. Make fun of this user!**";
                        let completion = await gpt
                            .respond(message)
                            .catch((err) => {
                                log.error(err);
                            });
                        if (completion) {
                            log.info(`gpt response succssful for ${message.author.id}`);
                            action.reply(
                                message,
                                completion.choices[0].message.content
                            );
                        } else {
                            action.reply(
                                message,
                                "the fact bro REALLY thought he was whitelisted for this command??? baffoon 😂😂😂"
                            );
                        }
                    } else {
                        action.reply(message, {
                            content:
                                "the fact bro REALLY thought he was whitelisted for this command??? baffoon 😂😂😂",
                            ephemeral: true,
                        });
                    }
                    return;
                }
            }
            if (!shouldNotRun) {
                const guildConfig = await guildConfigs.getGuildConfig(
                    message.guildId
                );
                if (guildConfig) {
                    if (guildConfig.disabledCommands.includes(this.data.name)) {
                        action.reply(message, {
                            content:
                                "usage of this command has been disabled in this guild",
                            ephemeral: true,
                        });
                        return;
                    }
                    if (
                        guildConfig.disableAllCommands &&
                        this.data.name !== "configure"
                    ) {
                        action.reply(message, {
                            content: "command usage is disabled in this guild",
                            ephemeral: true,
                        });
                        return;
                    }
                    if (
                        this.inputType === "interaction" &&
                        guildConfig.disableSlashCommands &&
                        this.data.name !== "configure"
                    ) {
                        action.reply(message, {
                            content:
                                "slash commands are disabled in this guild",
                            ephemeral: true,
                        });
                        return;
                    }
                    if (
                        this.inputType === "text" &&
                        guildConfig.disableTextCommands &&
                        this.data.name !== "configure"
                    ) {
                        action.reply(message, {
                            content: "text commands are disabled in this guild",
                            ephemeral: true,
                        });
                        return;
                    }
                    if (message.channel) {
                        if (
                            guildConfig.blacklistedCommandChannelIds.includes(
                                message.channel.id
                            )
                        ) {
                            action.reply(message, {
                                content:
                                    "command usage is disabled in this channel",
                                ephemeral: true,
                            });
                            return;
                        }
                    }
                }
                if (!args) {
                    let errorReply = false;
                    args = await this.getArguments(message, guildConfig).catch(
                        (err) => {
                            log.error(err);
                            errorReply = true;
                        }
                    );
                    if (errorReply) {
                        action.reply(
                            message,
                            "an error occurred while getting arguments for this command, the error has been logged."
                        );
                        return;
                    }
                    log.info(`finished getting arguments for p/${this.data.name}`);
                }
                let errorReply = false;
                if (
                    this.subcommands &&
                    this.subcommands.length > 0 &&
                    !this.isSubCommand
                ) {
                    let subcommand;
                    if (this.data.primarySubcommand) {
                        if ((args && !args.get("_SUBCOMMAND")) || !args) {
                            subcommand = this.data.primarySubcommand;
                        }
                    }
                    if (args && args.get("_SUBCOMMAND")) {
                        subcommand = this.subcommands.find((subcommand) => {
                            if (
                                subcommand.data.name === args.get("_SUBCOMMAND")
                            ) {
                                return true;
                            }
                            if (
                                subcommand.data.aliases &&
                                subcommand.data.aliases.includes(
                                    args.get("_SUBCOMMAND")
                                )
                            ) {
                                return true;
                            }
                            return false;
                        });
                    }
                    if (subcommand) {
                        let subcommandArgs;
                        if (fromInteraction) {
                            subcommandArgs = args;
                        } else {
                            message.content = message.content
                                .replace(args.get("_SUBCOMMAND"), "")
                                .replace("  ", " ")
                                .trim(); // it is intentional that i am using .replace instead of .replaceAll. don't change it.
                            subcommandArgs = await subcommand.getArguments(
                                message,
                                guildConfig
                            );
                        }
                        const subcommandresult = await subcommand
                            .execute(message, subcommandArgs, fromInteraction)
                            .catch((err) => {
                                log.error(err);
                                errorReply = true;
                            });
                        if (errorReply) {
                            action.reply(
                                message,
                                "an error occurred while executing this subcommand, the error has been logged."
                            );
                            return;
                        }
                        return subcommandresult;
                    }
                }
                const commandresult = await exc(
                    message,
                    args,
                    fromInteraction,
                    guildConfig
                ).catch((err) => {
                    log.error(err);
                    errorReply = true;
                });
                if (errorReply) {
                    action.reply(
                        message,
                        "an error occurred while executing this command, the error has been logged."
                    );
                    return;
                }
                return commandresult;
            }
        };
    }
}

export class SubCommand extends Command {
    isSubCommand = true;
}
