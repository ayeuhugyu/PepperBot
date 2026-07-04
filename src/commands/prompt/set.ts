import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import { getEditingPrompt, listPrompts, Prompt, setActivePrompt } from "../../lib/gpt/promptManager";

const command = new Command(
    {
        name: 'set',
        description: 'sets the content of your current prompt',
        long_description: 'sets the content of your current prompt. also sets it as your used prompt. basically a shorthand, as this can be done in a bunch of other ways',
        tags: [CommandTag.AI, CommandTag.TextPipable],
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'content',
                description: 'the content to give the prompt',
                long_description: 'the content to give the prompt',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: "p/prompt set respond like a bee",
        aliases: ["content"],
        argument_order: "<content>"
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["content"]),
    async function execute ({ invoker, args, guild_config, piped_data, invoker_type }) {
        let content = piped_data?.data?.input_text || args.content
        if (!content.trim()) {
            if (invoker_type === InvokerType.Message) {
                if ((invoker as CommandInvoker<InvokerType.Message>).attachments.size > 0) {
                    const attachment = (invoker as CommandInvoker<InvokerType.Message>).attachments.first();
                    if (attachment) {
                        const attachmentContent = await fetch(attachment.url).then(res => res.text());
                        if (attachmentContent) {
                            content = attachmentContent;
                        } else {
                            action.reply(invoker, { content: "couldn't read the attachment", ephemeral: guild_config.other.use_ephemeral_replies });
                            return new CommandResponse({
                                error: true,
                                message: "couldn't read the attachment",
                            });
                        }
                    }
                }
            }
            if (!content) {
                action.reply(invoker, {
                    content: "please supply content",
                    ephemeral: guild_config.other.use_ephemeral_replies
                })
                return new CommandResponse({
                    error: true,
                    message: "please supply content",
                });
            }
        }
        let prompt = await getEditingPrompt(invoker.author.id);
        if (!prompt) prompt = await Prompt.new("autosave", invoker.author);
        prompt.content = content as string;
        await prompt.write();
        await setActivePrompt(invoker.author.id, invoker.author.id, prompt.name);
        action.reply(invoker, { content: `prompt content of \`${prompt.name}\` set to \`\`\`\n${prompt.content}\`\`\`\nyour next conversation will also now use this prompt.${(prompt.content.split(" ").length < 15) ? `\n\ni suspect your prompt is too short to cause any meaningful change, consider using \`${guild_config.other.prefix}prompt generate\` to make it longer.` : ""}`, ephemeral: guild_config.other.use_ephemeral_replies });
    }
);

export default command;