import { Collection, Message } from "discord.js";
import { Command, CommandCategory, CommandOption, CommandOptionType, CommandResponse, InputType } from "../lib/classes/command";
import * as action from "../lib/discord_action";

const command = new Command(
    {
        name: 'grep',
        description: 'searches for a string in the piped text',
        long_description: 'searches for a string in the piped text. this command is purely for piping to, and will not work on its own.',
        category: CommandCategory.Utility,
        options: [
            new CommandOption({
                name: 'search',
                description: 'the text to search for',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        input_types: [InputType.Message],
        deployed: false,
        pipable_to: ['grep'],
        example_usage: "p/git log | grep months",
    }, 
    async function getArguments ({ message, self, guildConfig }) {
        message = message as Message;
        const args = new Collection();
        const commandLength = `${guildConfig.other.prefix}${self.name}`.length;
        const search = message.content.slice(commandLength)?.trim();
        args.set('search', search);
        return args;
    },
    async function execute ({ message, piped_data, guildConfig, args }) {
        if (!piped_data?.data) {
            await action.reply(message, { content: "this command must be piped", ephemeral: guildConfig.other.use_ephemeral_replies})
            return new CommandResponse({ pipe_data: { grep_text: "this command must be piped" } });
        }
        if (piped_data.data.grep_text) {
            const lines = piped_data.data.grep_text.split("\n");
            let search = args?.get("search");
            if (!search) {
                await action.reply(message, { content: "no search term provided", ephemeral: guildConfig.other.use_ephemeral_replies });
                return new CommandResponse({ pipe_data: { grep_text: "no search term provided" } });
            }
            let count = false;
            if (search.includes("-c") && !search.includes("\\-c")) {
                search = search.replace("-c", "");
                count = true
            }
            const regex = /\/(.*?)\//g;
            const regexMatches = [...search.matchAll(regex)].map(match => match[1]);
            if (regexMatches.length > 0) {
                const regexSearch = regexMatches[0];
                try {
                    const r = new RegExp(regexSearch);
                    const found = lines.filter((line: string) => line.match(r));
                    await action.reply(message, { content: count ? found.length : found.join("\n"), ephemeral: guildConfig.other.use_ephemeral_replies });
                    return new CommandResponse({ pipe_data: { grep_text: found.join("\n") } });
                } catch (e: any) {
                    await action.reply(message, { content: "invalid regex: " + e.message, ephemeral: guildConfig.other.use_ephemeral_replies });
                    return new CommandResponse({ pipe_data: { grep_text: "invalid regex: " + e.message } });
                }
            }
            const found = lines.filter((line: string) => line.includes(search));
            await action.reply(message, { content: found.join("\n"), ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({ pipe_data: { grep_text: found.join("\n") } });
        } else {
            await action.reply(message, { content: "no grep text found", ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({ pipe_data: { grep_text: "no grep text found" } });
        }
    }
);

export default command;