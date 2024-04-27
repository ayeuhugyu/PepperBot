import fs from "fs";
import * as log from "../lib/log.js";

const configNonDefault = await import("../../config.json", { assert: { type: 'json' }});
const config = configNonDefault.default

export default {
    name: "messageDelete",
    async execute(message) {
        if (config.events.log_deleted_messages) {
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
        }
    },
};
