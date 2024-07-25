import * as voice from "../lib/voice.js";
import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import * as log from "../lib/log.js";
import fs from "fs";
import * as globals from "../lib/globals.js";

const config = globals.config;

const data = new CommandData();
data.setName("leavevc");
data.setDescription("leaves a vc");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["leave", "leavecall", "fuckoff", "goaway"]);
const command = new Command(
    data,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args) {
        const connection = await voice.getVoiceConnection(message.guild.id);
        if (connection) {
            voice.leaveVoiceChannel(connection).catch((e) => {
                log.error(e);
            });
            action.reply(message, {
                content: `left voice channel <#${connection.joinConfig.channelId}>`,
                ephemeral: true,
            });
        } else {
            action.reply(message, {
                content: "im not connected to a voice channel here mf",
                ephemeral: true,
            });
        }
    }
);

export default command;
