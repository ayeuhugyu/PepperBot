import { Collection, Message } from "discord.js";
import { Command, CommandAccess, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandCategory, CommandOptionType } from "../lib/classes/command_enums";


const command = new Command(
    {
        name: 'restart',
        description: 'restarts the given process',
        category: CommandCategory.Debug,
        pipable_to: [],
        example_usage: "p/restart sharder",
        aliases: [],
        access: new CommandAccess({
            users: ["440163494529073152"]
        }),
        options: [
            new CommandOption({
                name: 'process',
                description: 'the process to restart',
                required: false,
                type: CommandOptionType.String
            })
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["process"]),
    async function execute ({ invoker, args }) {
        if (!args.process) {
            args.process = "sharder";
        }
        if (args.process === "sharder" || args.process === "site") {
            fetch("http://localhost:50000/restart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ process: args.process })
            }).then(async (response) => {
                const content = await response.text();
                action.reply(invoker, content);
            })
        }
    }
);

export default command;