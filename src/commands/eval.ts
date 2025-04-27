import * as discord from "discord.js";
import { Command, CommandAccess, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import fsExtra from "fs-extra";
import fs from "node:fs";
import process from "process";
import shell from "shelljs";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import * as util from "util";
import * as gpt from "../lib/gpt";
import { CommandTag, InvokerType, CommandOptionType } from "../lib/classes/command_enums";
import * as queue from "../lib/classes/queue_manager";
import database from "../lib/data_manager"
import * as components from "../lib/classes/components";

const modules = {
    discord,
    action,
    fsExtra,
    fs,
    process,
    shell,
    util,
    gpt,
    queue,
    database,
    components,
} // this is some weird hacky thing to make bun not omit the modules due to them being unused

const command = new Command(
    {
        name: 'eval',
        description: 'evaluates the provided code',
        tags: [CommandTag.Debug],
        options: [
            new CommandOption({
                name: 'code',
                description: 'the code to evaluate',
                type: CommandOptionType.String,
                required: true
            })
        ],
        input_types: [InvokerType.Message],
        access: new CommandAccess({
            users: ["440163494529073152", "406246384409378816"]
        }, {}),
        pipable_to: [CommandTag.TextPipable],
        example_usage: "p/eval console.log(\"hello world\")",
        aliases: ["evaluate"]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["code"]),
    async function execute ({ invoker, args }) {
        const message = invoker
        if (!args.code) {
            action.reply(message, "tf u want me to eval");
            return new CommandResponse({ pipe_data: { input_text: "tf u want me to eval" }});
        }
        try {
            const result = await (async function () {
                return await eval(args.code);
            })();
            if (result !== undefined) {
                action.reply(message, `result: \`\`\`\n${result}\`\`\``);
                return new CommandResponse({ pipe_data: { input_text: `result: \`\`\`\n${result}\`\`\`` }});
            }
            action.reply(message, "no error generated, no result returned.");
            return;
        } catch (e) {
            action.reply(message, `\`\`\`\n${e}\`\`\``);
            return new CommandResponse({
                error: true,
                message: `\`\`\`\n${e}\`\`\``,
            });
        }
    }
);

export default command;