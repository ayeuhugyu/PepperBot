import { Collection, Message } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import simpleGit from "simple-git";
import { textToAttachment } from "../lib/attachment_manager";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, SubcommandDeploymentApproach } from "../lib/classes/command_enums";

const git_log = new Command({
        name: 'log',
        description: 'returns the git log of the repo',
        long_description: 'creates a graph of all commits to the github repository',
        tags: [CommandTag.Info],
        pipable_to: [CommandTag.TextPipable],
        root_aliases: ['gitlog'],
        example_usage: "p/git log",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute ({ invoker, guild_config }) {
        const git = simpleGit();
        const log = await git.log(['--graph', '--abbrev-commit', '--decorate', '--format=format:"%C(bold blue)%h%C(reset) - %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(dim white)- %an%C(reset)%C(auto)%d%C(reset)"', '--all']);
        const logString = log.all[0].hash
        const attachment = await textToAttachment(logString, 'gitlog.txt');
        await action.reply(invoker, { content: "here's a log of commits to the repo", files: [attachment], ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { input_text: `here's a log of commits to the repo\n${logString}` } });
    }
);

const command = new Command(
    {
        name: 'git',
        description: 'returns the github repo for the bot',
        long_description: 'returns the github repo for the bot',
        tags: [CommandTag.Info],
        pipable_to: [],
        argument_order: "<subcommand>",
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [git_log],
            self: "git",
        },
        options: [],
        example_usage: "p/git",
        aliases: ["github", "openpepper", "repo"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, guild_config, args }) {
        const content = (args.subcommand ? `${args.subcommand} isnt a valid subcommand. anyways, ` : "") + "the public repo for this bot can be found at https://github.com/ayeuhugyu/PepperBot/";
        await action.reply(invoker, { content: content, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

export default command;