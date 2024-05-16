import * as action from "../discord_action.js";
import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import fs from "fs";
import guildConfigs from "../guildConfigs.js";
import statistics from "../statistics.js";
import * as globals from "../globals.js";

const config = globals.config;

export class SubCommandData extends SlashCommandSubcommandBuilder {
    setWhitelist(whitelist) {
        this.whitelist = whitelist;
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
    toSubCommandBuilder() {
        let subcommandBuilder = this;
        if (subcommandBuilder.whitelist) {
            delete subcommandBuilder.whitelist;
        }
        if (subcommandBuilder.permissions) {
            delete subcommandBuilder.permissions;
        }
        if (subcommandBuilder.permissionsReadable) {
            delete subcommandBuilder.permissionsReadable;
        }
        if (subcommandBuilder.canRunFromBot) {
            delete subcommandBuilder.canRunFromBot;
        }
        return subcommandBuilder.toJSON();
    }
}

export class CommandData extends SlashCommandBuilder {
    setWhitelist(whitelist) {
        this.whitelist = whitelist;
        return this;
    }
    setPermissions(permissions) {
        this.permissions = permissions;
        this.setDefaultMemberPermissions(permissions[0]);
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
}

export class Command {
    onFinishConstructing = () => {};
    constructor(data, getArguments, execute, subcommands) {
        this.data = data;
        this.getArguments = getArguments;
        this.subcommands = subcommands;
        this.isSubCommand = false;
        this.execute = async (message, args, fromInteraction) => {
            if (!this.data.canRunFromBot) {
                if (message.author.bot) {
                    return;
                }
            }
            let shouldNotRun = false;
            if (this.data.permissions && this.data.permissions.length > 0) {
                for (let permission of this.data.permissions) {
                    if (!message.member.permissions.has(permission)) {
                        action.reply(message, {
                            content:
                                "the fact bro REALLY thought he actually had the permission to run this command??? baffoon 😂😂😂",
                            ephemeral: true,
                        });
                        return;
                    }
                }
            }
            if (this.data.whitelist && this.data.whitelist.length > 0) {
                if (!this.data.whitelist.includes(message.author.id)) {
                    action.reply(message, {
                        content:
                            "the fact bro REALLY thought he was WHITELISTED for this command??? baffoon 😂😂😂",
                        ephemeral: true,
                    });
                    return;
                }
            }
            if (!shouldNotRun) {
                if (!this.isSubCommand)
                    statistics.addCommandStat(this.data.name, 1);
                const guildConfig = await guildConfigs.getGuildConfig(
                    message.guild.id
                );
                if (!args) {
                    args = await this.getArguments(message, guildConfig);
                }
                if (
                    this.subcommands &&
                    this.subcommands.length > 0 &&
                    !this.isSubCommand
                ) {
                    if (args.get("_SUBCOMMAND")) {
                        const subcommand = this.subcommands.find(
                            (subcommand) =>
                                subcommand.data.name === args.get("_SUBCOMMAND")
                        );
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
                            return await subcommand.execute(
                                message,
                                subcommandArgs,
                                fromInteraction
                            );
                        }
                    }
                }
                return await execute(
                    message,
                    args,
                    fromInteraction,
                    guildConfig
                );
            }
        };
        this.onFinishConstructing();
    }
}

export class SubCommand extends Command {
    onFinishConstructing = () => {
        this.isSubCommand = true;
    };
}
