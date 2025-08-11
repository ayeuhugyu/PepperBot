import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import fs from "fs";
import { getArgumentsTemplate, GetArgumentsTemplateType, CommandAccessTemplates } from "../lib/templates";
import { CommandTag, CommandOptionType } from "../lib/classes/command_enums";

const debugWhitelist = CommandAccessTemplates.dev_only.whitelist.users;

function replaceLast(str: string, search: string, replacement: string): string {
    const lastIndex = str.lastIndexOf(search);
    if (lastIndex === -1) return str; // search string not found
    return str.substring(0, lastIndex) + replacement + str.substring(lastIndex + search.length);
}

const command = new Command(
    {
        name: 'sendlog',
        description: 'sends a log file',
        long_description: 'uploads a log file, allowing you to pipe its contents to grep',
        tags: [CommandTag.Debug],
        pipable_to: [CommandTag.TextPipable],
        example_usage: "p/sendlog global",
        argument_order: "<log>",
        aliases: ["log", "getlog"],
        options: [
            new CommandOption({
                name: 'log',
                description: 'the file to upload',
                type: CommandOptionType.String,
                required: true,
                choices: [
                    { name: "global.log", value: "global.log" },
                    { name: "fatal.log", value: "fatal.log" },
                    { name: "error.log", value: "error.log" },
                    { name: "warn.log", value: "warn.log" },
                    { name: "info.log", value: "info.log" },
                ]
            })
        ],
        requiredPermissions: ["AttachFiles"],
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["log"]),
    async function execute ({ args, invoker, piped_data, will_be_piped, guild_config }) {
        if (!args || !args.log) {
            action.reply(invoker, { content: "you need to specify a log file to send", ephemeral: true });
            return new CommandResponse({
                error: true,
                message: "you need to specify a log file to send",
            });
        }
        const log = replaceLast(args.log, ".log", "").replace(/[^a-z0-9]/gi, '');
        const log_file = `./logs/${log}.log`;
        if (!fs.existsSync(log_file)) {
            action.reply(invoker, { content: `the log file \`${log_file}\` does not exist`, ephemeral: true });
            return new CommandResponse({
                error: true,
                message: `the log file \`${log_file}\` does not exist`,
            });
        }
        let isDebug = false
        if (log_file === "./logs/debug.log") {
            isDebug = true
        }
        if (isDebug && !debugWhitelist.includes(invoker.author.id)) {
            action.reply(invoker, { content: "user is not in debug logs whitelist", ephemeral: true });
            return new CommandResponse({
                error: true,
                message: "user is not in debug logs whitelist",
            });
        }

        if (will_be_piped) {
            action.reply(invoker, { content: "piped log file contents", ephemeral: true });
            return new CommandResponse({ pipe_data: { input_text: fs.readFileSync(log_file, "utf8") } });
        }

        const sent = await action.reply(invoker, { content: `uploading...` });
        if (!sent) return;
        action.edit(sent, { content: `${isDebug ? "-# debug whitelist exclusive file\n" : ""}${log}${log.endsWith(".log") ? "" : ".log"}:`, files: [log_file] });
        return new CommandResponse({ pipe_data: { input_text: fs.readFileSync(log_file, "utf8") } });
    }
);

export default command;