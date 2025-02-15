import { Collection, Message } from "discord.js";
import { CommandInput } from "./classes/command";

export enum GetArgumentsTemplateType {
    DoNothing = "do_nothing",
    SingleStringFirstSpace = "single_string_first_space",
    SingleStringWholeMessage = "single_string_whole_message",
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
    }
}