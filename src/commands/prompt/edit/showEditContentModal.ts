import { ButtonInteraction, CacheType, InteractionResponse, LabelBuilder, Message, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { AnyPrompt } from "../../../lib/gpt/promptManager";
import { GuildConfig } from "../../../lib/guild_config_manager";
import { TextDisplay } from "../../../lib/classes/components";
import * as action from "../../../lib/discord_action";
import { refreshMainPromptEmbed } from "./refreshMainPromptEmbed";

export async function showEditContentModal(prompt: AnyPrompt, interaction: ButtonInteraction<CacheType>, sent: Message<true> | InteractionResponse<boolean>, guild_config: GuildConfig, ) {
    const data_input = new TextInputBuilder()
        .setCustomId('data_input')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("enter prompt content")
        .setValue(prompt.content.slice(0, 1999))
        .setRequired(true);

    const label = new LabelBuilder()
        .setLabel("content")
        .setTextInputComponent(data_input);

    const modal = new ModalBuilder()
        .setCustomId(`editContentModal`)
        .setTitle(`edit ${prompt.name}'s content`)
        .addTextDisplayComponents(new TextDisplay({
            content: `edit ${prompt.name}'s content\nneed bigger than this? you can use \`${guild_config.other.prefix}prompt set\` with text attachments to achieve ~~Un-~~ Less-limited prompt sizes`,
        }))
        .addLabelComponents(label);

    interaction.showModal(modal);
    const response = await interaction.awaitModalSubmit({ time: 15000 * 60 }).catch(() => {});
    if (!response) return;

    prompt.content = response.fields.getTextInputValue("data_input");
    await prompt.write();
    await action.edit(sent, { components: await refreshMainPromptEmbed(prompt), components_v2: true });
    await response.reply({ content: `prompt content of \`${prompt.name}\` set to \`\`\`\n${prompt.content.slice(0, 1500)}\`\`\`\nyour next conversation will also now use this prompt.${(prompt.content.split(" ").length < 15) ? `\n\ni suspect your prompt is too short to cause any meaningful change, consider using \`${guild_config.other.prefix}prompt generate\` to make it longer.` : ""}`, flags: MessageFlags.Ephemeral });

    return;
}
