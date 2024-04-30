import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import { AdvancedPagedMenuBuilder } from "../lib/types/menuBuilders.js";
import * as adobe from "../lib/adobe.js";
import default_embed from "../lib/default_embed.js";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

function removeBetween(str, firstSubstring, secondSubstring) {
    const regex = new RegExp(`${firstSubstring}.*${secondSubstring}`, "s");
    return str.replace(regex, "");
}

const data = new CommandData();
data.setName("cquery");
data.setDescription("queries adobe stock for christos georghiou images");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["christosquery", "csearch", "christossearch"]);
data.addStringOption((option) =>
    option
        .setName("query")
        .setDescription("what to search for")
        .setRequired(true)
);
data.addIntegerOption((option) =>
    option
        .setName("limit")
        .setDescription("amount of images to return")
        .setRequired(false)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "query",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );

        return args;
    },
    async function execute(message, args, fromInteraction) {
        if (!args.get("query")) {
            action.reply(message, "provide a query, baffoon!");
            return;
        }
        const result = await adobe.search({
            query: args.get("query"),
            creatorId: 53815,
            quality: 240,
        });

        const cleanResult = await adobe.cleanupSearchResults(result);
        if (cleanResult.length === 1) {
            const file = cleanResult[0];
            const embed = default_embed()
                .setTitle(file.title)
                .setImage(file.url)
                .setURL(file.pageUrl);
            action.reply(message, {
                embeds: [embed],
                ephemeral: true,
            });
        } else if (cleanResult.length > 1) {
            const menu = new AdvancedPagedMenuBuilder();
            let index = 1;
            cleanResult.forEach((file) => {
                const embed = default_embed()
                    .setTitle(`[${index}] - ${file.title}`)
                    .setImage(file.url)
                    .setURL(file.pageUrl);
                menu.addPage(embed);
                index++;
            });
            const built = menu.build();
            const sent = await action.reply(message, {
                embeds: [built.embed],
                components: [built.actionRow],
                ephemeral: true,
            });
            menu.begin(sent, 240_000, built);
        } else {
            action.reply(message, "no results found");
        }
    }
);

export default command;
