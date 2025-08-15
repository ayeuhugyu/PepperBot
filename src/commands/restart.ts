import { Collection, Message } from "discord.js";
import { Command, CommandAccess, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { CommandAccessTemplates, getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, CommandOptionType, InvokerType } from "../lib/classes/command_enums";
import process from "node:process";

const command = new Command(
    {
        name: 'restart',
        description: 'restarts the bot',
        tags: [CommandTag.Debug, CommandTag.WhitelistOnly],
        input_types: [InvokerType.Message],
        pipable_to: [],
        example_usage: "p/restart",
        aliases: [],
        access: CommandAccessTemplates.dev_only,
        options: [
            new CommandOption({
                name: 'pull',
                description: 'pulls the latest changes from the repository before restarting',
                type: CommandOptionType.String,
                required: false,
            })
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["pull"]),
    async function execute ({ invoker, args }) {
        if (args.pull) {
            const reply = await action.reply(invoker, "pulling latest changes...");
            await import("../../scripts/pull");
            if (reply instanceof Message) {
                await reply.edit("pulled latest changes, restarting...");
            } else {
                await action.reply(invoker, "pulled latest changes, restarting...");
            }
            process.exit(0);
        } else {
            await action.reply(invoker, "restarting bot...");
            process.exit(0);
        }
    }
);

export default command;