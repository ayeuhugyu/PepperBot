import { Collection, Message } from "discord.js";
import { CommandInput } from "./classes/command";

export enum GetArgumentsTemplateType {
    DoNothing = "do_nothing",
    SingleStringFirstSpace = "single_string_first_space",
    SingleStringWholeMessage = "single_string_whole_message",
    TwoStringFirstSpaceSecondWholeMessage = "two_string_first_space_second_whole_message",
    FirstAttachment = "first_attachment"
}

export function getArgumentsTemplate(templateType: GetArgumentsTemplateType, argsToGet?: string[]): ((input: CommandInput) => Collection<string, any>)  {
    switch (templateType) {
        case GetArgumentsTemplateType.DoNothing:
            return () => new Collection<string, any>();
        case GetArgumentsTemplateType.SingleStringFirstSpace:
            if (!argsToGet) throw new Error("argsToGet must be defined for SingleStringFirstSpace template");
            return ({ message, self, guildConfig }) => {
                    message = message as Message;
                    const args = new Collection<string, any>();
                    const commandLength = `${guildConfig.other.prefix}${self.name}`.length;
                    const arg = message.content.slice(commandLength)?.trim()?.split(" ")[0]?.trim();
                    args.set(argsToGet[0], arg);
                    return args;
                }
        case GetArgumentsTemplateType.SingleStringWholeMessage:
            if (!argsToGet) throw new Error("argsToGet must be defined for SingleStringWholeMessage template");
            return ({ message, self, guildConfig }) => {
                    message = message as Message;
                    const args = new Collection<string, any>();
                    const commandLength = `${guildConfig.other.prefix}${self.name}`.length;
                    const arg = message.content.slice(commandLength)?.trim();
                    args.set(argsToGet[0], arg);
                    return args;
                }
        case GetArgumentsTemplateType.TwoStringFirstSpaceSecondWholeMessage:
            if (!argsToGet) throw new Error("argsToGet must be defined for TwoStringFirstSpaceSecondWholeMessage template");
            return ({ message, self, guildConfig }) => {
                    message = message as Message;
                    const args = new Collection<string, any>();
                    const commandLength = `${guildConfig.other.prefix}${self.name}`.length;
                    const split = message.content.slice(commandLength)?.trim()?.split(" ");
                    const firstArg = split[0];
                    split.shift();
                    const secondArg = split.join(" ");
                    args.set(argsToGet[0], firstArg);
                    args.set(argsToGet[1], secondArg);
                    return args;
                }
        case GetArgumentsTemplateType.FirstAttachment:
            if (!argsToGet) throw new Error("argsToGet must be defined for FirstAttachment template");
            return ({ message }) => {
                    message = message as Message;
                    const args = new Collection<string, any>();
                    args.set(argsToGet[0], message.attachments.first());
                    return args;
                }
    }
}