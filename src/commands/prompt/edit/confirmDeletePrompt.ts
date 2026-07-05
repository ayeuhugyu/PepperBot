import { ButtonInteraction, CacheType, InteractionCollector, MessageFlags } from "discord.js";
import { FormattedCommandInteraction } from "../../../lib/classes/command";
import { TextDisplay, ActionRow, Button, ButtonStyle } from "../../../lib/classes/components";
import * as action from "../../../lib/discord_action";
import { AnyPrompt } from "../../../lib/gpt/promptManager";
import { GuildConfig } from "../../../lib/guild_config_manager";
import { deletePromptCommand } from "../../ai-shared/deletePromptCommand";

export async function confirmDeletePrompt(interaction: ButtonInteraction<CacheType>, prompt: AnyPrompt, guild_config: GuildConfig, collector: InteractionCollector<any>) {
    const confirmationMessage = (await interaction.reply({
        components: [
            new TextDisplay({
                content: `are you sure you want to delete prompt \`${prompt.name}\`? this action is **irreversible**`
            }),
            new ActionRow({
                components: [
                    new Button({
                        style: ButtonStyle.Danger,
                        label: "confirm delete",
                        custom_id: "confirm_delete_prompt",
                    }),
                    new Button({
                        style: ButtonStyle.Secondary,
                        label: "cancel",
                        custom_id: "cancel_delete_prompt",
                    }),
                ]
            })
        ],
        withResponse: true,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    })).resource?.message;

    if (!confirmationMessage) {
        interaction.reply({ content: "failed to find confirmation message", flags: MessageFlags.Ephemeral });
        return;
    }

    const confirmCollector = confirmationMessage.createMessageComponentCollector({ time: 120 * 1000 });
    let edited = false;

    confirmCollector.on("collect", async (confirmInteraction) => {
        if (confirmInteraction.customId === "confirm_delete_prompt") {
            await action.editReply(interaction as unknown as FormattedCommandInteraction, { components: [new TextDisplay({ content: `...` })], flags: MessageFlags.IsComponentsV2 });
            (confirmInteraction as any)["author"] = confirmInteraction.user;
            await deletePromptCommand(prompt, confirmInteraction as unknown as FormattedCommandInteraction, guild_config);
            edited = true;
            collector.stop();
            confirmCollector.stop();
        } else {
            await action.editReply(interaction as unknown as FormattedCommandInteraction, { components: [new TextDisplay({ content: `deletion cancelled` })], flags: MessageFlags.IsComponentsV2 });
            confirmInteraction.deferUpdate();
            edited = true;
            confirmCollector.stop();
        }
    });

    confirmCollector.on("end", async () => {
        if (!edited) {
            await interaction.editReply({ components: [new TextDisplay({ content: `confirmation timed out` })], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }
    });

    return;
}
