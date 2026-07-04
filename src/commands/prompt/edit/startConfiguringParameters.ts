import { Message, InteractionResponse, ButtonInteraction, MessageFlags } from "discord.js";
import { FormattedCommandInteraction } from "../../../lib/classes/command";
import { ActionRow, Button, ButtonStyle } from "../../../lib/classes/components";
import * as action from "../../../lib/discord_action";
import { AnyPrompt } from "../../../lib/gpt/promptManager";
import * as log from "../../../lib/log";
import { baseConfiguratorContent, makeModelRefresher, makePromptRefresher, handleConfiguratorButtons, extractRefreshFunction, createConfiguratorInputModal, parseConfiguratorInput } from "../../ai-shared/configureParameters";
import { refreshMainPromptEmbed } from "./refreshMainPromptEmbed";

export async function startConfiguringParameters(sent: Message<true> | InteractionResponse<boolean>, prompt: AnyPrompt, invoker: FormattedCommandInteraction | Message<true>, ) {
    let baseContent = JSON.parse(JSON.stringify(baseConfiguratorContent));
    baseContent.push(new ActionRow({
        components: [
            new Button({
                style: ButtonStyle.Danger,
                label: "back",
                custom_id: `allTheWayBack`,
            }),
        ]
    }));

    await action.edit(sent, {
        components: baseContent,
        components_v2: true
    });

    let cachedParams = {
        modelParameters: prompt.modelParameters,
        promptParameters: prompt.promptParameters,
    };

    const getModelParameters = () => {
        return cachedParams.modelParameters;
    };
    const getPromptParameters = () => {
        return cachedParams.promptParameters;
    };

    const refreshModelParameters = makeModelRefresher(sent, prompt.model, getModelParameters);
    const refreshPromptParameters = makePromptRefresher(sent, getPromptParameters);

    try {
        const parameterCollector = sent.createMessageComponentCollector({ filter: (c) => c.user.id === invoker.author.id, time: 15000 * 60 });
        let noeditend = false;
        parameterCollector.on("collect", async (interaction: ButtonInteraction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId == "allTheWayBack") {
                noeditend = true;
                parameterCollector.stop();
                return;
            }

            const shouldReturn = await handleConfiguratorButtons(interaction, refreshModelParameters, refreshPromptParameters, sent, baseContent);
            if (shouldReturn) return;

            let { currentValue, editingType, key, schema, overrideType, refreshFunction } = extractRefreshFunction(interaction, refreshModelParameters, refreshPromptParameters, prompt.model, getModelParameters, getPromptParameters);

            const modal = createConfiguratorInputModal(currentValue, editingType, key, schema);

            interaction.showModal(modal);
            const response = await interaction.awaitModalSubmit({ time: 15 * 60 * 60 });

            const parsed = await parseConfiguratorInput(response, schema);
            if (!parsed) return;

            (prompt[`${overrideType}Parameters`] as any)[schema?.key as unknown as any] = parsed.data;
            (cachedParams[`${overrideType}Parameters`] as any)[schema?.key as unknown as any] = parsed.data;
            await prompt.write();
            await refreshFunction();
            await response.reply({ content: `set value of ${key} to \`${JSON.stringify(parsed.data)}\`.`, flags: MessageFlags.Ephemeral });
        });

        parameterCollector.on("end", async () => {
            if (!noeditend) await action.edit(sent, { components: await refreshMainPromptEmbed(prompt), components_v2: true });
        });
    } catch (err) {
        // Collector received no interactions before ending with reason: time
        // literally satanic invention
        log.error(err);
    }

    return;
}
