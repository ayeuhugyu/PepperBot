import { Command } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType } from "../lib/classes/command_enums";

function strtobl(str: string) {
    return str.toLowerCase() === "true" || str === "1" || str === "yes" || str === "y";
}

const command = new Command(
    {
        name: 'logdebug',
        description: 'enables debug logging',
        long_description: 'enables debug logging',
        tags: [CommandTag.Debug, CommandTag.WhitelistOnly],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.dev_only,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/logdebug",
        aliases: ["lognonglobal", "debug", "printdebug", "printnonglobal"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing, []),
    async function execute ({ invoker, args, guild_config }) {
        process.env.PRINT_NON_GLOBAL = String(!strtobl(process.env.PRINT_NON_GLOBAL || ""));

        action.reply(invoker, {
            content: process.env.PRINT_NON_GLOBAL,
        })
    }
);

export default command;