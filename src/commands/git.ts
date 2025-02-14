import { Collection, Message } from "discord.js";
import { Command, CommandCategory, CommandOption, CommandOptionType, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import simpleGit from "simple-git";
import { textToFile } from "../lib/filify";

const gitlog = new Command({
        name: 'log',
        description: 'returns the git log of the repo',
        long_description: 'creates a graph of all commits to the github repository',
        category: CommandCategory.Info,
        pipable_to: ['grep'],
        normal_aliases: ['gitlog'],
        subcommands: [],
        example_usage: "p/git log",
    }, 
    async function getArguments () {
        return undefined;
    },
    async function execute ({ message, guildConfig }) {
        const git = simpleGit();
        const log = await git.log(['--graph', '--abbrev-commit', '--decorate', '--format=format:"%C(bold blue)%h%C(reset) - %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(dim white)- %an%C(reset)%C(auto)%d%C(reset)"', '--all']);
        const logString = log.all[0].hash
        const path = await textToFile(logString, 'gitlog');
        await action.reply(message, { content: "here's a log of commits to the repo", files: [path], ephemeral: guildConfig.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { grep_text: `here's a log of commits to the repo\n${logString}` } });
    }
);

const command = new Command(
    {
        name: 'git',
        description: 'returns the github repo for the bot',
        long_description: 'returns the github repo for the bot',
        category: CommandCategory.Info,
        pipable_to: ['grep'],
        argument_order: "<subcommand>",
        subcommands: [
            gitlog
        ],
        options: [
            new CommandOption({
                name: 'subcommand',
                description: 'the subcommand to run',
                type: CommandOptionType.String,
                required: false,
                choices: [ { name: 'log', value: 'log' } ]
            })
        ],
        example_usage: "p/git",
        aliases: ["github", "openpepper", "repo"]
    }, 
    async function getArguments ({ message, self, guildConfig }) {
        message = message as Message;
        const args = new Collection();
        const commandLength = `${guildConfig.other.prefix}${self.name}`.length;
        const search = message.content.slice(commandLength)?.trim();
        args.set('subcommand', search);
        return args;
    },
    async function execute ({ message, guildConfig, args }) {
        const content = (args?.get("subcommand") ? `${args.get("subcommand")} isnt a valid subcommand. anyways, ` : "") + "the public repo for this bot can be found at https://github.com/ayeuhugyu/PepperBot/";
        await action.reply(message, { content: content, ephemeral: guildConfig.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

export default command;