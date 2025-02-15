import { Collection, Message } from "discord.js";
import { Command, CommandCategory, CommandOption, CommandOptionType, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import simpleGit from "simple-git";
import { textToFile } from "../lib/filify";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";

const command = new Command(
    {
        name: 'snowflake',
        description: 'extracts data from discord snowflakes (ids)',
        long_description: 'extracts the worker id, process id, increment, and timestamp from a discord snowflake (id)',
        category: CommandCategory.Info,
        pipable_to: ['grep'],
        argument_order: "<snowflake>",
        subcommands: [],
        options: [
            new CommandOption({
                name: 'snowflake',
                description: 'the snowflake/id to extract data from.',
                long_description: 'the snowflake/id to extract data from. you can also use mentions or attachment/channel/message links and the id will be extracted from them',
                type: CommandOptionType.String,
                required: true,
            })
        ],
        example_usage: "p/snowflake 440163494529073152",
        aliases: ["idextract", "snowflakeextract"]
    }, 
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["snowflake"]),
    async function execute ({ message, guildConfig, args }) {
        const mediaUrlRegex = /https:\/\/media\.discordapp\.net\/attachments\/\d+\/(\d+)\/.+/;
        const messageUrlRegex = /https:\/\/(?:canary|ptb|www)?\.discord(?:app)?\.com\/channels\/\d+\/\d+\/(\d+)/;
        const channelUrlRegex = /https:\/\/(?:canary|ptb|www)?\.discord(?:app)?\.com\/channels\/\d+\/(\d+)/;
        if (!args?.get("snowflake")) {
            action.reply(message, { content: "please provide a snowflake/id to extract data from", ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        const snowflake = args.get("snowflake") as string;
        let id;
        if ((snowflake.startsWith("<@") && snowflake.endsWith(">")) || (snowflake.startsWith("<#") && snowflake.endsWith(">"))) {
            id = snowflake.slice(2, -1);
        } else if ((snowflake.startsWith("<@&") && snowflake.endsWith(">")) || (snowflake.startsWith("<@!") && snowflake.endsWith(">"))) {
            id = snowflake.slice(3, -1);
        } else if (snowflake.startsWith("https")) {
            const mediaUrlMatch = snowflake.match(mediaUrlRegex);
            const messageUrlMatch = snowflake.match(messageUrlRegex);
            const channelUrlMatch = snowflake.match(channelUrlRegex);
            if (mediaUrlMatch) {
                id = mediaUrlMatch[1];
            } else if (messageUrlMatch) {
                id = messageUrlMatch[1];
            } else if (channelUrlMatch) {
                id = channelUrlMatch[1];
            } else {
                action.reply(message, { content: "please provide a valid snowflake/id to extract data from", ephemeral: guildConfig.other.use_ephemeral_replies });
                return new CommandResponse({});
            }
        } else {
            id = snowflake;
        }

        if (!id) {
            action.reply(message, { content: "please provide a valid snowflake/id to extract data from", ephemeral: guildConfig.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        let binary = Number(id).toString(2); 
        if (binary.length < 64) {
            binary = ("0".repeat(64 - binary.length) + binary);
        } 
        const timestampBinary = binary.slice(0, 42); 
        const timestamp = (parseInt(timestampBinary, 2) + 1420070400000); // add discord epoch
        const date = new Date(timestamp); 

        const workerIdBinary = binary.slice(43, 48);
        const processIdBinary = binary.slice(49, 54);
        const incrementBinary = binary.slice(55, 64); 

        const workerId = parseInt(workerIdBinary, 2);
        const processId = parseInt(processIdBinary, 2);
        const increment = parseInt(incrementBinary, 2);

        const string = `input id: ${id}\n\nfull binary: ${binary}\ntimestamp binary: ${timestampBinary}\nworker id binary: ${workerIdBinary}\nprocess id binary: ${processIdBinary}\nincrement binary: ${incrementBinary}\ntimestamp: ${timestamp}\n\ndate: ${date}\nworker id: ${workerId}\nprocess id: ${processId}\nincrement: ${increment}`; 
        action.reply(message, { content: `\`\`\`${string}\`\`\``, ephemeral: guildConfig.other.use_ephemeral_replies });
        return new CommandResponse({ pipe_data: { grep_text: `\`\`\`${string}\`\`\`` } });
    }
);

export default command;