import { Message, InteractionResponse, ButtonInteraction } from "discord.js";
import { FormattedCommandInteraction } from "../../../lib/classes/command";
import { Container, ActionRow, TextDisplay, Separator, Button, ButtonStyle } from "../../../lib/classes/components";
import * as action from "../../../lib/discord_action";
import { models } from "../../../lib/gpt/models";
import { AnyModel } from "../../../lib/gpt/modelTypes";
import { AnyPrompt } from "../../../lib/gpt/promptManager";
import * as log from "../../../lib/log";
import { refreshMainPromptEmbed } from "./refreshMainPromptEmbed";

function refreshModelSelector(currentModel: AnyModel) {
    const components: (Container | ActionRow)[] = [
        new Container({
            components: [
                new TextDisplay({
                    content: "## select a model",
                }),
                new Separator(),
                new TextDisplay({
                    content: `**__${currentModel.name}__** (${currentModel.provider})\n${currentModel.description}\n\n**capabilities:** \`${currentModel.capabilities.join("\`, \`")}\`\n**parameters:** \`${Object.keys(currentModel.parameters).join("\`, \`")}\``
                })
            ]
        }),
    ];
    for (let i = 0; i < Math.ceil(Object.values(models).length / 5); i++) {
        components.push(new ActionRow({ components: [] }));
    }

    Object.values(models).forEach((model, i) => {
        (components[1 + Math.floor(i / 5)] as ActionRow).components.push(new Button({
            custom_id: `selectModel_${model.name}`,
            label: model.name,
            style: (model.name === currentModel.name) ? ButtonStyle.Success : (model.name === "gpt-4.1-nano" ? ButtonStyle.Primary : ButtonStyle.Secondary),
            disabled: model.name === currentModel.name
        }));
    });

    components.push(new ActionRow({
        components: [
            new Button({
                style: ButtonStyle.Danger,
                label: "back",
                custom_id: `allTheWayBack`,
            }),
        ]
    }));

    return components;
}

export async function startConfiguringModel(sent: Message<true> | InteractionResponse<boolean>, prompt: AnyPrompt, invoker: FormattedCommandInteraction | Message<true>) {
    await action.edit(sent, {
        components: refreshModelSelector(prompt.model),
        components_v2: true
    });

    let currentModel = prompt.model;

    try {
        const modelCollector = sent.createMessageComponentCollector({ filter: (c) => c.user.id === invoker.author.id, time: 15000 * 60 });
        let noeditend = false;
        modelCollector.on("collect", async (interaction: ButtonInteraction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId == "allTheWayBack") {
                noeditend = true;
                modelCollector.stop();
                return;
            }

            const [selectModel, modelName] = interaction.customId.split("_");
            if (selectModel == "selectModel") {
                const model = Object.values(models).find(m => m.name === modelName);
                if (!model) {
                    currentModel = models['gpt-4.1-nano'];
                } else {
                    currentModel = model;
                }
            }

            prompt.model = currentModel;
            await prompt.write();
            await action.edit(sent, {
                components: refreshModelSelector(currentModel),
                components_v2: true
            });
            await interaction.deferUpdate();
        });

        modelCollector.on("end", async () => {
            if (!noeditend) await action.edit(sent, { components: await refreshMainPromptEmbed(prompt), components_v2: true });
        });
    } catch (err) {
        // Collector received no interactions before ending with reason: time
        // literally satanic invention
        log.error(err);
    }

    return;
}
