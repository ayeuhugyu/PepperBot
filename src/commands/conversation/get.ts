import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import database from "../../lib/data_manager";
import { getConversation, getUsersLatestConversation } from "../../lib/gpt/conversation";
import { inspect } from "util";
import { textToAttachment } from "../../lib/attachment_manager";

const subcommand = new Command(
    {
        name: 'get',
        description: 'returns your gpt conversation',
        long_description: 'returns your gpt conversation',
        tags: [CommandTag.Debug, CommandTag.AI],
        example_usage: "p/conversation get",
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'id',
                description: 'the id of the conversation to return the data for',
                long_description: 'the id of the conversation to return the data for, whitelist only. used for debugging',
                type: CommandOptionType.String,
                required: false,
                deployed: false,
            }),
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["id"]),
    async function execute ({ invoker, args, guild_config }) {
        const whitelisted = CommandAccessTemplates.dev_only.whitelist.users.includes(invoker.author.id);

        let conversation;
        if (whitelisted && args.id) {
            conversation = await getConversation(args.id, true);
        } else if (args.id) {
            await action.reply(invoker, { content: `you are not whitelisted to see specific conversation ids.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        } else {
            conversation = await getUsersLatestConversation(invoker.author.id, true);
        }

        if (!conversation) {
            await action.reply(invoker, { content: "no conversation found", ephemeral: guild_config.other.use_ephemeral_replies })
            return;
        }

        const data = Object.assign(conversation as any, {
            model: conversation.model.name,
            prompt: `${conversation.prompt.author.username}/${conversation.prompt.name}`,
        });
        delete data.emitter;
        delete data.isRunningMutex;

        await action.reply(invoker, { content: "here's your conversation", files: [textToAttachment(inspect(data, { depth: Infinity }), `${conversation.id}.txt`)], ephemeral: guild_config.other.use_ephemeral_replies })
    }
);

export default subcommand;