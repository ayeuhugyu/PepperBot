import { Playlist, Video } from "./media";
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

export function embedVideoOrSound(item: Video | CustomSound | Playlist, isCurrentIndex?: Boolean, index?: number): TextDisplay | Section {
    const title = 'title' in item ? item.title : 'name' in item ? item.name : "????";
    const length = 'duration' in item ? item.duration : undefined;
    const url = 'url' in item ? item.url : undefined;
    const readableLength = length ? toHHMMSS(length) : undefined;
    const textDisplay = new TextDisplay({
        content: `**${index != undefined ? `${index + 1}: ` : ""}${title}**` +
            (length ? `\nduration: ${readableLength}` : "") + (isCurrentIndex && length ? `; ending <t:${Math.floor(Date.now() / 1000 + length)}:R>` : "") +
            ('uploader' in item ? `\nuploader: ${item.uploader}` : "") +
            ('description' in item ? `\ndescription: ${item.description}` : "") +
            (url ? `\nurl: ${url}` : "") +
            ('downloader' in item ? `\ndownloader used: ${item.downloader}` : "")
    });
    let section;
    if ('thumbnail' in item) {
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