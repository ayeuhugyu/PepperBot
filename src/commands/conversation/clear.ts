import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import database from "../../lib/data_manager";

const subcommand = new Command(
    {
        name: 'clear',
        description: 'clears your current conversation',
        long_description: 'forces the next AI response to create a brand new conversation',
        tags: [CommandTag.AI],
        pipable_to: [],
        options: [],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/conversation clear",
        aliases: []
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["argument"]),
    async function execute ({ invoker, args, guild_config }) {
        await database("gpt_force_next_new").insert({ user_id: invoker.author.id }).onConflict("user_id").merge();
        await action.reply(invoker, { content: `cleared your conversation, the next response will create a new one.`, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

export default subcommand;