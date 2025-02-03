import { Collection, Message } from "discord.js";
import { Command, CommandCategory, CommandOption, CommandOptionType, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";

const command = new Command(
    {
        name: 'grep',
        description: 'searches for a string in the piped text',
        long_description: 'searches for a string in the piped text',
        category: CommandCategory.Utility,
        options: [
            new CommandOption({
                name: 'search',
                description: 'the text to search for',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        pipable_to: ['grep'],
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
            const search = args?.get("search");
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