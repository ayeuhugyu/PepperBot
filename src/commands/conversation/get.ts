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
        ],
        argument_order: "<id?>",
        requiredPermissions: ["AttachFiles"],
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["id"]),
    async function execute ({ invoker, args, guild_config, will_be_piped }) {
        const whitelisted = CommandAccessTemplates.dev_only.whitelist.users.includes(invoker.author.id);

        let conversation;
        if (whitelisted && args.id) {
            conversation = await getConversation(args.id, true);
        } else if (args.id) {
            await action.reply(invoker, { content: `you are not whitelisted to see specific conversation ids.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `you are not whitelisted to see specific conversation ids.`,
            });
        } else {
            conversation = await getUsersLatestConversation(invoker.author.id, true);
        }

        if (!conversation) {
            await action.reply(invoker, { content: "no conversation found", ephemeral: guild_config.other.use_ephemeral_replies })
            return new CommandResponse({
                error: true,
                message: `no conversation found`,
            });
        }

        const data = Object.assign(conversation as any, {
            model: conversation.model.name,
            prompt: `${conversation.prompt.author.username}/${conversation.prompt.name}`,
        });
        delete data.emitter;
        delete data.isRunningMutex;
        if (!will_be_piped) {
            await action.reply(invoker, { content: "here's your conversation", files: [textToAttachment(inspect(data, { depth: Infinity }), `${conversation.id}.txt`)], ephemeral: guild_config.other.use_ephemeral_replies });
        } else {
            await action.reply(invoker, { content: `piped conversation data`, ephemeral: guild_config.other.use_ephemeral_replies });
        }

        return new CommandResponse({
            error: false,
            pipe_data: {
                input_text: inspect(data, { depth: Infinity }),
            }
        });
    }
);

export default subcommand;