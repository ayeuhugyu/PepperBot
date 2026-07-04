import { Message } from "discord.js";
import { FormattedCommandInteraction } from "../../lib/classes/command";
import database from "../../lib/data_manager";
import { AnyPrompt } from "../../lib/gpt/promptManager";
import { GuildConfig } from "../../lib/guild_config_manager";
import * as action from "../../lib/discord_action";

export async function deletePromptCommand(prompt: AnyPrompt, invoker: FormattedCommandInteraction | Message<true>, guild_config: GuildConfig) {
    await prompt.delete();

    const overrideData = await database("gpt_starting_data_overrides").where({ user_id: invoker.author.id }).first();
    const editingData = await database("prompt_editing_metadata").where({ user: invoker.author.id }).first();
    const defaultPromptData = await database("prompt_defaults").where({ user_id: invoker.author.id }).first();

    let didRemoveOverride = false;
    if ((overrideData?.prompt_author_id == invoker.author.id) && (overrideData?.prompt_name == prompt.name)) {
        await database("gpt_starting_data_overrides").update({ prompt_name: "default", prompt_author_id: invoker.client.user.id }).where({ user_id: invoker.author.id });
        didRemoveOverride = true;
    }

    let didRemoveEditing = false;
    if ((editingData?.editingPrompt == prompt.name)) {
        await database("prompt_editing_metadata").where({ user: invoker.author.id }).delete();
        didRemoveEditing = true;
    }

    let didRemoveDefaultPrompt = false;
    if ((defaultPromptData?.prompt_name === prompt.name) && (defaultPromptData?.author_id === invoker.author.id)) {
        await database("prompt_defaults").where({ user_id: invoker.author.id }).delete();
        didRemoveDefaultPrompt = true;
    }

    const updatedConversationCount = await database("gpt_conversation_meta").update({ prompt_author_id: invoker.client.user.id, prompt_name: "default" }).where({ prompt_author_id: invoker.author.id, prompt_name: prompt.name });

    await action.reply(invoker, { content: `deleted prompt: \`${prompt.name}\`\n${didRemoveOverride ? `\nthe next conversation you enter will no longer be set to use \`${prompt.name}\`` : ""}${didRemoveEditing ? `\nyou are no longer editing \`${prompt.name}\`` : ""}${didRemoveDefaultPrompt ? `\nyour default prompt has been reset back to the official default prompt and will no longer use \`${prompt.name}\`` : ""}${(updatedConversationCount > 0) ? `\n${updatedConversationCount} conversation${(updatedConversationCount > 1) ? "s had their prompts" : " had its prompt"} reverted to the default prompt instead of \`${prompt.name}\`` : ""}`, ephemeral: guild_config.other.use_ephemeral_replies });
}
