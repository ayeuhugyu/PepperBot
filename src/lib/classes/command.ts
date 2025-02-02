import { fetchGuildConfig, GuildConfig } from "../guild_config_manager";
import * as log from "../log";
import { ApplicationCommandType, ApplicationCommandOptionType, PermissionsBitField, ApplicationIntegrationType, InteractionContextType, ChannelType, Message, CommandInteraction, Collection, GuildMemberRoleManager, Role, PermissionFlagsBits } from "discord.js";

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

export enum CommandCategory {
    AI,
    Management,
    Fun,
    Utility,
    Info,
    Voice,
    Moderation,
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
    name: string = "option";
    description: string = "no description";
    type: ApplicationCommandOptionType = ApplicationCommandOptionType.String;
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
    long_description: string = "no description";
    access: CommandAccess = new CommandAccess();
    input_types: InputType[] = [ InputType.Interaction, InputType.Message ]; // which input types to enable usage for (ex. text / slash commands)
    deployed: boolean = true; // if it gets deployed as a slash command
    allow_external_guild: boolean = false; // should it be usable in guilds without administrator permission? (thats the only way to detect it)
    subcommands: Command[] = [];
    pipable_to: string[] = []; // array of command names which output may be piped to
    contributors: Contributor[] = [{ name: "ayeuhugyu", userid: "440163494529073152"}];
    validation_errors: ValidationCheck[] = []; // errors that occur during command validation, DO NOT ADD THINGS TO THIS! 
    category: CommandCategory = CommandCategory.Other;
    _execute_raw: ExecuteFunction = defaultCommandFunction;
    get_arguments: GetArgumentsFunction = defaultCommandFunction;
    execute: CommandFunction = defaultCommandFunction;

    constructor(data: Partial<Command>, getArguments: GetArgumentsFunction, execute: ExecuteFunction) {
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

        if (!data.long_description && data.description) data.long_description = data.description;
        Object.assign(this, { ...data });
        
        this._execute_raw = execute;
        this.get_arguments = getArguments;
        // #region COMMAND EXECUTION
        this.execute = async (input) => {
            log.info("executing command " + this.name);
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
                message.reply(accessReply);
                return;
            }
            // other checks
            if (!this.input_types.includes(input.input_type)) {
                log.info("invalid input type " + input.input_type + " for command " + this.name);
                message.reply(`input type ${input.input_type} is not enabled for this command`);
                return;
            }

            if (!this.contexts.includes(InteractionContextType.Guild)) {
                if (message.guild) {
                    log.info("guild context is not enabled for command " + this.name);
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
                log.info("external guilds are not enabled for command " + this.name);
                message.reply("this command is not enabled in guilds where i dont have administrator");
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
            }
            if (!finalCommandInput.args) {
                finalCommandInput.args = await this.get_arguments(finalCommandInput);
                log.info("fetched arguments for command " + this.name);
            }

            return this._execute_raw(finalCommandInput);
        };
    }
}