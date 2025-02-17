import * as discord from "discord.js";
import { Command, CommandAccess, CommandCategory, CommandOption, CommandOptionType, CommandResponse, InputType } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import fsExtra from "fs-extra";
import fs from "node:fs";
import process from "process";
import shell from "shelljs";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import * as util from "util";
import * as gpt from "../lib/gpt";

const modules = {
    discord,
    action,
    fsExtra,
    fs,
    process,
    shell,
    util,
    gpt
} // this is some weird hacky thing to make bun not omit the modules due to them being unused

const command = new Command(
    {
        name: 'eval',
        description: 'evaluates the provided code',
        category: CommandCategory.Debug,
        options: [
            new CommandOption({
                name: 'code',
                description: 'the code to evaluate',
                type: CommandOptionType.String,
                required: true
            })
        ],
        input_types: [InputType.Message],
        deployed: false,
        access: new CommandAccess({
            users: ["440163494529073152", "406246384409378816"]
        }, {}),
        pipable_to: ['grep'],
        example_usage: "p/eval console.log(\"hello world\")",
        aliases: ["evaluate"]
    }, 
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["code"]),
    async function execute ({ message, args }) {
        if (!args?.get("code")) {
            action.reply(message, "tf u want me to eval");
            return new CommandResponse({ pipe_data: { grep_text: "tf u want me to eval" }});
        }
        try {
            const result = await (async function () {
                return await eval(args.get("code"));
            })();
            if (result !== undefined) {
                action.reply(message, `result: \`\`\`${result}\`\`\``);
                return new CommandResponse({ pipe_data: { grep_text: `result: \`\`\`${result}\`\`\`` }});
            }
            action.reply(message, "no error generated, no result returned.");
            return;
        } catch (e) {
            action.reply(message, `\`\`\`${e}\`\`\``);
            return new CommandResponse({ pipe_data: { grep_text: `\`\`\`${e}\`\`\`` }});
        }
    }
);

export default command;