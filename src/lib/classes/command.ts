import { fetchGuildConfig, GuildConfig } from "../guild_config_manager";
import * as log from "../log";
import { ApplicationCommandType, ApplicationCommandOptionType, PermissionsBitField, ApplicationIntegrationType, InteractionContextType, ChannelType, Message, CommandInteraction, Collection, GuildMemberRoleManager, Role, PermissionFlagsBits } from "discord.js";
import * as action from "../discord_action";

export class CommandResponse {
    error: boolean = false;
    message: string = "";
    pipe_data: any = {};
    from: string = "";
    constructor(data: Partial<CommandResponse>) {
        Object.assign(this, { ...data });
    }
}

export type CommandFunction = ({}: Partial<CommandInput>) => any;
export type ExecuteFunction = ({}: CommandInput) => any;
export type GetArgumentsFunction = ({}: CommandInput) => any;

export class PipedData {
    from: string | undefined = "";
    data: any = {};
    constructor(from: string | undefined, data: any) {
        this.from = from;
        this.data = data;
    }
}

export interface FormattedCommandInteraction extends CommandInteraction {
    author: Message["author"];
}

export enum InputType {
    Interaction,
    Message,
}

export enum CommandOptionType {
    SubCommand = ApplicationCommandOptionType.Subcommand,
    SubCommandGroup = ApplicationCommandOptionType.SubcommandGroup,
    String = ApplicationCommandOptionType.String,
    Integer = ApplicationCommandOptionType.Integer,
    Boolean = ApplicationCommandOptionType.Boolean,
    User = ApplicationCommandOptionType.User,
    Channel = ApplicationCommandOptionType.Channel,
    Role = ApplicationCommandOptionType.Role,
    Mentionable = ApplicationCommandOptionType.Mentionable,
    Number = ApplicationCommandOptionType.Number,
    Attachment = ApplicationCommandOptionType.Attachment,
}

export enum CommandCategory {
    AI,
    Management,
    Fun,
    Utility,
    Info,
    Voice,
    Moderation,
    Debug,
    Other
}

export interface CommandInput {
    _response: CommandResponse | undefined;
    message: Message | FormattedCommandInteraction;
    guildConfig: GuildConfig;
    args: Collection<any, any> | undefined,
    command: string;
    input_type: InputType;
    bot_is_admin: boolean;
    piped_data: PipedData | undefined;
    will_be_piped: boolean;
    self: Command;
}

export interface Contributor {
    name: string;
    userid: string;
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
        whitelist: Partial<AccessList> = { users: [], roles: [], channels: [], guilds: [] },
        blacklist: Partial<AccessList> = { users: [], roles: [], channels: [], guilds: [] }
    ) {
        this.whitelist = {
            users: whitelist.users || [],
            roles: whitelist.roles || [],
            channels: whitelist.channels || [],
            guilds: whitelist.guilds || []
        };
        this.blacklist = {
            users: blacklist.users || [],
            roles: blacklist.roles || [],
            channels: blacklist.channels || [],
            guilds: blacklist.guilds || []
        };
    }
}

export interface CommandOptionChoice {
    name: string;
    value: string;
}

export class CommandOption {
    name: string = "option";
    description: string = "no description";
    type: CommandOptionType = CommandOptionType.String;
    required: boolean = false;
    choices: CommandOptionChoice[] | undefined = [];
    channel_types: ChannelType[] | undefined = undefined;
    /* ↑↑↑ discords shit ↓↓↓ my shit */
    long_description: string = "no description"
    deployed: boolean = true;
    validation_errors: ValidationCheck[] = []; // errors that occur during command validation, DO NOT ADD THINGS TO THIS! 

    constructor(data: Partial<CommandOption>) {
        const validationChecks = [
            { condition: this.name.length > 32, message: "command option name may not exceed 32 characters", unrecoverable: true },
            { condition: this.description.length > 100, message: "command option description may not exceed 100 characters", unrecoverable: true },
            { condition: (this.choices && this.choices.length > 25) || false, message: "command option cannot have more than 25 choices", unrecoverable: true },
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

        if (!data.long_description && data.description) data.long_description = data.description;
        Object.assign(this, { ...data });
    }
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
    normal_aliases: string[] = [];
    long_description: string = "no description";
    argument_order: string = ""; // this is not an array because some commands dont require argument orders or have Strange Ones, but the general convention is to just list the arguments in the order the getArguments function looks for them and then put <> around it, ex. <arg1> <arg2>
    access: CommandAccess = new CommandAccess();
    input_types: InputType[] = [ InputType.Interaction, InputType.Message ]; // which input types to enable usage for (ex. text / slash commands)
    deployed: boolean = true; // if it gets deployed as a slash command
    allow_external_guild: boolean = false; // should it be usable in guilds without administrator permission? (thats the only way to detect it)
    subcommands: Command[] = [];
    pipable_to: string[] = []; // array of command names which output may be piped to
    contributors: Contributor[] = [{ name: "ayeuhugyu", userid: "440163494529073152"}];
    subcommand_argument: string = "subcommand"
    validation_errors: ValidationCheck[] = []; // errors that occur during command validation, DO NOT ADD THINGS TO THIS! 
    category: CommandCategory = CommandCategory.Other;
    _execute_raw: ExecuteFunction = defaultCommandFunction;
    get_arguments: GetArgumentsFunction = defaultCommandFunction;
    execute: CommandFunction = defaultCommandFunction;

    constructor(data: Partial<Command>, getArguments: GetArgumentsFunction, execute: ExecuteFunction) {
        if (!data.long_description && data.description) data.long_description = data.description;
        Object.assign(this, { ...data });
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
        
        this._execute_raw = execute;
        this.get_arguments = getArguments;
        // #region COMMAND EXECUTION
        this.execute = async (input) => {
            log.info("executing command p/" + this.name + ((input._response?.from !== undefined) ? " piped from p/" + input._response?.from : ""));
            const start = performance.now();
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
            const { whitelist, blacklist } = this.access;
            const { author, member, channel, guild } = message;
            const userRoles = member?.roles instanceof GuildMemberRoleManager ? member.roles.cache.map(role => role.id) : [];
            const guildId = guild?.id || "";
            const channelId = channel?.id || "";
            const userId = author.id;

            const isWhitelisted = !Object.values(whitelist).some(list => list.length > 0) ||
                whitelist.users.includes(userId) ||
                whitelist.roles.some(role => userRoles.includes(role)) ||
                whitelist.channels.includes(channelId) ||
                whitelist.guilds.includes(guildId);

            const isBlacklisted = Object.values(blacklist).some(list => list.length > 0) &&
                (blacklist.users.includes(userId) ||
                blacklist.roles.some(role => userRoles.includes(role)) ||
                blacklist.channels.includes(channelId) ||
                blacklist.guilds.includes(guildId));

            if (!isWhitelisted || isBlacklisted) {
                let accessReply = "access check failed: ";
                if (!isWhitelisted) {
                    accessReply += "user/channel/guild not in whitelist; ";
                }
                if (isBlacklisted) {
                    accessReply += "user/channel/guild in blacklist; ";
                }
                log.info(accessReply + "for command " + this.name);
                action.reply(message, { content: accessReply, ephemeral: true });
                return;
            }
            // other checks
            if (!this.input_types.includes(input.input_type)) {
                log.info("invalid input type " + input.input_type + " for command " + this.name);
                action.reply(message, { content: `input type ${input.input_type} is not enabled for this command`, ephemeral: true });
                return;
            }

            if (!this.contexts.includes(InteractionContextType.Guild)) {
                if (message.guild) {
                    log.info("guild context is not enabled for command " + this.name);
                    action.reply(message, { content: "this command is not enabled in guilds", ephemeral: true });
                    return;
                }
            }
            // todo: add context checks for bot dm and private channel

            if (!message.guild?.members.me?.permissions.has(PermissionFlagsBits.Administrator)) {
                input.bot_is_admin = false;
            } else {
                input.bot_is_admin = true;
            }

            if (!this.allow_external_guild && !input.bot_is_admin) {
                log.info("external guilds are not enabled for command " + this.name);
                action.reply(message, { content: "this command is not enabled in guilds where i dont have administrator", ephemeral: true });
                return;
            }

            // todo: add subcommand support
            if (!input.message) return;
            let finalCommandInput: CommandInput = {
                message: input.message!,
                guildConfig: input.guildConfig || await fetchGuildConfig(input.message!.guild?.id || ""),
                args: input.args || undefined,
                command: this.name,
                input_type: input.input_type,
                bot_is_admin: input.bot_is_admin,
                piped_data: input.piped_data || new PipedData(input._response?.from || undefined, input._response?.pipe_data) || undefined,
                _response: input._response,
                will_be_piped: input.will_be_piped || false,
                self: this
            }
            if (!finalCommandInput.args) {
                if (finalCommandInput.input_type === InputType.Interaction) {
                    log.warn("slash command failed to provide arguments for command " + this.name);
                } else {
                    finalCommandInput.message = finalCommandInput.message as Message;
                    finalCommandInput.args = await this.get_arguments(finalCommandInput);
                    log.info("fetched arguments for command " + this.name);
                }
            }

            if (finalCommandInput.args instanceof Collection) {
                if (finalCommandInput.args.get(this.subcommand_argument)) {
                    const subcommandName = finalCommandInput.args.get(this.subcommand_argument);
                    const subcommand = this.subcommands.find(subcommand => subcommand.name === subcommandName);
                    if (subcommand instanceof Command) {
                        log.info("executing subcommand p/" + this.name + " " + subcommand.name);
                        const subcommandResponse = await subcommand.execute(finalCommandInput);
                        log.info("executed subcommand p/" + this.name + " " + subcommand.name + " in " + ((performance.now() - start).toFixed(3)) + "ms");
                        return subcommandResponse;
                    } else {
                        const response = await this._execute_raw(finalCommandInput);
                        log.info("executed command p/" + this.name + " in " + ((performance.now() - start).toFixed(3)) + "ms");
                        return response;
                    }
                }
            }

            const response = await this._execute_raw(finalCommandInput);
            log.info("executed command p/" + this.name + " in " + ((performance.now() - start).toFixed(3)) + "ms");
            return response;
        };
    }
}