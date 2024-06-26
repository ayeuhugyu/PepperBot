import { EmbedBuilder } from "discord.js";
import fs from "fs";
import * as globals from "./globals.js";

const config = globals.config;

export default function () {
    const embed = new EmbedBuilder();
    embed.setColor(0xff0000);
    embed.setThumbnail(
        config.lib.default_embed_icon_url
    );
    embed.setFooter({
        text: "Bot made by and hosted by anti_pepperphobes",
        iconURL:
            config.lib.default_embed_icon_url,
    });
    embed.setAuthor({
        name: "PepperBot",
        iconURL:
            config.lib.default_embed_icon_url,
    });
    return embed;
}
