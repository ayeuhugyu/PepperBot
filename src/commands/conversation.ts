import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";

import clear from "./conversation/clear";
import get from "./conversation/get";
import configure from "./conversation/configure";

const command = new Command(
    {
        name: 'conversation',
        description: 'various gpt conversation related commands',
        long_description: 'allows you to manipulate your conversation with the AI',
        tags: [CommandTag.AI],
        example_usage: "p/conversation get",
        subcommands: {
            deploy:  SubcommandDeploymentApproach.Split,
            list: [clear, get, configure],
        },
        aliases: ["conv", "gpt"],
        options: [],
        pipable_to: [],
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use any of the following subcommands:\n\`${guild_config.other.prefix}conversation get\`: get the current conversation\n\`${guild_config.other.prefix}conversation clear\`: clear the current conversation\n\`${guild_config.other.prefix}conversation configure\`: configure the current conversation\n\`${guild_config.other.prefix}conversation manipulate\`: manipulate the messages in current conversation`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        await action.reply(invoker, {
            content: `this command does nothing if you don't supply a subcommand. use any of the following subcommands:\n\`${guild_config.other.prefix}conversation get\`: get the current conversation\n\`${guild_config.other.prefix}conversation clear\`: clear the current conversation\n\`${guild_config.other.prefix}conversation configure\`: configure the current conversation\n\`${guild_config.other.prefix}conversation manipulate\`: manipulate the messages in current conversation`,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
    }
);


export default command;