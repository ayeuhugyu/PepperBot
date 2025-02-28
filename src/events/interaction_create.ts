import { ApplicationCommandOptionType, ChatInputCommandInteraction, CommandInteractionOption, Events, Interaction } from "discord.js";
import { Command, CommandInput, FormattedCommandInteraction } from "../lib/classes/command";
import commands from "../lib/command_manager";
import * as log from "../lib/log";

async function commandHandler(interaction: ChatInputCommandInteraction) {
    const command = commands.get(interaction.commandName);
    if (!command) {
        log.warn(`invalid interaction command "${interaction.commandName}"`);
        return;
    }

    const args = {} as Record<string, unknown>
    const stack = Array.from(interaction.options.data);

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

    const authored = Object.assign(interaction, { author: interaction.user }) as FormattedCommandInteraction;
    const input = await CommandInput.new(authored, command as Command<any>, args, { will_be_piped: false })

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