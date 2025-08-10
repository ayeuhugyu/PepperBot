import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../lib/classes/command_enums";

const command = new Command(
    {
        name: 'echo',
        description: 'echoes the text you send it',
        long_description: 'echoes the text you send it. \nthis command is meant to be used for piping text, which allows you to use things like grep to filter out your own text.',
        tags: [CommandTag.Utility, CommandTag.TextPipable],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'text',
                description: 'text to echo',
                long_description: 'the text to echo; may be piped',
                type: CommandOptionType.String,
                required: true
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message],
        example_usage: "p/echo hello world",
        aliases: ["say"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["text"]),
    async function execute ({ invoker, args, guild_config, piped_data, will_be_piped }) {
        let text: string = args.text || piped_data?.data?.input_text;

        // If text is not provided, try to get the first attachment's content
        if (invoker.attachments?.size > 0) {
            const firstAttachment = invoker.attachments.first();
            if (firstAttachment?.url) {
                try {
                    const res = await fetch(firstAttachment.url);
                    if (res.ok) {
                        text = await res.text();
                    }
                } catch (e) {
                    // Ignore fetch errors, will handle as no text below
                }
            }
        }

        if (!text) {
            await action.reply(invoker, { content: "no text provided", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "no text provided",
            });
        }
        if (will_be_piped) {
            action.reply(invoker, { content: "piped text", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                pipe_data: {
                    input_text: text
                }
            });
        }

        const message = await action.reply(invoker, { content: text, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

export default command;