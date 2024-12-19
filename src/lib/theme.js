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
        thumbnail: "https://media.discordapp.net/attachments/1213676236929236994/1301685620678197310/lumpkin.png?ex=672560b4&is=67240f34&hm=7d587e660c961526e8cec21ee5aa56194feb5ab1a40fc2f7226bdb7342f39cac&=&format=webp&quality=lossless&width=180&height=215",
        footer: {
            text: "It's spooky month!",
            iconURL: "https://media.discordapp.net/attachments/1213676236929236994/1301685620678197310/lumpkin.png?ex=672560b4&is=67240f34&hm=7d587e660c961526e8cec21ee5aa56194feb5ab1a40fc2f7226bdb7342f39cac&=&format=webp&quality=lossless&width=180&height=215"
        },
    },
    winter: {
        emoji: "❄️",
        color: 0x3399ff,
        thumbnail: "https://media.discordapp.net/attachments/1213676236929236994/1301691746044088350/tree.png?ex=67256668&is=672414e8&hm=301b4f72f7e5e0519ba0ac842b8abd27997c7d2ac93c61fff9d6f1a9f3622ca1&=&format=webp&quality=lossless&width=403&height=701",
        footer: {
            text: "Hey! It's cold up here, don't you agree?",
            iconURL: "https://media.discordapp.net/attachments/1213676236929236994/1301691746044088350/tree.png?ex=67256668&is=672414e8&hm=301b4f72f7e5e0519ba0ac842b8abd27997c7d2ac93c61fff9d6f1a9f3622ca1&=&format=webp&quality=lossless&width=403&height=701"
        },
    },
    easter: {
        emoji: "🐰",
        color: 0xffccff,
        thumbnail: "https://cdn.discordapp.com/attachments/1213676236929236994/1301688035720695891/eggcircle.png",
        footer: {
            text: "eaker basker",
            iconURL: "https://cdn.discordapp.com/attachments/1213676236929236994/1301688035720695891/eggcircle.png"
        },
    },
    thanksgiving: {
        emoji: "🦃",
        color: 0xcc6600,
        thumbnail: "https://media.discordapp.net/attachments/1213676236929236994/1303572756587352144/turkton.png?ex=672c3e3c&is=672aecbc&hm=ae68359e2f0f32096d1f10758795d822cc05520b9a162c908d76c71852b453a6&=", // TODO: find icon
        footer: {
            text: "gobble cobble",
            iconURL: "https://media.discordapp.net/attachments/1213676236929236994/1303572756587352144/turkton.png?ex=672c3e3c&is=672aecbc&hm=ae68359e2f0f32096d1f10758795d822cc05520b9a162c908d76c71852b453a6&="
        },
    }
}

export const themes = {
    DEFAULT: "default",
    SPOOKY: "spooky",
    WINTER: "winter",
    EASTER: "easter",
    THANKSGIVING: "thanksgiving",
    
    CURRENT: "WINTER"
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
    return createThemeEmbed(themes.DEFAULT);
} // the only reason this still exists is to support old code incase i forgot to change it
