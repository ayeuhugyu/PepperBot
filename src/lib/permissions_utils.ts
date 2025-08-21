import { CommandInvoker } from "../lib/classes/command";
import { Guild, GuildChannelResolvable, PermissionFlagsBits, PermissionsBitField, TextBasedChannel } from "discord.js";

// default permissions for fallback
export const defaultExternalPermissions = new PermissionsBitField(
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.AttachFiles
);

export function getPermissionsFromChannel(channel: GuildChannelResolvable | null | undefined, guild: Guild | null | undefined) {
    if (!guild || !channel) return undefined;
    const me = guild.members.me;
    if (!me) return undefined;
    try {
        return me.permissionsIn(channel);
    } catch {
        return undefined;
    }
}

export function getPermissionsFromGuild(guild: Guild | null | undefined) {
    if (!guild) return undefined;
    const me = guild.members.me;
    return me?.permissions;
}

export function getPermissionsFromMessage(invoker: CommandInvoker<any>) {
    const guild = invoker.guild;
    const channel = invoker.channel as GuildChannelResolvable | undefined;
    return (
        getPermissionsFromChannel(channel, guild) ??
        getPermissionsFromGuild(guild) ??
        defaultExternalPermissions
    );
}
