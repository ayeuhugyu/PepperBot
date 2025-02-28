import { Attachment, Collection, Message } from "discord.js";
import { CommandInput, CommandInvoker, GetArgumentsFunction } from "./classes/command";
import { InvokerType } from "./classes/command_enums";

export enum GetArgumentsTemplateType {
    DoNothing = "do_nothing",
    SingleStringFirstSpace = "single_string_first_space",
    SingleStringWholeMessage = "single_string_whole_message",
    TwoStringFirstSpaceSecondWholeMessage = "two_string_first_space_second_whole_message",
    FirstAttachment = "first_attachment"
}

export function getArgumentsTemplate(templateType: GetArgumentsTemplateType, argsToGet?: string[]): GetArgumentsFunction<Record<string, any>, InvokerType.Message>  {
    switch (templateType) {
        case GetArgumentsTemplateType.DoNothing:
            return () => ({});
        case GetArgumentsTemplateType.SingleStringFirstSpace:
            if (!argsToGet) throw new Error("argsToGet must be defined for SingleStringFirstSpace template");
            return ({ invoker, command_name_used, guild_config }) => {
                    invoker = invoker as CommandInvoker<InvokerType.Message>;
                    const args: Record<string, string | undefined> = {};
                    const commandLength = `${guild_config.other.prefix}${command_name_used}`.length;
                    const arg = invoker.content.slice(commandLength)?.trim()?.split(" ")[0]?.trim();
                    args[argsToGet[0]] = arg;
                    return args;
                }
        case GetArgumentsTemplateType.SingleStringWholeMessage:
            if (!argsToGet) throw new Error("argsToGet must be defined for SingleStringWholeMessage template");
            return ({ invoker, command_name_used, guild_config }) => {
                    invoker = invoker as CommandInvoker<InvokerType.Message>;
                    const args: Record<string, string | undefined> = {};
                    const commandLength = `${guild_config.other.prefix}${command_name_used}`.length;
                    const arg = invoker.content.slice(commandLength)?.trim();
                    args[argsToGet[0]] = arg;
                    return args;
                }
        case GetArgumentsTemplateType.TwoStringFirstSpaceSecondWholeMessage:
            if (!argsToGet) throw new Error("argsToGet must be defined for TwoStringFirstSpaceSecondWholeMessage template");
            return ({ invoker, command_name_used, guild_config }) => {
                    invoker = invoker as CommandInvoker<InvokerType.Message>;
                    const args: Record<string, string | undefined> = {};
                    const commandLength = `${guild_config.other.prefix}${command_name_used}`.length;
                    const split = invoker.content.slice(commandLength)?.trim()?.split(" ");
                    const firstArg = split[0];
                    split.shift();
                    const secondArg = split.join(" ");
                    args[argsToGet[0]] = firstArg;
                    args[argsToGet[1]] = secondArg;
                    return args;
                }
        case GetArgumentsTemplateType.FirstAttachment:
            if (!argsToGet) throw new Error("argsToGet must be defined for FirstAttachment template");
            return ({ invoker }) => {
                    invoker = invoker as CommandInvoker<InvokerType.Message>;
                    const args: Record<string, Attachment | undefined> = {};
                    args[argsToGet[0]] = invoker.attachments.first();
                    return args;
                }
    }
}