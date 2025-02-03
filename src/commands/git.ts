import { Command, CommandCategory, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import simpleGit from "simple-git";

const command = new Command(
    {
        name: 'git',
        description: 'returns the github repo for the bot',
        long_description: 'returns the github repo for the bot',
        category: CommandCategory.Info,
        pipable_to: ['grep'],
    }, 
    async function getArguments () {
        return undefined;
    },
    async function execute ({ message, piped_data, will_be_piped, guildConfig }) {
        await action.reply(message, { content: "the public repo for this bot can be found at https://github.com/ayeuhugyu/PepperBot/", ephemeral: guildConfig.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { grep_text: "the public repo for this bot can be found at https://github.com/ayeuhugyu/PepperBot/" }});
    }
);

export default command;