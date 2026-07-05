import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import { listPrompts, Prompt, setActivePrompt, setEditingPrompt } from "../../lib/gpt/promptManager";
import { textToAttachment } from "../../lib/attachment_manager";
import { kMaxLength } from "buffer";

const command = new Command(
    {
        name: 'get',
        description: 'returns the specified prompt',
        long_description: 'returns the raw data of the specified prompt. this is useful for exceedingly long prompts which can\'t be displayed normally due to api limits. this is also helpful for debugging',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'name',
                description: 'the name of the prompt to use',
                long_description: 'the name of the prompt to use',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: [
            "p/prompt get my prompt",
        ],
        aliases: ["json"],
        argument_order: "<name?>"
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["name"]),
    async function execute ({ invoker, args, guild_config }) {
        if (!args.name) {
            await action.reply(invoker, { content: `please supply a prompt to get`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `please supply a prompt to get`,
            });
        }

        const prompt = await Prompt.fromName(invoker.author.id, args.name);

        if (!prompt) {
            await action.reply(invoker, { content: `cannot get prompt; you do not have a prompt named \`${args.name}\`.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `cannot get prompt; you do not have a prompt named \`${args.name}\`.`,
            });
        }

        let formattedData = JSON.parse(JSON.stringify(prompt));
        formattedData["model"] = prompt.model.name;
        formattedData["author"] = prompt.author.id;
        delete formattedData["content"];

        let formattedText = "";
        let entries = Object.entries(formattedData);
        entries = entries.sort((a, b) => {
            const aHasNewline = JSON.stringify(a[1], null, 4).includes("\n") ? 1 : 0;
            const bHasNewline = JSON.stringify(b[1], null, 4).includes("\n") ? 1 : 0;
            return aHasNewline - bHasNewline;
        });
        entries.push(["content", prompt.content]); // ensures that it is the last thing outputted
        entries.forEach(([k, v]) => {
            formattedText += `# \`${k}\`: `
            let formattedValue: any = v;
            if (typeof v !== "string") {
                formattedValue = JSON.stringify(v, null, 4);
            }
            if (formattedValue.includes("\n")) formattedText += "\n";
            formattedText += formattedValue;
            if (formattedValue.includes("\n")) formattedText += "\n";
            formattedText += "\n"
        });

        await action.reply(invoker, { content: `here's your prompt`, files: [textToAttachment(formattedText, `${prompt.name}.md`)], ephemeral: guild_config.other.use_ephemeral_replies })
    }
);

export default command;