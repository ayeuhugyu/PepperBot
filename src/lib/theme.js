import { EmbedBuilder } from "discord.js";
import fs from "fs";
import * as globals from "./globals.js";

const config = globals.config;

export const themeData = {
    default: {
        emoji: "🌶️",
        color: 0xff0000,
        thumbnail: "https://cdn.discordapp.com/attachments/755150633191080073/1149152214850469908/Map_Icon.png",
        footer: {
            text: "Bot made by and hosted by @anti_pepperphobes. You can view the source using p/git!",
            iconURL: "https://cdn.discordapp.com/attachments/755150633191080073/1149152214850469908/Map_Icon.png"
        },
    },
    spooky: {
        emoji: "🎃",
        color: 0xff9900,
        thumbnail: "https://cdn.discordapp.com/attachments/755150633191080073/1149152214850469908/Map_Icon.png",
        footer: {
            text: "It's spooky month!",
            iconURL: "https://cdn.discordapp.com/attachments/755150633191080073/1149152214850469908/Map_Icon.png"
        },
    },
    winter: {
        emoji: "❄️",
        color: 0x3399ff,
        thumbnail: "https://cdn.discordapp.com/attachments/755150633191080073/1149152214850469908/Map_Icon.png",
        footer: {
            text: "Hey! It's cold up here, don't you agree?",
            iconURL: "https://cdn.discordapp.com/attachments/755150633191080073/1149152214850469908/Map_Icon.png"
        },
    },
    easter: {
        emoji: "🐰",
        color: 0xffccff,
        thumbnail: "https://cdn.discordapp.com/attachments/755150633191080073/1149152214850469908/Map_Icon.png",
        footer: {
            text: "eaker basker",
            iconURL: "https://cdn.discordapp.com/attachments/755150633191080073/1149152214850469908/Map_Icon.png"
        },
    }

}

export const themes = {
    DEFAULT: "default",
    SPOOKY: "spooky",
    WINTER: "winter",
    EASTER: "easter",
    
    CURRENT: "spooky"
}

export function getThemeEmoji(theme) {
    return getTheme(theme).emoji;
}

export function createThemeEmbed(theme) {
    const themeData = getTheme(theme);
    const embed = new EmbedBuilder();
    embed.setColor(themeData.color);
    embed.setThumbnail(themeData.thumbnail);
    embed.setFooter(themeData.footer);
    embed.setAuthor({
        name: "PepperBot",
        iconURL: themeData.thumbnail,
        url: "https://pepperbot.online"
    });
    return embed;
}

export function getTheme(theme) {
    return themeData[theme];
}


export default function () {
    return createThemeEmbed(theme.DEFAULT);
} // the only reason this still exists is to support old code incase i forgot to change it
