import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";
import * as builderutil from "../lib/deepwokenbuilderapi.js";
import { AdvancedPagedMenuBuilder } from "../lib/types/menuBuilders.js";
import commonRegex from "../lib/commonRegex.js";
import * as util from "util";
import default_embed from "../lib/default_embed.js";

const config = globals.config;

const data = new CommandData();
data.setName("preview");
data.setDescription("previews a deepwoken build");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setAliases(["buildpreview", "build"]);
data.setdisableExternalGuildUsage(true);
data.addStringOption((option) =>
    option.setName("messageid").setDescription("ID of the message w/ the build you want to preview").setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "buildid",
            message.content
                .slice(prefix.length + commandLength)
        );
        if (message.reference) {
            args.set(
                "messageid",
                message.reference.messageId
            ); // todo: change this to just be the build id instead of a message with the build in it but keep this functionality as well
        }
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        let fetchedMessage
        if (args.get("messageid")) {
            try {
                fetchedMessage = await message.channel.messages.fetch(args.get("messageid"));
            } catch (e) {
                // heres something so eslint doesn't get mad at me
            }
            if (!fetchedMessage) {
                return action.reply(message, `couldn't fetch \`${args.get('messageid')}\` in this channel`);
            }
            const buildLinkRegex = commonRegex.deepwokenBuildLink
            const buildID = fetchedMessage.content.match(buildLinkRegex)?.[1];
            if (!buildID) {
                return action.reply(message, `couldn't find a build in the message`);
            }
            args.set("buildid", buildID);
        }
        if (!args.get("buildid")) {
            return action.reply(message, `no build id provided`);
        }
        const response = await builderutil.fetchBuild(args.get("buildid"));
        if (response.status === 'failed') {
            return action.reply(message, `couldn't fetch build \`${args.get('buildid')}\``);
        }
        const build = builderutil.buildReformatter(response.content);
        //console.log(build)
        const buildPages = builderutil.cleanBuildToHumanReadable(build);
        //console.log(util.inspect(buildPages, { depth: Infinity, colors: true }));
        const menu = new AdvancedPagedMenuBuilder();
        buildPages.forEach((page) => {
            const embed = default_embed();
            embed.setTitle(page.title);
            if (page.description) {
                embed.setDescription(page.description);
            }
            if (page.fields) {
                embed.addFields(page.fields);
            }
            menu.full.addPage(embed);
        });
        const sent = await action.reply(fetchedMessage || message, {
            embeds: [menu.pages[menu.currentPage]],
            components: [menu.actionRow],
            ephemeral: gconfig.useEphemeralReplies,
        });
        menu.full.begin(sent, 240_000, menu)
        if (fromInteraction && fetchedMessage) {
            action.reply(message, `sent preview for \`${build.meta.title}\``);
        }
    },
    [] // subcommands
);

export default command;

/*
example subcommand:
const subcommand1data = new CommandData();
subcommand1data.setName("");
subcommand1data.setDescription("");
subcommand1data.setPermissions([]);
subcommand1data.setPermissionsReadable("");
subcommand1data.setWhitelist([]);
subcommand1data.setCanRunFromBot(true);
subcommand1data.addStringOption((option) =>
    option.setName("").setDescription("").setRequired(true)
);

const subcommand1 = new SubCommand(
    subcommand1data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "ARGUMENT",
                message.content
                .slice(prefix.length + commandLength)
                .split(" ")[0]
                .trim()
        );
        return args;
    },
    async function execute(message, args, fromInteraction) {}
);

command.addSubCommand(subcommand1)

additional notes:
subcommands do not (as of now) support aliases, only the main command does
subcommands do not (as of now) support additional subcommands, only the main command does
subcommands need to have their own argument in the getArgs function.
if you're going to use subcommands, your getArgs function in the main command should include somewhere:
        args.set(
            "_SUBCOMMAND",
            message.content.split(" ")[1].trim()
        );
or similiar
you also need to have the following in your main data:
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("subcommand to run")
        .setRequired(false)
        .addChoices(
            {name: "subcommandname", value: "subcommandname"},
        )
);
but obviously choices would have all of your subcommands
this just allows for the use of subcommands from slash commands

*/
