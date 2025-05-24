import { Channel } from "diagnostics_channel";
import { ApplicationCommandOptionType, Attachment, Role, User } from "discord.js";

// putting these enums in a different file helps avoid circular dependencies
export enum InvokerType {
    Interaction = "interaction",
    Message = "message",
}

export enum SubcommandDeploymentApproach {
    /**
     * Don't use any native Discord subcommand stuff; instead, use command with a "subcommand" parameter that will take in the arguments for any/all of its subcommands.
     *
     * Benefits:
     *  - Doesn't clutter the slash command UI with many different subcommands.
     *  - Supports subcommand aliases instead of being restricted to canonical names.
     *  - Can invoke without a subcommand.
     *
     * Drawbacks:
     *  - Subcommands cannot have arguments that are required.
     *  - The names for the arguments of each subcommand must be unique on a global scale.
     */
    Merge,

    /**
     * Use the native Discord subcommand system.
     *
     * Benefits:
     *  - Clear separation for the arguments of each subcommand; can share names and have required options
     *
     * Drawbacks:
     *  - Can clutter the command list with many subcommands.
     *  - Invoking the command "without" a subcommand can't be done; the `self` property must be set to create a name for the subcommand that will invoke the normal command.
     */
    Split,

    /**
     * Don't deploy subcommands.
     * This option is only valid if the command itself is not being deployed.
     */
    None
}

export enum CommandTag {
    AI = "#ai",
    Management = "#management",
    Fun = "#fun",
    Utility = "#utility",
    Info = "#info",
    Voice = "#voice",
    Music = "#music",
    Moderation = "#moderation",
    Debug = "#debug",
    Other = "#other",
    TextPipable = "#text pipable",
    ImagePipable = "#image pipable",
    WhitelistOnly = "#whitelist only",
}

export const CommandOptionType = ApplicationCommandOptionType;
export type CommandOptionType = ApplicationCommandOptionType;
export namespace CommandOptionType {
    export type Value <T extends CommandOptionType> =
        | T extends ApplicationCommandOptionType.Subcommand ? never // unsupported
        : T extends ApplicationCommandOptionType.SubcommandGroup ? never // unsupported
        : T extends ApplicationCommandOptionType.String ? string
        : T extends ApplicationCommandOptionType.Integer ? number
        : T extends ApplicationCommandOptionType.Boolean ? boolean
        : T extends ApplicationCommandOptionType.User ? User
        : T extends ApplicationCommandOptionType.Channel ? Channel
        : T extends ApplicationCommandOptionType.Role ? Role
        : T extends ApplicationCommandOptionType.Mentionable ? User | Role
        : T extends ApplicationCommandOptionType.Number ? number
        : T extends ApplicationCommandOptionType.Attachment ? Attachment
        : never;

    export type Numeric =
        | ApplicationCommandOptionType.Number
        | ApplicationCommandOptionType.Integer

    export type ChoicesUsable = Numeric | ApplicationCommandOptionType.String
}

export const enum CommandEntryType {
    /**
     * A non-aliased identifier for a command; the primary name of the command.
     */
    Command = "command",

    /**
     * An alias that points to a command.
     */
    CommandAlias = "command alias",

    /**
     * An "subcommand root alias" refers to an alias which points to a command's subcommand.
     *
     * For example, if you had a `p/warn` command that had a subcommand of `view <user>` to view warnings of a user,
     * you could add a root alias of `p/warns` to the `view` subcommand so that `p/warns <user>` would be equivalent
     * to `p/warn view <user>`.
     */
    SubcommandRootAlias = "subcommand root alias",
}