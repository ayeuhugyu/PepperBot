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