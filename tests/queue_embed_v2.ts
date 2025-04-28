import { inspect } from "node:util";
import { Container, Section, Thumbnail, Separator, TextDisplay } from "../src/lib/classes/components";
import { getInfo, Video } from "../src/lib/classes/queue_manager";

console.log()

const { data } = await getInfo("https://www.youtube.com/watch?v=bSUbG9TXb1w")
const video = data as Video
console.log(video)

const isCurrentIndex = true;
const embed = new Container({
    components: [
        new Section({
            accessory: new Thumbnail({
                url: video.thumbnail || "https://example.com/",
            }),
            components: [
                new TextDisplay({
                    content: `
**${video.title || "???"}** ${isCurrentIndex ? `\n-# ending in <t:${Math.floor(Date.now() / 1000 + (video.length))}:R>` : ""}
${video.url || "unknown url"} // ${video.id || "unknown id"}
                    `
                })
            ]
        }),
        new Separator(),
    ]
})

console.log(inspect(embed, { depth: 10, colors: true }))