import * as log from "../log";
import type { GuildConfig } from "../guild_config_manager";
import { ApplicationCommandType, ApplicationCommandOptionType, PermissionsBitField, ApplicationIntegrationType, InteractionContextType, ChannelType, Message, CommandInteraction, Collection, GuildMemberRoleManager, Role, PermissionFlagsBits, User, Attachment, Awaitable, Utils, GuildChannelResolvable } from "discord.js";
import * as contributors from "../../../constants/contributors.json";
import * as action from "../discord_action";
import * as statistics from "../statistics";
import { InvokerType, SubcommandDeploymentApproach, CommandTag, CommandOptionType, CommandEntryType } from "./command_enums";
import type { CommandManager } from "../command_manager";
import { inspect } from "node:util";

let guildConfigManager
if (!guildConfigManager) { // avoids circular dependency
    guildConfigManager = await import("../guild_config_manager").then((m) => m)
}
const { fetchGuildConfig } = guildConfigManager;

type AnyObject = Record<any, any>
type EmptyObject = Record<any, never>

function pick<T, K extends keyof T>(value: T, keys: K[]): { [P in K]: T[P] } {
    const obj = {} as { [P in K]: T[P] }
    for (const key of keys) {
        obj[key] = value[key]
    }
    return obj
}
export class CommandResponse {
    error: boolean = false;
    message: string = "";
    pipe_data: any = {};
    from: string = "";
    constructor(data: Partial<CommandResponse>) {
        Object.assign(this, { ...data });
    }
}

export type CommandFunction<F extends AnyObject, P extends AnyObject, I extends InvokerType> = <II extends I>(input: CommandInput<F, P, II, false>) => any;
export type ExecuteFunction<F extends AnyObject, P extends AnyObject, I extends InvokerType> = <II extends I>(input: Omit<CommandInput<F, P, II, true>, "enrich">) => Awaitable<CommandResponse | void>;
export type GetArgumentsFunction<A extends AnyObject, I extends InvokerType> = I extends InvokerType.Message ? (input: CommandInput<AnyObject, AnyObject, InvokerType.Message, false>) => Awaitable<A> : undefined | null | (() => Awaitable<void | never | EmptyObject>)

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

export type CommandInvoker<T extends InvokerType = InvokerType> = {
    [InvokerType.Message]: Message<true>, // We wouldn't be able to see the message if it weren't in the guild
    [InvokerType.Interaction]: FormattedCommandInteraction
}[T]

interface ExtraCommandInputData {
    alias_used?: string;
    will_be_piped: boolean,
    piping_to?: string,
    next_pipe_message?: string,
    piped_data?: PipedData,
    previous_response?: CommandResponse,
    command_entry_type?: CommandEntryType,
}

export class CommandInput<
    F extends AnyObject = AnyObject,
    P extends AnyObject = AnyObject,
    I extends InvokerType = InvokerType,
    E extends boolean = true,
    A = E extends false
        ? I extends InvokerType.Message ? undefined : F & { [K in Exclude<keyof P, keyof F>]?: undefined }
        : I extends InvokerType.Message
            ? P & { [K in Exclude<keyof F, keyof P>]?: undefined }
            : F & { [K in Exclude<keyof P, keyof F>]?: undefined }
> implements ExtraCommandInputData {
    args: A;
    message: I extends InvokerType.Message ? Message<true> : null;
    interaction: I extends InvokerType.Interaction ? FormattedCommandInteraction : null;

    // async constructor
    public static async new<
        F extends AnyObject = AnyObject,
        P extends AnyObject = AnyObject,
        I extends InvokerType = InvokerType,
        E extends boolean = true,
        A = E extends false
            ? I extends InvokerType.Message ? undefined : F & { [K in Exclude<keyof P, keyof F>]?: undefined }
            : I extends InvokerType.Message
                ? P & { [K in Exclude<keyof F, keyof P>]?: undefined }
                : F & { [K in Exclude<keyof P, keyof F>]?: undefined }
    >(invoker: CommandInvoker<I>, command: Command<any, any, I, F, P>, args: A, extra: ExtraCommandInputData, command_manager: CommandManager) {
        const input = new this(invoker, command, args, extra, command_manager);
        input.guild_config = await fetchGuildConfig(invoker.guildId!); // !!!!
        return input
    }

    private constructor(invoker: CommandInvoker<I>, public command: Command<any, any, I, F, P>, args: A, extra: ExtraCommandInputData, manager: CommandManager) {
        this.args = args;
        this.invoker = invoker;
        this.invoker_type = ((invoker instanceof Message)
            ? InvokerType.Message
            : InvokerType.Interaction
        ) as I;

        this.command_name_used = extra.alias_used ?? command.name;
        this.command_entry_type = extra.command_entry_type ?? CommandEntryType.Command;
        this.piping_to = extra.piping_to;
        this.previous_response = extra.previous_response;
        this.will_be_piped = extra.will_be_piped;
        this.next_pipe_message = extra.next_pipe_message;
        this.command_manager = manager
        this.message = (invoker instanceof Message ? invoker : null) as I extends InvokerType.Message ? Message<true> : null;
        this.interaction = (invoker instanceof Message ? null : invoker) as I extends InvokerType.Interaction ? FormattedCommandInteraction : null;

        const external = this.interaction?.memberPermissions?.has(PermissionFlagsBits.UseExternalApps);
        // We don't need to account for the guild being from other shards since we won't be processing it on this shard in the first place.
        this.forced_ephemeral = external ? (
            this.interaction!.guildId !== null && // has an associated guild id
            this.interaction!.client.guilds.cache.find(g => g.id === this.interaction!.guildId) === undefined // but not one this shard has cached
        ) : false;

        Object.assign(this, extra)
    }

    enrich(parsed?: P | null | undefined | void): asserts this is CommandInput<F, P, I, true> {
        if (parsed) this.args = parsed as unknown as A;
    }

    is_message(): this is CommandInput<never, P, InvokerType.Message, E> { return this.invoker_type === InvokerType.Message }
    is_interaction(): this is CommandInput<F, never, InvokerType.Interaction, E> { return this.invoker_type === InvokerType.Interaction }

    /**
     * The name of the command *or it's alias* used for invocation.
     * For the name of the command itself, see the `name` property of the `command` attached to this input.
     */
    command_name_used: string;

    invoker: CommandInvoker<I>;
    invoker_type: I;
    guild_config!: GuildConfig; // !!!!
    self = this;

    previous_response: CommandResponse | undefined;
    piped_data?: PipedData;
    will_be_piped!: boolean;
    piping_to?: string;
    next_pipe_message?: string | undefined;

    command_manager: CommandManager;
    command_entry_type: CommandEntryType;

    /**
     * If the bot isn't in the guild / the guild is undefined, and the member does not have permissions to use external apps.
     */
    forced_ephemeral: boolean
}


export interface Contributor {
    name: string;
    user_id: string;
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

    public test(invoker: CommandInvoker) {
        const { author, member, channel, guild } = invoker;
        const userRoles = member?.roles instanceof GuildMemberRoleManager ? member.roles.cache.map(role => role.id) : [];
        const guildId = guild?.id || "";
        const channelId = channel?.id || "";
        const userId = author.id;

        const whitelistSpecified = Object.values(this.whitelist).some(list => list.length > 0);
        const whitelisted = !whitelistSpecified ||
            this.whitelist.users.includes(userId) ||
            this.whitelist.roles.some(role => userRoles.includes(role)) ||
            this.whitelist.channels.includes(channelId) ||
            this.whitelist.guilds.includes(guildId);

        const blacklistedSpecified = Object.values(this.blacklist).some(list => list.length > 0);
        const blacklisted = blacklistedSpecified && (
            this.blacklist.users.includes(userId) ||
            this.blacklist.roles.some(role => userRoles.includes(role)) ||
            this.blacklist.channels.includes(channelId) ||
            this.blacklist.guilds.includes(guildId)
        );

        return {
            whitelisted,
            blacklisted,
        }
    }
}

export interface CommandOptionChoice {
    name: string;
    value: string;
}

type RequiredCommandOptionProperties = "name" | "type"
export class CommandOption<
    const T extends CommandOptionType = CommandOptionType,
    const K extends string = string,
    const R extends boolean = false,
> {
    name!: K;
    type!: T;
    required: R = false as R;
    description = "no description";
    choices: T extends CommandOptionType.ChoicesUsable ? CommandOptionChoice[] : [] = [] as never;
    channel_types?: ChannelType[]
    private options?: CommandOption[];

    /* ↑↑↑ discords shit ↓↓↓ my shit */
    deployed: boolean = true;
    long_description: string = "no description"
    long_requirements: string | undefined = undefined; // more detailed version of the "required" option, allows you to write stuff like "required if b is undefined"
    validation_errors: ValidationCheck[] = []; // errors that occur during command validation, DO NOT ADD THINGS TO THIS!

    constructor(
        data:
            & Partial<Omit<CommandOption<T, K, R>, RequiredCommandOptionProperties>>
            & Pick<        CommandOption<T, K, R>, RequiredCommandOptionProperties>
    ) {
        if (!data.long_description && data.description) data.long_description = data.description;
        Object.assign(this, { ...data });

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
    }

    toJSON() {
        const json = pick(this, ["name", "description", "type", "required", "options" as never, "choices", "channel_types"]) as this;
        if (json.options) json.options = json.options.map(option => option.toJSON());
        return json;
    }
}

namespace CommandOption {
    export type ToObject<T extends readonly CommandOption[], O = {}> =
        | T["length"] extends 0 ? O : T extends readonly [
            CommandOption<infer T, infer K, infer R>,
            ...infer L extends CommandOption[]
        ] ? ToObject<L, O & (R extends true
            ? { [P in K] : CommandOptionType.Value<T> }
            : { [P in K]?: CommandOptionType.Value<T> }
        )> : O
}

function defaultCommandFunction({ command = "" }) {
    log.error("undefined command function for " + command)
}

interface MergeSubcommandsSpecification<O extends CommandOption<ApplicationCommandOptionType, string, any>[] = CommandOption<ApplicationCommandOptionType, string, any>[]> {
    deploy: SubcommandDeploymentApproach.Merge,
    list: Command<O, any, any, any, any>[],
    self?: never;
}

interface SplitSubcommandsSpecification {
    deploy: SubcommandDeploymentApproach.Split,
    list: Command<any, any, any, any, any>[],

    /**
     * Name for the "sub"-command which is actually this command itself.
     *
     * If set to null, this root command will not have any method of direct invocation by slash commands.
     */
    self?: string | null,
}

type SubcommandsSpecification<T extends SubcommandDeploymentApproach = SubcommandDeploymentApproach, O extends CommandOption<ApplicationCommandOptionType, string, any>[] = CommandOption<ApplicationCommandOptionType, string, any>[]> = {
    [SubcommandDeploymentApproach.Merge]: MergeSubcommandsSpecification & { list: Command<O, any, any, any, any>[] },
    [SubcommandDeploymentApproach.Split]: SplitSubcommandsSpecification & { list: Command<any, any, any, any, any>[] },
    [SubcommandDeploymentApproach.None]: { deploy: SubcommandDeploymentApproach.None, list: Command<any, any, any, any, any>[] }
}[T]

export class Command<
    const S extends CommandOption<CommandOptionType, string, any>[] = CommandOption[], // slash command argument definition
    const D extends SubcommandsSpecification = SubcommandsSpecification<SubcommandDeploymentApproach.None, []>,
    const I extends InvokerType = InvokerType, // invocation methods
    const F extends AnyObject = S["length"] extends 0 ? EmptyObject : CommandOption.ToObject<D extends MergeSubcommandsSpecification<infer O extends CommandOption<any, any, false>[]> ? [...O, ...S] : S>, // inferred arguments from slash command definition + subcommand
    const P extends AnyObject = F, // arguments from manual parsing
> {
    name!: string;
    type = ApplicationCommandType.ChatInput
    description = "no description";
    options: S = [] as unknown as S;
    default_member_permissions?: PermissionsBitField;
    integration_types = [ ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall ];
    contexts = [ InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel ];
    requiredPermissions: (keyof (typeof PermissionFlagsBits))[] = []; // SendMessages and ViewChannel are always checked
    nsfw = false
    /* ↑↑↑ discords shit ↓↓↓ my shit */
    aliases: string[] = [];
    /**
     * Top-level aliases to create for subcommands.
     *
     * For example: if you had a `p/warn` command that had a subcommand of `view <user>` to view warnings of a user,
     * you could make add `root_aliases: ["warns"]` to the `view` subcommand so that so that `p/warns <user>` would
     * be equivalent to `p/warn view <user>`.
     */
    root_aliases: string[] = [];
    long_description = "no description";
    argument_order: string = ""; // this is not an array because some commands don't require argument orders or have Strange Ones, but the general convention is to just list the arguments in the order the getArguments function looks for them and then put <> around it, ex. <arg1> <arg2>
    example_usage: string | string[] = ""; // example usage so its easy to know how to use it
    access = new CommandAccess();
    /**
     * Which ways this command can be invoked, such as through slash commands or a prefixed message.
     */
    input_types: I[] = [ InvokerType.Interaction, InvokerType.Message ] as I[];
    allow_external_guild = true; // should it be usable in guilds without administrator permission? (thats the only way to detect it)
    subcommands?: D;
    pipable_to: (string | CommandTag)[] = []; // array of command names | tags which output may be piped to; the check for it has been disabled for now so its purely visual.
    not_pipable: boolean = false; // if true, this command cannot be piped with, and pipe characters will just be straight up ignored in its input. this is currently only used for p/alias.
    contributors: Contributor[] = [contributors.ayeuhugyu];
    subcommand_argument = "subcommand"
    validation_errors: ValidationCheck[] = []; // errors that occur during command validation, DO NOT ADD THINGS TO THIS!
    tags: CommandTag[] = [CommandTag.Other];
    is_sub_command: boolean = false;
    parent_command: string | undefined = undefined;
    execute: CommandFunction<F, P, I> = defaultCommandFunction as never;
    getSubcommand: () => Command<S, D, I, F, P> | undefined = () => undefined;

    toJSON(): Record<string, unknown> {
        const json = pick(this, ["name", "description", "type", "options", "default_member_permissions", "integration_types", "contexts", "nsfw"]);
        json.options = json.options.map(option => option.toJSON()) as never;
        return json;
    }

    constructor(
        data: Partial<Omit<Command<S, D, I, F, P>, "name">> & { name: string },
        public parse_arguments: GetArgumentsFunction<P, I>,
        private execute_internal: ExecuteFunction<F, P, I>
    ) {
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

        switch (this.subcommands?.deploy) {
            case SubcommandDeploymentApproach.None: { break }
            case SubcommandDeploymentApproach.Split: {
                const own_options = this.options;
                this.options = this.subcommands.list.map(subcommand  => new CommandOption({
                    ...pick(subcommand, ["name", "description", "options"]),
                    type: ApplicationCommandOptionType.Subcommand,
                })) as never;
                if (this.subcommands.self) {
                    const data = pick(this, ["name", "description", "options"]);
                    data.name = this.subcommands.self;
                    data.options = own_options.filter(({ name }) => name !== this.subcommand_argument) as never;
                    this.options.push(new CommandOption({
                        ...data,
                        type: ApplicationCommandOptionType.Subcommand,
                    }))
                }
                break
            }
            case SubcommandDeploymentApproach.Merge: {
                for (const command of this.subcommands.list) {
                    this.options.push(...command.options)
                }
                break
            }
        }
        if (this.subcommands?.list) {
            this.subcommands.list.forEach(subcommand => {
                subcommand.is_sub_command = true;
                subcommand.parent_command = this.name;
            });
        }

        // #region COMMAND EXECUTION
        this.execute = async (input: CommandInput<F, P, I, false>) => {
            log.info("executing command p/" + (this.parent_command ? this.parent_command + " " + this.name : this.name) + ((input.previous_response?.from !== undefined) ? " piped from p/" + input.previous_response?.from : ""));
            await statistics.incrementCommandUsage((this.parent_command ? this.parent_command + " " + this.name : this.name));
            await statistics.incrementInvokerTypeUsage(input.invoker_type);
            log.debug("incremented statistics for command " + (this.parent_command ? this.parent_command + " " + this.name : this.name) + " and invoker type " + input.invoker_type);
            const start = performance.now();
            const { invoker } = input;
            if (!invoker) {
                log.error("invoker is undefined in command execution");
                return new CommandResponse({
                    error: true,
                    message: "invoker is undefined",
                })
            }
            const invoker_type = (invoker instanceof Message)
                ? InvokerType.Message
                : InvokerType.Interaction;

            log.info(`testing ${invoker.author.id} against access list for command ${this.name}`);
            const { whitelisted, blacklisted } = this.access.test(invoker);

            if (!whitelisted || blacklisted) {
                let accessReply = "access check failed: ";
                if (!whitelisted) accessReply += "user/channel/guild not in whitelist; ";
                if (blacklisted) accessReply += "user/channel/guild in blacklist; ";
                log.info(accessReply + "for command " + this.name);
                action.reply(invoker, { content: accessReply, ephemeral: true });
                return new CommandResponse({
                    error: true,
                    message: accessReply,
                })
            }

            if (!this.input_types.includes(invoker_type as I)) {
                log.info("invalid input type " + invoker_type + " for command " + this.name);
                action.reply(invoker, { content: `input type \"${invoker_type}\" is not enabled for this command`, ephemeral: true });
                return new CommandResponse({
                    error: true,
                    message: `input type \"${invoker_type}\" is not enabled for this command`,
                })
            }

            if (!this.contexts.includes(InteractionContextType.Guild)) {
                if (invoker.guild) {
                    log.info("guild context is not enabled for command " + this.name);
                    action.reply(invoker, { content: "this command is not enabled in guilds", ephemeral: true });
                    return new CommandResponse({
                        error: true,
                        message: "this command is not enabled in guilds",
                    })
                }
            }
            // todo: add context checks for bot dm and private channel

            const bot_in_guild = invoker.guild?.members.me?.roles.cache.some(role => role.managed) || false;
            if (!bot_in_guild) log.info(`bot lacks managed role for guild ${invoker.guild?.id}; likely is not in it`);
            if (!this.allow_external_guild && !bot_in_guild) {
                log.info("external guilds are not enabled for command " + this.name);
                action.reply(invoker, { content: /*"this command is not enabled in guilds where i don't have administrator"*/ "this command can't be used in external guilds", ephemeral: true });
                return new CommandResponse({
                    error: true,
                    message: "this command can't be used in external guilds",
                })
            }

            input.enrich(input.is_message() ? (await this.parse_arguments?.(input) ?? {}) as P : undefined);
            input.piped_data = new PipedData(input.previous_response?.from, input.previous_response?.pipe_data)

            let usedSubcommand

            if (this.subcommand_argument in input.args) {
                const subcommand = this.subcommands?.list.find(subcommand => (
                    subcommand.name === input.args[this.subcommand_argument] ||
                    subcommand.aliases.includes(input.args[this.subcommand_argument])
                ));

                if (subcommand === undefined) {
                    // pass to default executor
                    log.info("subcommand not found, passing to default executor");
                    const response = await this.execute_internal(input);
                    log.info("executed command p/" + this.name + " in " + ((performance.now() - start).toFixed(3)) + "ms");
                    return response;
                }
                log.info("subcommand found: " + subcommand.name);

                if (input.is_message()) {
                    const subArg = input.args[this.subcommand_argument];
                    input.invoker.content = input.invoker.content.replace(new RegExp(`\\s+${subArg}\\b`), "");
                    input.message.content = input.message.content.replace(new RegExp(`\\s+${subArg}\\b`), "");
                    // this makes get arguments functions easily standardizable
                    // this will not affect subcommands executed with root aliases due to the space, this is intentional though
                    // also if this fucking thing does what it has been doing and just not fucking working on some operating systems i will do terrible things
                    log.debug("replaced subcommand in message content: " + input.invoker.content);
                    input.enrich(subcommand.parse_arguments?.(input) ?? {})
                }

                log.info("executing subcommand p/" + this.name + " " + subcommand.name);

                usedSubcommand = subcommand;
            }

            const piping_to = input.piping_to
            if (piping_to) {
                const next_pipe_message = input.next_pipe_message
                let canPipe = true;
                let pipableCommands: string[] = [] // string of command names
                let command = usedSubcommand || this;
                command.pipable_to.forEach((pipe) => {
                    const isTag = pipe.startsWith("#");
                    if (isTag) {
                        const taggedCommands = input.command_manager.withTag(pipe as CommandTag);
                        pipableCommands.push(...taggedCommands.map((command: Command) => `${command.parent_command ? command.parent_command + " " : ""}${command.name}`));
                    } else {
                        pipableCommands.push(pipe);
                    }
                });
                canPipe = pipableCommands.some((pipe) => next_pipe_message?.replace(input.guild_config.other.prefix, "")?.startsWith(pipe));
                if (!canPipe) {
                    await action.reply(invoker, `${input.guild_config.other.prefix}${usedSubcommand ? `${this.name} ${usedSubcommand.name}` : this.name} cannot be piped to ${input.guild_config.other.prefix}${piping_to}`);
                    log.info(`attempt to pipe command ${this.name} to ${piping_to} failed`);
                    return new CommandResponse({
                        error: true,
                        message: `${input.guild_config.other.prefix}${usedSubcommand ? `${this.name} ${usedSubcommand.name}` : this.name} cannot be piped to ${input.guild_config.other.prefix}${piping_to}`,
                    })
                };
            }

            let response
            log.debug("executing command, input: ", inspect(input, { depth: 1, colors: true, compact: true }));
            let usedCommand = usedSubcommand || this;
            // check permissions for the command
            const foundPermissions: string[] = [];
            const missingPermissions: string[] = [];
            const channel = invoker.channel;
            const defaultExternalPermissions = new PermissionsBitField(PermissionFlagsBits.SendMessages | PermissionFlagsBits.ViewChannel | PermissionFlagsBits.AttachFiles); // these are the default permissions used when using slash commands in external guilds
            if (channel) {
                const permissions = invoker.guild?.members?.me?.permissionsIn(channel as GuildChannelResolvable) || invoker.guild?.members.me?.permissions || defaultExternalPermissions;
                log.info("checking permissions for command " + usedCommand.name + " in " + channel.id);
                log.debug("checking permissions for command " + usedCommand.name + " in channel " + channel.id + " with permissions: " + permissions.toArray().join(", "));
                log.debug("permissions to check: SendMessages, ViewChannel, " + usedCommand.requiredPermissions.join(", "));
                // If the bot has Administrator, skip permission checks
                if (permissions.has(PermissionFlagsBits.Administrator)) {
                    foundPermissions.push("+ Administrator (all permissions granted)");
                } else {
                    if (!permissions.has(PermissionFlagsBits.SendMessages)) {
                        missingPermissions.push("- SendMessages");
                    } else {
                        foundPermissions.push("+ SendMessages");
                    }
                    // if the current channel is a thread channel, we also need to check SendMessagesInThreads
                    if (channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread) {
                        if (!permissions.has(PermissionFlagsBits.SendMessagesInThreads)) {
                            missingPermissions.push("- SendMessagesInThreads");
                        } else {
                            foundPermissions.push("+ SendMessagesInThreads");
                        }
                    }
                    if (!permissions.has(PermissionFlagsBits.ViewChannel)) {
                        missingPermissions.push("- ViewChannel");
                    } else {
                        foundPermissions.push("+ ViewChannel");
                    }
                    if (usedCommand.requiredPermissions) {
                        for (const permission of usedCommand.requiredPermissions) {
                            if (!permissions.has(PermissionFlagsBits[permission])) {
                                missingPermissions.push(`- ${permission}`);
                            } else {
                                foundPermissions.push(`+ ${permission}`);
                            }
                        }
                    }
                }
            } else {
                log.warn("invoker channel is undefined, skipping channel permission checks");
            }

            if (missingPermissions.length > 0) {
                log.warn(`missing permissions for command ${this.name} in channel ${channel?.id}: ` + missingPermissions.join(", "));
                const missingPermissionsMessage = `bot lacks permissions required to execute this command:\n\`\`\`diff\n${foundPermissions.join("\n")}\n${missingPermissions.join("\n")}\n\`\`\``;
                action.reply(invoker, { content: missingPermissionsMessage, ephemeral: true });
                return new CommandResponse({
                    error: true,
                    message: missingPermissionsMessage,
                });
            }
            if (usedSubcommand) {
                response = await usedSubcommand.execute_internal(input);
                log.info("executed subcommand p/" + this.name + " " + usedSubcommand.name + " in " + ((performance.now() - start).toFixed(3)) + "ms");
            } else {
                response = await this.execute_internal(input);
                log.info("executed command p/" + (this.parent_command ? this.parent_command + " " + this.name : this.name) + " in " + ((performance.now() - start).toFixed(3)) + "ms");
            }
            await statistics.addExecutionTime(this.name, performance.now() - start);
            log.debug(`added execution time for command ${this.name} (${(performance.now() - start).toFixed(3)}ms)`);
            return response;
        };
    }
}