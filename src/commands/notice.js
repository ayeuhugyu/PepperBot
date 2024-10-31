import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection, GuildSystemChannelFlags } from "discord.js";
import fs from "fs";
import * as theme from "../lib/theme.js";
import * as globals from "../lib/globals.js";
import guildConfigs from "../lib/guildConfigs.js";

const config = globals.config;

const data = new CommandData();
data.setName("notice");
data.setDescription("send a notice to all servers");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
;
data.addStringOption((option) =>
    option.setName("message").setDescription("what to say").setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        args.set(
            "message",
            message.content
                .slice(prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args, isInteraction) {
        if (args.get("message")) {
            let toBeNotified = {};
            let guildSent = 0;
            let notifiedSent = 0;
            for (const guildId in guildConfigs.guildConfigs) {
                const currentGuild = await message.client.guilds.fetch(guildId);
                const currentGuildConfig = guildConfigs.guildConfigs[guildId];
                if (currentGuildConfig.noticesChannelId) {
                    let channel
                    try {
                        channel = await currentGuild.channels.fetch(currentGuildConfig.noticesChannelId);
                    } catch (e) {
                        const guildInfoObject = {
                            guild: currentGuild.name,
                            guildId: currentGuild.id
                        }
                        toBeNotified[currentGuild.ownerId] = toBeNotified[currentGuild.ownerId] || [];
                        toBeNotified[currentGuild.ownerId].push(guildInfoObject);
                        continue;
                    }
                    await action.sendMessage(channel, {content: args.get("message")});
                    guildSent += 1;
                }
            }
            if (Object.keys(toBeNotified).length > 0) {
                for (const [guildOwnerId, guilds] of Object.entries(toBeNotified)) {
                    notifiedSent += 1;
                    const guildOwner = await message.client.users.fetch(guildOwnerId);
                    await action.sendDM(guildOwner, `you are the owner of ${guilds.length} server${guilds.length === 1 ? "" : "s"} that don't have a valid notices channel set up, please set one up to receive notices. \nhere's the notice: ${args.get("message")}\n\n the servers are: ${guilds.map((guild) => `${guild.guild} (${guild.guildId})`).join(", ")}`);
                }
            }
            await action.reply(message, `sent this message to ${guildSent} server${guildSent === 1 ? "" : "s"} and notified ${notifiedSent} server owner${notifiedSent === 1 ? "" : "s"}`);
            action.deleteMessage(message)
        } else {
            action.reply(message, "provide a message to say you baffoon!");
        }
    }
);

export default command;
