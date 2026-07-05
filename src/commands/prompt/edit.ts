import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse, FormattedCommandInteraction } from "../../lib/classes/command";
import * as action from "../../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../../lib/classes/command_enums";
import { AnyPrompt, getEditingPrompt, listPrompts, Prompt, setActivePrompt, setEditingPrompt } from "../../lib/gpt/promptManager";
import { ActionRow, Button, ButtonStyle, Container, Section, Separator, TextDisplay } from "../../lib/classes/components";
import database from "../../lib/data_manager";
import { ButtonInteraction, CacheType, LabelBuilder, Message, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { ZodDefault, ZodCoercedNumber } from "zod";
import { Model } from "../../lib/gpt/modelTypes";
import { GuildConfig } from "../../lib/guild_config_manager";
import * as log from "../../lib/log";
import { confirmDeletePrompt } from "./edit/confirmDeletePrompt";
import { showEditContentModal } from "./edit/showEditContentModal";
import { startConfiguringParameters } from "./edit/startConfiguringParameters";
import { startConfiguringModel } from "./edit/startConfiguringModel";
import { refreshMainPromptEmbed } from "./edit/refreshMainPromptEmbed";
import { createNewPrompt } from "./edit/createNewPrompt";
import { startConfiguringTools } from "./edit/startConfiguringTools";

const command = new Command(
    {
        name: 'edit',
        description: 'edit one of your prompts',
        long_description: 'allows you to edit various aspects of your prompts',
        tags: [CommandTag.AI],
        pipable_to: [CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'name',
                description: 'the name of the prompt to edit',
                long_description: 'the name of the prompt to edit',
                type: CommandOptionType.String,
                required: false,
            })
        ],
        access: CommandAccessTemplates.public,
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: [
            "p/prompt edit",
            "p/prompt edit my prompt"
        ],
        aliases: ["build", "builder"],
        argument_order: "<name?>"
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["name"]),
    async function execute ({ invoker, args, guild_config }) {
        // this logic is very hard to follow im sorry
        let name = args.name;
        let promptOptional: AnyPrompt | undefined;
        let prompt: AnyPrompt;
        if (name) {
            // if the user provided a name, try to fetch that prompt.
            promptOptional = await Prompt.fromName(invoker.author.id, args.name);
        } else {
            // if the user did not provide a name, try to use their default editing prompt
            promptOptional = await getEditingPrompt(invoker.author.id);
            if (!promptOptional) {
                // if they are not editing any prompts, set name to autosave (will be created later)
                name = "autosave";
            }
        }
        if (!promptOptional) {
            // if the prompt does not exist yet, create it
            promptOptional = await Prompt.new(name.replaceAll(/[`\n]/g, " "), invoker.author);
            await promptOptional.write();
        }
        prompt = promptOptional as AnyPrompt;

        await setEditingPrompt(invoker.author.id, prompt.name);
        const sent = await action.reply(invoker, { components: await refreshMainPromptEmbed(prompt), components_v2: true, ephemeral: guild_config.other.use_ephemeral_replies });
        if (!sent) return;

        try {
            const collector = sent.createMessageComponentCollector({ filter: (c) => c.user.id === invoker.author.id, time: 30_000 * 60 });

            collector.on("collect", async (interaction: ButtonInteraction) => {
                if (!interaction.isButton()) return;

                switch (interaction.customId) {
                    case "allTheWayBack":
                        await interaction.deferUpdate();
                        await action.edit(sent, { components: await refreshMainPromptEmbed(prompt), components_v2: true });
                        return;
                    case "createNewPrompt": // create a new prompt
                        let createdPrompt = await createNewPrompt(interaction, sent, guild_config);
                        if (createdPrompt != undefined) prompt = createdPrompt as AnyPrompt;
                    break;
                    case "toggleIsDefault": // toggle whether this is the default prompt
                        if ((await database("prompt_defaults").where({ user_id: invoker.author.id }).first())?.prompt_name == prompt.name) {
                            await database("prompt_defaults").where({ user_id: invoker.author.id }).delete();
                            await interaction.reply({ content: `reverted your default prompt; new conversations will now use the official default prompt`, flags: MessageFlags.Ephemeral });
                            await action.edit(sent, { components: await refreshMainPromptEmbed(prompt), components_v2: true });
                            return;
                        } else {
                            await database("prompt_defaults").insert({ user_id: invoker.author.id, author_id: prompt.author.id, prompt_name: prompt.name }).onConflict("user_id").merge();
                            await interaction.reply({ content: `set your default prompt to \`${prompt.name}\`; new conversations will now use \`${prompt.name}\``, flags: MessageFlags.Ephemeral });
                            await action.edit(sent, { components: await refreshMainPromptEmbed(prompt), components_v2: true });
                            return;
                        }
                    case "setAsActivePrompt": // set as the current active prompt
                        return await setAsActivePrompt(invoker, prompt, interaction);
                    case "deletePrompt1": // delete this prompt
                        return await confirmDeletePrompt(interaction, prompt, guild_config, collector);
                    case "startConfiguringParameters": // start configuring parameters
                        await interaction.deferUpdate();
                        return await startConfiguringParameters(sent, prompt, invoker);
                    case "startConfiguringTools": // start configuring tools
                        await interaction.deferUpdate();
                        return await startConfiguringTools(sent, prompt, invoker);
                    case "startConfiguringModel": // start configuring the model
                        await interaction.deferUpdate();
                        return await startConfiguringModel(sent, prompt, invoker);
                    case "editContent": // edit the content
                        return await showEditContentModal(prompt, interaction, sent, guild_config);
                }
            });

            collector.on("end", async () => {
                await action.edit(sent, { components: await refreshMainPromptEmbed(prompt, true), components_v2: true });
            });
        } catch (err) {
            // fuckass Error: Collector received no interactions before ending with reason: time
            // whoever added this error is on my kos
            log.error(err);
        }
    }
);

export default command;

async function setAsActivePrompt(invoker: FormattedCommandInteraction | Message<true>, prompt: AnyPrompt, interaction: ButtonInteraction<CacheType>) {
    await setEditingPrompt(invoker.author.id, prompt.name);
    await setActivePrompt(invoker.author.id, invoker.author.id, prompt.name);

    await interaction.reply({ content: `now using/editing prompt \`${prompt.name}\`. the next conversation you enter will use \`${prompt.name}\` as its prompt.`, flags: MessageFlags.Ephemeral });
    return;
}