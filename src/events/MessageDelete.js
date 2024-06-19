import fs from "fs";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

export default {
    name: "messageDelete",
    async execute(message) {
        try {
            if (message.author && message.channel) {
                if (message.content.length > 0) {
                    let guild = "";
                    if (message.guild.id) {
                        guild = "GUILD: " + message.guild.id;
                    }
                    log.deleted(
                        `FROM: ${message.author}, IN: ${message.channel}, ${guild}, WITH: \n${message.content}`
                    );
                } else if (
                    message.attachments.length > 0 ||
                    message.embeds.length > 0
                ) {
                    log.deleted(
                        `FROM: ${message.author}, IN: ${message.channel}, WITH: ATTACHMENT/EMBED`
                    );
                }
            }
        } catch (err) {
            log.error(err);
        }
    },
};
