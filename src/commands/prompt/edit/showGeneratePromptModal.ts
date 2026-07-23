import { ButtonInteraction, CacheType, InteractionResponse, LabelBuilder, Message, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { AnyPrompt, setActivePrompt } from "../../../lib/gpt/promptManager";
import { GuildConfig } from "../../../lib/guild_config_manager";
import { TextDisplay } from "../../../lib/classes/components";
import * as action from "../../../lib/discord_action";
import { refreshMainPromptEmbed } from "./refreshMainPromptEmbed";
import { generatePrompt } from "../../../lib/gpt/basic";

export async function showGenerateContentModal(prompt: AnyPrompt, interaction: ButtonInteraction<CacheType>, sent: Message<true> | InteractionResponse<boolean>, guild_config: GuildConfig, ) {
    const data_input = new TextInputBuilder()
        .setCustomId('data_input')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("enter initial prompt content")
        .setValue(prompt.content.slice(0, 1999))
        .setRequired(true);

    const label = new LabelBuilder()
        .setLabel("content")
        .setTextInputComponent(data_input);

    const modal = new ModalBuilder()
        .setCustomId(`generateContentModal`)
        .setTitle(`generate ${prompt.name}'s content`)
        .addTextDisplayComponents(new TextDisplay({
            content: `not wanting to write the whole prompt yourself? you can AI-generate its content using this menu, equivalent to \`${guild_config.other.prefix}prompt generate\``,
        }))
        .addLabelComponents(label);

    interaction.showModal(modal);
    const response = await interaction.awaitModalSubmit({ time: 15000 * 60 }).catch(() => {});
    if (!response) return;

    const deferred = await response.deferReply({ flags: MessageFlags.Ephemeral });

    const generatedContent = await generatePrompt(response.fields.getTextInputValue("data_input") as string);
    prompt.content = generatedContent ?? "[generated content was empty]";
    await prompt.write();
    await setActivePrompt(response.user.id, response.user.id, prompt.name);
    await action.edit(sent, { components: await refreshMainPromptEmbed(prompt), components_v2: true });
    await action.edit(deferred, { content: `prompt content of \`${prompt.name}\` set to \`\`\`\n${prompt.content.slice(0, 1500)}\`\`\`\nyour next conversation will also now use this prompt.${(prompt.content.split(" ").length < 15) ? `\n\ni suspect your prompt is too short to cause any meaningful change, consider using \`${guild_config.other.prefix}prompt generate\` to make it longer.` : ""}`, flags: MessageFlags.Ephemeral });

    return;
}
