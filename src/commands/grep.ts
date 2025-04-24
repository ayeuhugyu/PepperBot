import { Collection, Message } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../lib/classes/command_enums";

const command = new Command(
    {
        name: 'grep',
        description: 'searches for a string in the piped text',
        long_description: 'searches for a string in the piped text. this command is purely for piping to, and will not work on its own.',
        tags: [CommandTag.Utility, CommandTag.TextPipable],
        options: [
            new CommandOption({
                name: 'search',
                description: 'the text to search for',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        input_types: [InvokerType.Message],
        pipable_to: [CommandTag.TextPipable],
        example_usage: "p/git log | grep months",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["search"]),
    async function execute ({ invoker, piped_data, guild_config, args }) {
        if (!piped_data?.data) {
            await action.reply(invoker, { content: "this command must be piped", ephemeral: guild_config.other.use_ephemeral_replies})
            return new CommandResponse({
                error: true,
                message: "this command must be piped",
            });
        }
        if (piped_data.data.input_text) {
            const lines = piped_data.data.input_text.split("\n");
            let search = args.search
            if (!search) {
                await action.reply(invoker, { content: "no search term provided", ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: "no search term provided",
                });
            }
            let count = false;
            if (search.includes("-c") && !search.includes("\\-c")) {
                search = search.replace("-c", "");
                count = true
            }
            const regex = /\/(.*?[^\\])\/([gimsuy]*)/g;
            const regexMatches = [...search.matchAll(regex)].map(match => ({ pattern: match[1], flags: match[2] }));
            if (regexMatches.length > 0) {
                const { pattern: regexSearch, flags } = regexMatches[0];
                try {
                    const r = new RegExp(regexSearch, flags);
                    const found = lines.filter((line: string) => line.match(r));
                    const captureGroups = lines.map((line: string) => {
                        const match = line.match(r);
                        if (match) {
                            return match.slice(1).join(", ");
                        }
                    });
                    if (found.length === 0) {
                        await action.reply(invoker, { content: `no text found for regex: \`${regexSearch}\` with flags: \`${flags}\``, ephemeral: guild_config.other.use_ephemeral_replies });
                        return new CommandResponse({
                            error: true,
                            message: `no text found for regex: \`${regexSearch}\` with flags: \`${flags}\``,
                        });
                    }
                    found.unshift(`found text: \`\`\`\n`)
                    if (captureGroups.length > 0) {
                        found.unshift(`captured: \`\`\`\n${captureGroups.filter((value: string | undefined) => (value != undefined) && value.length > 0).join(", ")}\`\`\``);
                    }
                    found.push("```");
                    found.unshift(`regex search: \`${regexSearch}\`; flags: \`${flags || "no flags found"}\`\n`);
                    await action.reply(invoker, { content: count ? found.length : found.join("\n"), ephemeral: guild_config.other.use_ephemeral_replies });
                    return new CommandResponse({ pipe_data: { input_text: found.join("\n") } });
                } catch (e: any) {
                    await action.reply(invoker, { content: `invalid regex (${regexSearch}): ${e.message}`, ephemeral: guild_config.other.use_ephemeral_replies });
                    return new CommandResponse({
                        error: true,
                        message: `invalid regex (${regexSearch}): ${e.message}`,
                    });
                }
            }
            const found = lines.filter((line: string) => line.includes(search));
            if (found.length === 0) {
                await action.reply(invoker, { content: `no text found for search: \`${search}\``, ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: `no text found for search: \`${search}\``,
                });
            }
            found.unshift(`content: \`\`\`\n`)
            found.unshift(`search: \`${search}\`\n`);
            found.push("```");
            await action.reply(invoker, { content: count ? found.length : found.join("\n"), ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({ pipe_data: { input_text: found.join("\n") } });
        } else {
            await action.reply(invoker, { content: "no grep text found", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "no grep text found",
            });
        }
    }
);

export default command;