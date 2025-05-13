import { ayeuhugyu } from "../../constants/contributors.json";
import { Command, CommandAccess, CommandOption } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { CommandOptionType, CommandTag, InvokerType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";

const revoke = new Command(
    {
        name: 'revoke',
        aliases: ["void"],
        description: 'undeploy commands',
        root_aliases: ["undeploy"],
        tags: [CommandTag.Debug, CommandTag.WhitelistOnly],
        subcommands: undefined,
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
        const commands = await import("../lib/command_manager").then(m => m.default);
        await commands.undeploy(args.target);
        action.reply(invoker, "successfully unemployed; took " + ((performance.now() - start).toFixed(3)) + "ms")
    }
);

const deploy = new Command(
    {
        name: 'deploy',
        description: 'deploy commands globally or to a guild',
        tags: [CommandTag.Debug, CommandTag.WhitelistOnly],
        input_types: [InvokerType.Message],
        subcommands: {
            deploy: SubcommandDeploymentApproach.Merge,
            list: [revoke]
        },
        access: new CommandAccess({ users: [ayeuhugyu.user_id] }),
        options: [
            new CommandOption({
                name: 'subcommand',
                description: 'optional subcommand',
                choices: [{ name: "revoke", value: "revoke" }],
                type: CommandOptionType.String,
            }),
        ],
    },
    async function getArguments ({ message }) {
        const split = message.content.split(" ")[1];
        return { subcommand: split, target: split }
    },
    async function execute ({ invoker, args }) {
        const start = performance.now();
        const commands = await import("../lib/command_manager").then(m => m.default);
        await commands.deploy(args.target)
        action.reply(invoker, "successfully deployed; took " + ((performance.now() - start).toFixed(3)) + "ms")
    }
);


export default deploy;