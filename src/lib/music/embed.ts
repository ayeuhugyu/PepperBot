import { Video } from "./media";
import { CustomSound } from "../custom_sound_manager";
import { TextDisplay, Section, Thumbnail } from "../classes/components.js";

function toHHMMSS(secs: number) {
    const hours   = Math.floor(secs / 3600)
    const minutes = Math.floor(secs / 60) % 60
    const seconds = secs % 60

    return [hours,minutes,seconds]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v,i) => v !== "00" || i > 0)
        .join(":")
}

export function embedVideoOrSound(item: Video | CustomSound, isCurrentIndex?: Boolean, index?: number): TextDisplay | Section {
    const title = item instanceof Video ? item.title : item instanceof CustomSound ? item.name : "????";
    const length = item instanceof Video ? item.duration : undefined;
    const url = item instanceof Video ? item.url : undefined;
    const readableLength = length ? toHHMMSS(length) : undefined;
    const textDisplay = new TextDisplay({
        content: `**${index != undefined ? `${index + 1}: ` : ""}${title}**` +
            (length ? `\nduration: ${readableLength}` : "") + (isCurrentIndex && length ? `; ending <t:${Math.floor(Date.now() / 1000 + length)}:R>` : "") +
            (item instanceof Video ? `\nuploader: ${item.uploader}` : "") +
            (item instanceof Video ? `\ndescription: ${item.description}` : "") +
            (url ? `\nurl: ${url}` : "") +
            (item instanceof Video ? `\ndownloader used: ${item.downloader}` : "")
    });
    let section
    if (item instanceof Video && item.thumbnail) {
        section = new Section({
            accessory: new Thumbnail({
                url: item.thumbnail || "https://example.com/",
            }),
            components: [
                textDisplay
            ]
        });
    }
    return section || textDisplay;
}