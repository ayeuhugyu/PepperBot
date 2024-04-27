import * as voice from "../lib/voice.js";
import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import * as log from "../lib/log.js";
import fs from "fs";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

const data = new CommandData();
data.setName("leavevc");
data.setDescription("leaves a vc");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["leave"]);
const command = new Command(
    data,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args) {
        if (voice.getVoiceConnection(message.guild.id)) {
            const connection = await voice.getVoiceConnection(message.guild.id);
            voice.destroyVoiceConnection(connection).catch((e) => {
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
