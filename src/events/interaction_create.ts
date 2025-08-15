import { ApplicationCommandOptionType, ChatInputCommandInteraction, CommandInteractionOption, Events, Interaction } from "discord.js";
import { Command, CommandInput, FormattedCommandInteraction } from "../lib/classes/command";
import commands from "../lib/command_manager";
import * as log from "../lib/log";
import { isMaintenanceModeActive, getMaintenanceEndTimestamp } from "../lib/maintenance_manager";
import { CommandAccessTemplates } from "../lib/templates";
import { fetchGuildConfig } from "../lib/guild_config_manager";

async function commandHandler(interaction: ChatInputCommandInteraction) {
    log.info(`recieved interaction command "${interaction.commandName}"`);
    log.debug(`recieved interaction command "${interaction.commandName}" from ${interaction.user.username} in <#${interaction.channel?.id}>`);

    // check maintenance mode
    if (await isMaintenanceModeActive()) {
        const isDevUser = CommandAccessTemplates.dev_only.whitelist.users.includes(interaction.user.id);

        if (!isDevUser) {
            const guildConfig = await fetchGuildConfig(interaction.guild?.id);
            const endTimestamp = getMaintenanceEndTimestamp();
            const endMessage = endTimestamp ?
                ` expected end time: <t:${endTimestamp}:t> (<t:${endTimestamp}:R>)` :
                "";

            await interaction.reply({
                content: `bot is currently in maintenance mode, meaning you cannot use it.${endMessage}`,
                ephemeral: guildConfig.other.use_ephemeral_replies
            });
            return;
        }
    }

    const command = commands.get(interaction.commandName);
    if (!command) {
        log.warn(`invalid interaction command "${interaction.commandName}"`);
        return;
    }

    const args = {} as Record<string, unknown>
    const stack = Array.from(interaction.options.data);

    log.debug(`parsing ${stack.length} interaction arguments`)
    while (stack.length !== 0) {
        const option = stack.pop()!;

        switch (option.type) {
            case ApplicationCommandOptionType.Subcommand: { args[command.subcommand_argument] = option.name; stack.push(...option.options!); break }
            case ApplicationCommandOptionType.SubcommandGroup: { log.warn("subcommand groups unimplemented"); break }
            case ApplicationCommandOptionType.Attachment: { args[option.name] = option.attachment; break }
            case ApplicationCommandOptionType.Boolean: { args[option.name] = option.value; break }
            case ApplicationCommandOptionType.Channel: { args[option.name] = option.channel; break }
            case ApplicationCommandOptionType.Integer: { args[option.name] = option.value; break }
            case ApplicationCommandOptionType.Mentionable: { args[option.name] = option.role ?? option.user; break }
            case ApplicationCommandOptionType.Number: { args[option.name] = option.value; break }
            case ApplicationCommandOptionType.Role: { args[option.name] = option.role; break }
            case ApplicationCommandOptionType.String: { args[option.name] = option.value; break }
            case ApplicationCommandOptionType.User: { args[option.name] = option.user; break }
        }
    }
    log.debug(`parsed interaction arguments: ${Object.entries(args).map(([k, v]) => `${k}: ${v}`).join(", ")}`)

    const authored = Object.assign(interaction, { author: interaction.user }) as FormattedCommandInteraction;
    const input = await CommandInput.new(authored, command as Command<any>, args, { will_be_piped: false }, commands)

    command?.execute(input);
}

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (interaction.isChatInputCommand()) {
            return commandHandler(interaction)
        }
    }
}