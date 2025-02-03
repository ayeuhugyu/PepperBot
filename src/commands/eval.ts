import * as discord from "discord.js";
import { Command, CommandAccess, CommandCategory, CommandOption, CommandOptionType, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import fs from "fs";
import fsextra from "fs-extra";
import process from "process";
import shell from "shelljs"

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
        deployed: false,
        access: new CommandAccess({
            users: ["440163494529073152", "406246384409378816"]
        }, {}),
        pipable_to: ['grep'],
    }, 
    async function getArguments ({ self, message, guildConfig }) {
        message = message as discord.Message;
        const args = new discord.Collection();
        const commandLength = `${guildConfig.other.prefix}${self.name}`.length;
        const code = message.content.slice(commandLength)?.trim();
        args.set('code', code);
        return args;
    },
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