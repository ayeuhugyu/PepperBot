import { ayeuhugyu } from "../../constants/contributors.json";
import { Command, CommandAccess, CommandCategory, CommandOption, CommandOptionType, InvokerType } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import commands from "../lib/command_manager";

const revoke = new Command(
    {
        name: 'revoke',
        aliases: ["void"],
        description: 'undeploy commands',
        root_aliases: ["undeploy"],
        category: CommandCategory.Debug,
        options: [
            new CommandOption({
                name: 'target',
                description: 'optional guild ID',
                type: CommandOptionType.String,
            })
        ],
    },
    async function getArguments ({ message }) {
        const split = message.content.split(" ");
        const target = Number.isNaN(+(split.at(-1) ?? 0)) ? undefined : split.at(-1);
        return { target }
    },
    async function execute ({ invoker, args }) {
        const start = performance.now();
        console.log(args)
        await commands.undeploy(args.target);
        action.reply(invoker, "successfully unemployed; took " + ((performance.now() - start).toFixed(3)) + "ms")
    }
);

const deploy = new Command(
    {
        name: 'deploy',
        description: 'deploy commands globally or to a guild',
        category: CommandCategory.Debug,
        input_types: [InvokerType.Message],
        subcommands: [revoke],
        access: new CommandAccess({ users: [ayeuhugyu.user_id] }),
        options: [
            new CommandOption({
                name: 'subcommand',
                description: 'optional subcommand',
                choices: [{ name: "revoke", value: "revoke" }],
                type: CommandOptionType.String,
            }),
            new CommandOption({
                name: 'target',
                description: 'optional guild ID',
                type: CommandOptionType.String,
            })
        ],
    },
    async function getArguments ({ message }) {
        const split = message.content.split(" ")[1];
        return { subcommand: split, target: split }
    },
    async function execute ({ invoker, args }) {
        const start = performance.now();
        await commands.deploy(args.target)
        action.reply(invoker, "successfully deployed; took " + ((performance.now() - start).toFixed(3)) + "ms")
    }
);


export default deploy;