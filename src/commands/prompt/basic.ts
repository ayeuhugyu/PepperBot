import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../../lib/classes/command_enums";

const command = new Command(
    {
        name: 'prompt',
        description: 'allows you to manage your prompts',
        long_description: 'allows you to edit, create, use, delete, and list your existing prompts',
        tags: [CommandTag.AI],
        pipable_to: [],
        options: [],
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [],
        },
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/prompt set always respond with \"hi\"",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, args, guild_config }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use any of the following subcommands:\n\`${guild_config.other.prefix}prompt edit\`: edit your current prompt\n\`${guild_config.other.prefix}prompt create\`: create a new prompt\n\`${guild_config.other.prefix}prompt delete\`: delete an existing prompt\n\`${guild_config.other.prefix}prompt list\`: list your prompts\n\`${guild_config.other.prefix}prompt use\`: use a specified prompt\n\`${guild_config.other.prefix}prompt set\`: set the content of your current prompt\n\`${guild_config.other.prefix}prompt generate\`: generate content for a prompt`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        await action.reply(invoker, {
            content: `this command does nothing if you don't supply a subcommand. use any of the following subcommands:\n\`${guild_config.other.prefix}prompt edit\`: edit your current prompt\n\`${guild_config.other.prefix}prompt create\`: create a new prompt\n\`${guild_config.other.prefix}prompt delete\`: delete an existing prompt\n\`${guild_config.other.prefix}prompt list\`: list your prompts\n\`${guild_config.other.prefix}prompt use\`: use a specified prompt\n\`${guild_config.other.prefix}prompt set\`: set the content of your current prompt\n\`${guild_config.other.prefix}prompt generate\`: generate content for a prompt`,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
    }
);

export default command;