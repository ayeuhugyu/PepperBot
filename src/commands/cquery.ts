import { Command, CommandAccess, CommandInvoker, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, InvokerType, CommandOptionType } from "../lib/classes/command_enums";
import { search } from "../lib/adobe";
import { createThemeEmbed, Theme } from "../lib/theme";
import PagedMenu from "../lib/classes/pagination";
import { Message } from "discord.js";

const command = new Command(
    {
        name: 'cquery',
        description: 'queries adobe stock for christos georghiou images',
        long_description: 'queries adobe stock for christos georghiou images',
        tags: [CommandTag.Utility],
        options: [
            new CommandOption({
                name: 'query',
                description: 'the query to search for',
                long_description: 'the query to search for',
                type: CommandOptionType.String,
                required: true
            }),
            new CommandOption({
                name: 'n',
                description: 'index of the result to return first',
                long_description: 'index of the result to return first (this allows you to pipe specific results)',
                type: CommandOptionType.Integer,
                required: false
            })
        ],
        input_types: [InvokerType.Message, InvokerType.Interaction],
        example_usage: ["p/cquery cat", "p/cquery cat n=2"],
        argument_order: "query n",
        aliases: ["christosquery", "csearch", "christossearch", "cq", "cs"],
        pipable_to: [CommandTag.ImagePipable]
    },
    function getArguments({ invoker, command_name_used, guild_config }) {
        invoker = invoker as CommandInvoker<InvokerType.Message>;
        const args: Record<string, string | number | undefined> = {};
        const commandLength = `${guild_config.other.prefix}${command_name_used}`.length;
        const nIndex = invoker.content.indexOf("n=");
        const n = nIndex !== -1 ? parseInt(invoker.content.slice(nIndex + 2).split(" ")[0], 10) : undefined;
        const arg = invoker.content.slice(commandLength).split(" ").filter(part => !part.startsWith("n=")).join(" ").trim();
        args['query'] = arg;
        args['n'] = n
        return args;
    },
    async function execute ({ invoker, args }) {
        if (!args.query) {
            action.reply(invoker, "no query provided");
            return new CommandResponse({ pipe_data: { input_text: "no query provided" }});
        }
        const n = (args.n as number | undefined) || 1;
        const query = args.query as string;
        const searchResults = await search({
            query,
            creatorId: "53815",
            quality: "240",
            limit: 100,
        });
        if (searchResults.length === 0) {
            action.reply(invoker, `no results found for query \`${query}\``);
            return new CommandResponse({ pipe_data: { input_text: `no results found for query \`${query}\`` }});
        }
        const embeds = searchResults.map((result, index) => {
            const embed = createThemeEmbed(Theme.CURRENT);
            embed.setTitle(`${index + 1} - ${result.title}`);
            embed.setURL(result.pageUrl);
            embed.setImage(result.url);
            return embed;
        });

        if (!embeds[n]) {
            action.reply(invoker, `no result found at index ${n}`);
            return new CommandResponse({ pipe_data: { input_text: `no result found at index ${n}` }});
        }

        // Ensure the first embed is the nth result
        if (n > 1 && n <= searchResults.length) {
            const nthEmbed = embeds.splice(n - 1, 1)[0];
            embeds.unshift(nthEmbed);
        }
        const pagedMenu = new PagedMenu(embeds);
        const sent = await action.reply(invoker, { embeds: [embeds[n - 1]], components: [pagedMenu.getActionRow()] });
        await pagedMenu.setActiveMessage(sent as Message<true>);
        return new CommandResponse({ pipe_data: { image_url: searchResults[n - 1].url }});
    }
);

export default command;