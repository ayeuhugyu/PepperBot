import * as log from "../log";
import { ApplicationCommandType, ApplicationCommandOptionType, PermissionsBitField, ApplicationIntegrationType, InteractionContextType, ChannelType, Message, CommandInteraction, Collection, GuildMemberRoleManager, Role, PermissionFlagsBits } from "discord.js";

type GuildConfig = any; // not yet defined
type PipedData = any; // not yet defined
export type CommandFunction = ({ message, guildConfig, args, command, input_type, bot_is_admin }: Partial<CommandInput>) => any;
export type ExecuteFunction = ({ message, guildConfig, args, command, input_type, bot_is_admin }: CommandInput) => any;

export interface FormattedCommandInteraction extends CommandInteraction {
    author: Message["author"];
}

export enum InputType {
    Interaction,
    Message,
}

export interface CommandInput {
    message: Message | FormattedCommandInteraction;
    guildConfig: GuildConfig;
    args: Collection<any, any> | undefined,
    command: string;
    input_type: InputType;
    bot_is_admin: boolean;
    piped_data: PipedData | undefined;
}

export interface ValidationCheck {
    condition: boolean;
    message: string;
    unrecoverable: boolean;
}

export type AccessList = {
    users: string[];
    roles: string[];
    channels: string[];
    guilds: string[];
};

export class CommandAccess {
    whitelist: AccessList;
    blacklist: AccessList;

    constructor(
        whitelist: AccessList = { users: [], roles: [], channels: [], guilds: [] },
        blacklist: AccessList = { users: [], roles: [], channels: [], guilds: [] }
    ) {
        this.whitelist = whitelist;
        this.blacklist = blacklist;
    }
}

export interface CommandOptionChoice {
    name: string;
    value: string;
}

export class CommandOption {
    name: string = "option"; // 32 char limit; must be unique
    description: string = "no description"; // 100 char limit
    type: ApplicationCommandOptionType = ApplicationCommandOptionType.String;
    required: boolean = false;
    choices: CommandOptionChoice[] | undefined = []; // limit 25
    channel_types: ChannelType[] | undefined = undefined;
    /* ↑↑↑ discords shit ↓↓↓ my shit */
    long_description: string = "no description"
    deployed: boolean = true;
    validation_errors: ValidationCheck[] = []; // errors that occur during command validation, DO NOT ADD THINGS TO THIS! 
}

function defaultCommandFunction({ command = "" }) {
    log.error("undefined command function for " + command)
}

export class Command {
    name: string = "cmd";
    description: string = "no description";
    type: ApplicationCommandType = ApplicationCommandType.ChatInput;
    options: CommandOption[] = [];
    default_member_permissions: PermissionsBitField | undefined = undefined;
    integration_types: ApplicationIntegrationType[] = [ ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall ];
    contexts: InteractionContextType[] = [ InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel ];
    /* ↑↑↑ discords shit ↓↓↓ my shit */
    aliases: string[] = [];
    long_description: string = "no description";
    access: CommandAccess = new CommandAccess();
    input_types: InputType[] = [ InputType.Interaction, InputType.Message ]; // which input types to enable usage for (ex. text / slash commands)
    deployed: boolean = true; // if it gets deployed as a slash command
    allow_external_guild: boolean = false; // should it be usable in guilds without administrator permission? (thats the only way to detect it)
    subcommands: Command[] = [];
    pipable_to: string[] = []; // array of command names which output may be piped to
    validation_errors: ValidationCheck[] = []; // errors that occur during command validation, DO NOT ADD THINGS TO THIS! 
    _execute_raw: ExecuteFunction = defaultCommandFunction;
    get_arguments: CommandFunction = defaultCommandFunction;
    execute: CommandFunction = defaultCommandFunction;
    constructor(data: Partial<Command>, getArguments: CommandFunction, execute: ExecuteFunction) {
        const validationChecks = [
            { condition: this.name.length > 32, message: "command name may not exceed 32 characters", unrecoverable: true },
            { condition: this.description.length > 100, message: "command description may not exceed 100 characters", unrecoverable: true },
            { condition: this.description.length === 0 && this.type !== ApplicationCommandType.User && this.type !== ApplicationCommandType.Message, message: "command description may not be empty if type is not User or Message", unrecoverable: true },
            { condition: (this.type === ApplicationCommandType.User || this.type === ApplicationCommandType.Message) && this.description.length > 0, message: "command description must be empty for User and Message types", unrecoverable: true },
            { condition: this.options.length > 25, message: "command options may not exceed 25", unrecoverable: true }
        ];
        validationChecks.forEach(
            check => {
            if (check.condition) {
                this.validation_errors.push(check);
            }
        });

        if (this.validation_errors.length > 0) {
            return;
        }

        Object.assign(this, { ...data });
        
        this._execute_raw = execute;
        this.get_arguments = getArguments;
        // #region COMMAND EXECUTION
        this.execute = async (input) => {
            const { message, input_type } = input;
            if (!message) {
                log.error("message is undefined in command execution");
                return;
            }
            if (input_type === undefined) {
                if (message instanceof Message) {
                    input.input_type = InputType.Message;
                } else {
                    input.input_type = InputType.Interaction;
                }
            } else {
                input.input_type = input_type as InputType;
            }
            // access check
            let isWhitelisted = true;
            let isBlacklisted = false;
            for (const [key, value] of Object.entries(this.access.whitelist)) {
                if (value.length > 0) isWhitelisted = false;
            }
            for (const [key, value] of Object.entries(this.access.blacklist)) {
                if (value.length > 0) isBlacklisted = true;
            }
            let accessReply = "access check failed: ";
            if (!isWhitelisted) {
                if (this.access.whitelist.users.includes(message.author.id)) {
                    isWhitelisted = true;
                } if (this.access.whitelist.users.length > 0) {
                    accessReply += "user not in whitelist; "
                }
                if (this.access.whitelist.roles.length > 0) {
                    if (message.member && message.member.roles instanceof GuildMemberRoleManager) {
                        for (const role of message.member.roles.cache) {
                            if (role instanceof Role) {
                                if (this.access.whitelist.roles.includes(role.id)) {
                                    isWhitelisted = true; // if message has a member, and the member is a role manager, and the role is a role, and the role id is in the whitelist
                                }
                            }
                        }
                    }
                    if (!isWhitelisted) {
                        accessReply += "missing whitelisted roles; "
                    }
                }
                if (this.access.whitelist.channels.includes(message.channel?.id || "")) {
                    isWhitelisted = true;
                } else if (this.access.whitelist.channels.length > 0) {
                    accessReply += "channel not in whitelist; "
                }
                if (this.access.whitelist.guilds.includes(message.guild?.id || "")) {
                    isWhitelisted = true;
                } else if (this.access.whitelist.guilds.length > 0) {
                    accessReply += "guild not in whitelist; "
                }
            }
            if (isBlacklisted) {
                if (!this.access.blacklist.users.includes(message.author.id)) {
                    isBlacklisted = false;
                } else if (this.access.blacklist.users.length > 0) {
                    accessReply += "user in blacklist; "
                }
                if (this.access.blacklist.roles.length > 0) {
                    if (message.member && message.member.roles instanceof GuildMemberRoleManager) {
                        for (const role of message.member.roles.cache) {
                            if (role instanceof Role) {
                                if (!this.access.blacklist.roles.includes(role.id)) {
                                    isBlacklisted = false; // if message has a member, and the member is a role manager, and the role is a role, and the role id is not in the blacklist
                                }
                            }
                        }
                    }

                    if (isBlacklisted) {
                        accessReply += "user has blacklisted roles; "
                    }
                }
                if (!this.access.blacklist.channels.includes(message.channel?.id || "")) {
                    isBlacklisted = false;
                } else if (this.access.blacklist.channels.length > 0) {
                    accessReply += "channel in blacklist; "
                }
                if (!this.access.blacklist.guilds.includes(message.guild?.id || "")) {
                    isBlacklisted = false;
                } else if (this.access.blacklist.guilds.length > 0) {
                    accessReply += "guild in blacklist; "
                }
            }
            if (!isWhitelisted || isBlacklisted) {
                message.reply(accessReply);
                return;
            }

            if (!this.input_types.includes(input.input_type)) {
                message.reply(`input type ${input.input_type} is not enabled for this command`);
                return;
            }

            if (!this.contexts.includes(InteractionContextType.Guild)) {
                if (message.guild) {
                    message.reply("this command is not enabled in guilds");
                    return;
                }
            }
            // todo: add context checks for bot dm and private channel

            if (!message.guild?.members.me?.permissions.has(PermissionFlagsBits.Administrator)) {
                input.bot_is_admin = false;
                return;
            } else {
                input.bot_is_admin = true;
            }

            if (!this.allow_external_guild && !input.bot_is_admin) {
                message.reply("this command is not enabled in guilds where i dont have administrator");
                return;
            }

            // todo: add subcommand support

            if (!input.args) {
                input.args = await this.get_arguments(input);
            }
            if (!input.message) return;

            const finalCommandInput = {
                message: input.message,
                guildConfig: input.guildConfig,
                args: input.args,
                command: this.name,
                input_type: input.input_type,
                bot_is_admin: input.bot_is_admin,
                piped_data: input.piped_data
            }

            return this._execute_raw(finalCommandInput);
        };
    }
}