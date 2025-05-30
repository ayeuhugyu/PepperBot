import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { ButtonBuilder, ButtonStyle, Collection } from "discord.js";
import { AdvancedPagedMenuBuilder } from "../lib/types/menuBuilders.js";
import * as adobe from "../lib/adobe.js";
import * as theme from "../lib/theme.js";
import chatbubble from "./chatbubble.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const data = new CommandData();
data.setName("cquery");
data.setDescription("queries adobe stock for christos georghiou images");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
;
data.setAliases(["christosquery", "csearch", "christossearch", "cq", "cs"]);
data.addStringOption((option) =>
    option
        .setName("query")
        .setDescription("what to search for")
        .setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "query",
            message.content
                .slice(prefix.length + commandLength)
                .trim()
        );

        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        if (!args.get("query")) {
            action.reply(message, "provide a query, baffoon!");
            return;
        }
        const result = await adobe.search({
            query: args.get("query"),
            creatorId: 53815,
            quality: 240,
            limit: 100,
        });

        const cleanResult = await adobe.cleanupSearchResults(result);
        if (cleanResult.length === 1) {
            const file = cleanResult[0];
            const embed = theme.createThemeEmbed(theme.themes[gconfig.theme] || theme.themes.CURRENT)
                .setTitle(`[1/1] - ${file.title}`)
                .setImage(file.url)
                .setURL(file.pageUrl);
            action.reply(message, {
                embeds: [embed],
                ephemeral: gconfig.useEphemeralReplies,
            });
        } else if (cleanResult.length > 1) {
            const menu = new AdvancedPagedMenuBuilder();
            const totalResults = cleanResult.length;
            cleanResult.forEach((file, index) => {
                const embed = theme.createThemeEmbed(theme.themes[gconfig.theme] || theme.themes.CURRENT)
                    .setTitle(`[${index + 1}/${totalResults}] - ${file.title}`)
                    .setImage(file.url)
                    .setURL(file.pageUrl);
                menu.full.addPage(embed);
            });

            const button = new ButtonBuilder()
                .setCustomId("bubble")
                .setLabel("Create Chat Bubble")
                .setStyle(ButtonStyle.Danger);

            const sent = await action.reply(message, {
                embeds: [menu.pages[menu.currentPage]],
                components: [menu.actionRow.addComponents(button)],
                ephemeral: gconfig.useEphemeralReplies,
            });
            const collector = sent.createMessageComponentCollector({
                time: 240_000,
            });
            collector.on("collect", async (interaction) => {
                if (interaction.customId === "bubble") {
                    const args = new Collection();
                    args.set("image", {
                        url: interaction.message.embeds[0].image.url,
                        name: "chatbubble.jpg",
                        height: parseInt(
                            interaction.message.embeds[0].image.height
                        ),
                        width: parseInt(
                            interaction.message.embeds[0].image.width
                        ),
                    });
                    chatbubble.execute(interaction, args, true);
                }
            });
            menu.full.begin(sent, 240_000, menu);
        } else {
            action.reply(message, "no results found");
        }
    }
);

export default command;
