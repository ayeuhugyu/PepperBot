// to ----: remove error throws and replace w replies, i did most of that in comments
// maybe you want to add a processing message tho
import fs from "fs";
import sharp from "sharp";

type Gravity = "south" | "north"

// these are arguments, default ratios to these
// position of the tip of the arrow in the bubble
// maybe use mathjs in args so you can do 1/3 instead of 0.33
// maybe also presets like "left"
const xPos = 1 / 3;
const yPos = 1 / 4;
const gravity: Gravity = Math.random() > 0.5 ? "south" : "north";
const imageUrl = "https://static1.e621.net/data/43/2e/432eb2f446eef1e20e0cc3f117c17827.gif";

const inputImageBuffer = await fetch(imageUrl).then(res => res.arrayBuffer());
const inputImage = await sharp(inputImageBuffer, { animated: true });

let metadata: sharp.Metadata;
try {
    metadata = await sharp(inputImageBuffer).metadata();
} catch (err) {
    console.log(err);
    process.exit(1);
    // action.reply(message, { content: "uh oh! invalid image?" });
}

// ....i don't think it's possible for this to be null
// i am ignoring it
const width = metadata.width as number;
const height = metadata.height as number;

const tailCurveDepth = 5 / 8;
const tailWidth = 40;
const tailShift = (xPos <= (1/3) || xPos >= (2/3)) ? Math.round(xPos) : xPos;

const tailSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <path d="
            M 0, 0
            Q ${width / 2}, ${height * yPos * tailCurveDepth} ${width}, 0
        " fill="white" stroke="none"/>
        <polygon points="
            ${width * tailShift - tailWidth}, 0
            ${width * tailShift + tailWidth}, 0
            ${width * xPos}, ${height * yPos}
        " fill="white" stroke="none"/>
    </svg>
`;

const overlayBuffer = await sharp(Buffer.from(tailSvg))
    .png()
    .toBuffer();

const outputBuffer = await inputImage
    .composite([{
        input: overlayBuffer,
        blend: "dest-out",
        gravity: gravity,
        tile: true,
    }])
    .toFormat("gif")
    .toBuffer();

fs.writeFileSync("out.gif", outputBuffer);
// action.reply(message, { 
//     content: "here's your chat bubble",
//     files: [new AttachmentBuilder(outputBuffer, { name: "bub.gif" })]
// })