import { ButtonInteraction, CacheType, InteractionResponse, LabelBuilder, Message, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { AnyPrompt, Prompt, setEditingPrompt } from "../../../lib/gpt/promptManager";
import { GuildConfig } from "../../../lib/guild_config_manager";
import { TextDisplay } from "../../../lib/classes/components";
import * as action from "../../../lib/discord_action";
import { refreshMainPromptEmbed } from "./refreshMainPromptEmbed";

export async function createNewPrompt(interaction: ButtonInteraction<CacheType>, sent: Message<true> | InteractionResponse<boolean>, guild_config: GuildConfig) {
    const data_input = new TextInputBuilder()
        .setCustomId('data_input')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("enter new prompt name")
        .setRequired(true);

    const label = new LabelBuilder()
        .setLabel("name")
        .setTextInputComponent(data_input);

    const modal = new ModalBuilder()
        .setCustomId(`newPromptName`)
        .setTitle(`create new prompt`)
        .addTextDisplayComponents(new TextDisplay({
            content: `enter the new prompt's name`,
        }))
        .addLabelComponents(label);

    interaction.showModal(modal);
    const response = await interaction.awaitModalSubmit({ time: 15 * 60 * 60 });

    let name = response.fields.getTextInputValue("data_input");
    if (await Prompt.checkExists(interaction.user.id, name)) {
        await response.reply({ content: `cannot create prompt; you already have a prompt named \`${name}\`. if you would like to edit that prompt instead, use \`${guild_config.other.prefix}prompt edit ${name}\``, flags: MessageFlags.Ephemeral });
        return undefined;
    }

    const prompt = await Prompt.new(name.replaceAll(/[`\n]/g, " "), interaction.user);
    await prompt.write();
    await setEditingPrompt(interaction.user.id, prompt.name);
    await action.edit(sent, { components: await refreshMainPromptEmbed(prompt), components_v2: true });
    await response.reply({ content: `created new prompt: \`${prompt.name}\`. you are now editing prompt \`${prompt.name}\`.`, flags: MessageFlags.Ephemeral });
    return prompt;
}
