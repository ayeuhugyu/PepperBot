import { EmbedBuilder } from "discord.js";
import fs from "fs";
import * as globals from "./globals.js";

const config = globals.config;

export default function () {
    const embed = new EmbedBuilder();
    embed.setColor(0xff0000);
    embed.setThumbnail(
        "https://cdn.discordapp.com/attachments/755150633191080073/1149152214850469908/Map_Icon.png"
    );
    embed.setFooter({
        text: "Bot made by and hosted by anti_pepperphobes",
        iconURL:
            "https://cdn.discordapp.com/attachments/755150633191080073/1149152214850469908/Map_Icon.png",
    });
    embed.setAuthor({
        name: "PepperBot",
        iconURL:
            "https://cdn.discordapp.com/attachments/755150633191080073/1149152214850469908/Map_Icon.png",
    });
    return embed;
}
