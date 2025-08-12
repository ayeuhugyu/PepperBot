import { Collection, Message } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { CommandTag, InvokerType, CommandOptionType } from "../lib/classes/command_enums";

const command = new Command(
    {
        name: 'tail',
        description: 'outputs the last few lines or bytes of the piped text',
        long_description: 'outputs the last few lines or bytes of the piped text. \nthis command is purely for piping to, and will not work on its own.',
        tags: [CommandTag.Utility, CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'options',
                description: 'arguments for tail command (e.g., -n 10 or -c 20)',
                long_description: 'arguments to be used, e.g. -n 10 to output the last 10 lines or -c 20 to output the last 20 bytes',
                type: CommandOptionType.String,
                required: false,
            })
        ],
        input_types: [InvokerType.Message],
        pipable_to: [CommandTag.TextPipable],
        example_usage: "p/git log | tail -n 10",
    },
    async function getArguments({ invoker }: { invoker: Message }) {
        const args = invoker.content.split(" ").slice(1); // Extract arguments after the command name
        const options: Record<string, string | undefined> = {};
        for (let i = 0; i < args.length; i++) {
            if (args[i].startsWith("-")) {
                options[args[i]] = args[i + 1];
                i++; // Skip the next value as it's part of the current option
            }
        }
        return options;
    },
    async function execute({ invoker, piped_data, guild_config, args, will_be_piped }) {
        if (!piped_data?.data) {
            await action.reply(invoker, { content: "this command must be piped", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "this command must be piped",
            });
        }
        if (piped_data.data.input_text) {
            const inputText = piped_data.data.input_text;
            const linesArg = args["-n"];
            const bytesArg = args["-c"];

            if (linesArg || !bytesArg) {
                const numLines = parseInt(linesArg || "10", 10); // Default to 10 lines
                if (isNaN(numLines) || numLines <= 0) {
                    await action.reply(invoker, { content: "invalid number of lines specified", ephemeral: guild_config.other.use_ephemeral_replies });
                    return new CommandResponse({
                        error: true,
                        message: "invalid number of lines specified",
                    });
                }
                const lines = inputText.split("\n");
                const output = lines.slice(-numLines);
                output.unshift(`tail: \`\`\`\n`);
                output.push("```");
                await action.reply(invoker, { content: output.join("\n"), ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({ pipe_data: { input_text: output.join("\n") } });
            } else if (bytesArg) {
                const numBytes = parseInt(bytesArg || "10", 10); // Default to 10 bytes
                if (isNaN(numBytes) || numBytes <= 0) {
                    await action.reply(invoker, { content: "invalid number of bytes specified", ephemeral: guild_config.other.use_ephemeral_replies });
                    return new CommandResponse({
                        error: true,
                        message: "invalid number of bytes specified",
                    });
                }
                const output = inputText.slice(-numBytes);
                await action.reply(invoker, { content: will_be_piped ? "piping tail" : `content: \`\`\`\n${output}\n\`\`\``, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({ pipe_data: { input_text: output } });
            }
        } else {
            await action.reply(invoker, { content: "no text found to tail", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "no text found to tail",
            });
        }
    }
);

export default command;
