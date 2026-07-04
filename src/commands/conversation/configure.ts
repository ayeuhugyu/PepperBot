import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import { getConversation, getUsersLatestConversation, writeOverrides } from "../../lib/gpt/conversation";
import { ActionRow, Button, ButtonStyle, TextDisplay } from "../../lib/classes/components";
import { ButtonInteraction, LabelBuilder, Message, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { baseConfiguratorContent, createConfiguratorInputModal, extractRefreshFunction, handleConfiguratorButtons, makeModelRefresher, makePromptRefresher, parseConfiguratorInput } from "../ai-shared/configureParameters";

const subcommand = new Command(
    {
        name: 'configure',
        description: 'allows you to configure conversation parameters',
        long_description: 'allows you to configure parameters in a gpt conversation',
        aliases: ["config", "edit", "cfg"],
        tags: [CommandTag.AI],
        example_usage: "p/conversation configure",
        pipable_to: [],
        options: [
            new CommandOption({
                name: 'id',
                description: 'the id of the conversation to configure',
                long_description: 'the id of the conversation to configure, whitelist only. used for debugging/fixing',
                type: CommandOptionType.String,
                required: false,
                deployed: false,
            }),
        ],
        argument_order: "<id?>"
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["id"]),
    async function execute ({ invoker, args, guild_config }) {
        const whitelisted = CommandAccessTemplates.dev_only.whitelist.users.includes(invoker.author.id);

        let conversation;
        if (whitelisted && args.id) {
            conversation = await getConversation(args.id, true);
        } else if (args.id) {
            await action.reply(invoker, { content: `you are not whitelisted to edit specific conversation ids.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `you are not whitelisted to edit specific conversation ids.`,
            });
        } else {
            conversation = await getUsersLatestConversation(invoker.author.id, true);
        }
        if (!conversation) conversation = await getConversation();

        const sent = await action.reply(invoker, {
            components: baseConfiguratorContent,
            components_v2: true
        });

        if (!sent) return;

        const refreshModelParameters = makeModelRefresher(sent, conversation.model, conversation.getModelParameters)
        const refreshPromptParameters = makePromptRefresher(sent, conversation.getPromptParameters);

        const collector = sent.createMessageComponentCollector({ filter: (c) => c.user.id === invoker.author.id, time: 15_000 * 60 });
        collector.on("collect", async (interaction: ButtonInteraction) => {
            if (!interaction.isButton()) return;

            const shouldReturn = await handleConfiguratorButtons(interaction, refreshModelParameters, refreshPromptParameters, sent, baseConfiguratorContent);
            if (shouldReturn) return;

            let { currentValue, editingType, key, schema, overrideType, refreshFunction } = extractRefreshFunction(interaction, refreshModelParameters, refreshPromptParameters, conversation.model, conversation.getModelParameters, conversation.getPromptParameters);

            const modal = createConfiguratorInputModal(currentValue, editingType, key, schema);

            interaction.showModal(modal);
            const response = await interaction.awaitModalSubmit({ time: 15 * 60 * 60 });

            const parsed = await parseConfiguratorInput(response, schema);
            if (!parsed) return;

            (conversation[`${overrideType}ParameterOverrides`] as any)[schema?.key as unknown as any] = parsed.data;
            await writeOverrides({
                user_id: invoker.author.id,
                model_parameter_overrides: JSON.stringify(conversation.modelParameterOverrides),
                prompt_parameter_overrides: JSON.stringify(conversation.promptParameterOverrides),
            });
            await refreshFunction();
            await response.reply({ content: `overrode value of ${key} to \`${JSON.stringify(parsed.data)}\`.`, flags: MessageFlags.Ephemeral }).catch();
        });

        collector.on("end", async () => {
            await action.edit(sent, { components: (sent as Message).components.slice(0, 1) as action.TopLevelComponent[], components_v2: true });
        });
    }
);

export default subcommand;
