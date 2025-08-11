import { Attachment, AttachmentBuilder, Collection, Message } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import sharp from "sharp";
import { evaluate } from "mathjs";
import * as log from "../lib/log";
import { CommandTag, CommandOptionType } from "../lib/classes/command_enums";

type Gravity = "south" | "north"

const command = new Command(
    {
        name: 'chatbubble',
        description: 'creates a chatbubble out of the provided image or url',
        long_description: 'creates a chatbubble out of the provided image or url. \ncheck out the parameters below to see what exactly you can specify about the chatbubble.\nnote that you can also add "discord" to the message\nto use some default properties that are useful for turning discord messages into chatbubbles.',
        tags: [CommandTag.Utility, CommandTag.ImagePipable],
        pipable_to: [],
        argument_order: "any",
        contributors: [
            {
                name: "reidlab",
                user_id: "436321340304392222"
            },
            {
                name: "ayeuhugyu",
                user_id: "440163494529073152"
            }
        ],
        options: [
            new CommandOption({
                name: 'image',
                description: 'the image to create a chatbubble out of',
                required: false,
                long_requirements: "if url is undefined",
                type: CommandOptionType.Attachment
            }),
            new CommandOption({
                name: 'url',
                description: 'url of the image to create a chatbubble out of',
                required: false,
                long_requirements: "if image is undefined",
                type: CommandOptionType.String
            }),
            new CommandOption({
                name: 'x',
                description: 'x position of the chatbubble',
                long_description: 'an expression representing the x position of the end of the tail of the chatbubble. prefixed with "x=", alternatively just type "left", "center", or "right" for 1/4, 1/2, or 3/4 respectively',
                required: false,
                type: CommandOptionType.String
            }),
            new CommandOption({
                name: 'y',
                description: 'y position of the chatbubble',
                long_description: 'an expression representing the y position of the end of the tail of the chatbubble. prefixed with "y="',
                required: false,
                type: CommandOptionType.String
            }),
            new CommandOption({
                name: 'gravity',
                description: 'gravity of the chatbubble',
                long_description: 'gravity of the chatbubble; whether the chatbubble should be placed at the top or bottom of the image. north is top, south is bottom',
                required: false,
                type: CommandOptionType.String,
                choices: [
                    { name: 'south', value: 'south' },
                    { name: 'north', value: 'north' }
                ]
            }),
            new CommandOption({
                name: 'border',
                description: 'color of the border of the chatbubble',
                long_description: 'color of the border of the chatbubble; accepts hex colors or color names (html color names); defaults to transparent',
                required: false,
                type: CommandOptionType.String
            }),
            new CommandOption({
                name: 'background',
                description: 'color of the background of the chatbubble',
                long_description: 'color of the background of the chatbubble; accepts hex colors or color names (html color names); defaults to transparent',
                required: false,
                type: CommandOptionType.String
            })
        ],
        example_usage: ["p/chatbubble x=1/3 y=1/4 https://example.com/image.png", "p/chatbubble x=0.5, y=0.25 <attach your image>", "p/chatbubble left <attach your image>", "p/chatbubble border=red background=blue <attach your image>", "p/chatbubble border=#00ff00 <attach your image>"],
        aliases: ["cb", "sb", "speechbubble", "bubble"]
    },
    async function getArguments ({ invoker, command_name_used, guild_config }) {
        invoker = invoker as Message<true>;
        const args: Record<string, string | undefined> = {};
        const commandLength = `${guild_config.other.prefix}${command_name_used}`.length;
        const text = invoker.content.slice(commandLength)?.trim();
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const foundUrls = text.match(urlRegex);
        if (foundUrls && foundUrls.length > 0) {
            args.url = foundUrls[0]
        }
        const gravityMatch = text.match(/(south|north)/);
        if (gravityMatch) {
            args.gravity = gravityMatch[0];
        }
        const horizontalMatch = text.match(/(left|center|right)/);
        if (horizontalMatch) {
            args.x = horizontalMatch[0];
        }
        const xMatch = text.match(/x=([^\s]+)/);
        if (xMatch) {
            args.x = xMatch[1]
        }
        const yMatch = text.match(/y=([^\s]+)/);
        if (yMatch) {
            args.y = yMatch[1]
        }

        const borderMatch = text.match(/(border|line|outline)=([^\s]+)/);
        if (borderMatch) {
            args.border = borderMatch[2];
        }
        const backgroundMatch = text.match(/(background|fill|bubble)=([^\s]+)/);
        if (backgroundMatch) {
            args.background = backgroundMatch[2];
        }

        const debugMatch = text.includes("debug");
        if (debugMatch) {
            args.debug = "true";
        }

        const discordMatch = text.includes("discord");
        if (discordMatch) {
            args.border = "white";
            args.x = "2/3";
        }

        args.image = invoker.attachments.first()?.url;
        return args;
    },
    async function execute ({ invoker, piped_data, args, guild_config }) {
        if (["left", "center", "right"].includes(args.x || "")) {
            switch (args.x) {
                case "left":
                    args["x"] = "1/4";
                    break;
                case "center":
                    args["x"] = "1/2"
                    break;
                case "right":
                    args["x"] = "3/4";
                    break;
            }
        }

        let xPos
        let yPos
        if (!args.x) args["x"] = "1/3";
        if (!args.y) args["y"] = "1/4";

        try {
            xPos = evaluate(args["x"] || "");
            yPos = evaluate(args["y"] || "");
        } catch (err) {
            log.error(err);
            await action.reply(invoker, { content: "error parsing inputs... are they valid math expressions? space seperated?", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "error parsing inputs... are they valid math expressions? space seperated?"
            });
        }

        const debug = args.debug === "true";

        const gravity: Gravity = (args.gravity as Gravity) || "north";
        const imageUrl = args.url || args.image || piped_data?.data?.image_url;

        if (!imageUrl) {
            await action.reply(invoker, { content: "i cant make the air into a chatbubble, gimme an image", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "i cant make the air into a chatbubble, gimme an image"
            });
        }

        const borderColor = args.border || "transparent";
        const backgroundColor = args.background || "transparent";

        const inputImageBuffer = await fetch(imageUrl).then(res => res.arrayBuffer());
        const inputImage = await sharp(inputImageBuffer, { animated: true });

        const metadata = await sharp(inputImageBuffer).metadata();
        const width = metadata.width as number;
        const height = metadata.height as number;

        const tailCurveDepth = 5 / 8;
        const tailWidth = 40;
        const tailShift = (xPos <= (1/3) || xPos >= (2/3)) ? Math.round(xPos) : xPos;

        const overlayFlipped = gravity === "south";
        let debugSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">`

        const debugUtils = {
            point: (x: number, y: number, color: string, label: string): string =>
                `\n<circle cx="${x}" cy="${y}" r="2.5" fill="${color}"><title>${label}</title></circle><text x="${x + 8}" y="${y + 4}" fill="${color}" font-size="10" font-family="Arial, sans-serif">${label}</text>`,
            line: (x1: number, y1: number, x2: number, y2: number, color: string, label: string): string =>
                `\n<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" stroke-linecap="round" stroke-dasharray="8,8"><title>${label}</title></line><text x="${(x1 + x2) / 2 + 8}" y="${(y1 + y2) / 2 + 4}" fill="${color}" font-size="10" font-family="Arial, sans-serif">${label}</text>`
        };
        function createCubicBezierFromIntersection(intersectionX: number, intersectionSvg: [number, number], endX: number, endSvg: [number, number], P0: [number, number], P1: [number, number], P2: [number, number], strokeColor: string, labelPrefix: string, addToBorder: boolean = false): string {
            // calculate t values for both intersection and end points on the original curve
            const tIntersection = intersectionX / width; // t value at intersection
            const tEnd = endX / width; // t value at end point

            // determine if this is a left curve (going from intersection to left edge)
            const isLeftCurve = endX < intersectionX;

            // calculate tangents at both points from the original quadratic curve
            // derivative of quadratic bezier: P'(t) = 2(1-t)(P1-P0) + 2t(P2-P1)
            const tangentAtIntersection = [
                2 * (1 - tIntersection) * (P1[0] - P0[0]) + 2 * tIntersection * (P2[0] - P1[0]),
                2 * (1 - tIntersection) * (P1[1] - P0[1]) + 2 * tIntersection * (P2[1] - P1[1])
            ];

            const tangentAtEnd = [
                2 * (1 - tEnd) * (P1[0] - P0[0]) + 2 * tEnd * (P2[0] - P1[0]),
                2 * (1 - tEnd) * (P1[1] - P0[1]) + 2 * tEnd * (P2[1] - P1[1])
            ];

            // create control points for the new cubic curve
            const newP0 = intersectionSvg;
            const newP3 = endSvg;

            // calculate control distances based on the curve segment length
            const segmentLength = Math.sqrt(Math.pow(newP3[0] - newP0[0], 2) + Math.pow(newP3[1] - newP0[1], 2));
            const controlDistance = segmentLength / 3;

            // normalize tangent vectors
            const tangentStartLength = Math.sqrt(tangentAtIntersection[0] * tangentAtIntersection[0] + tangentAtIntersection[1] * tangentAtIntersection[1]);
            const tangentEndLength = Math.sqrt(tangentAtEnd[0] * tangentAtEnd[0] + tangentAtEnd[1] * tangentAtEnd[1]);

            let newP1: [number, number];
            let newP2: [number, number];

            if (isLeftCurve) {
                // for left curves, we need to reverse the tangent direction at the intersection
                // because we're going backwards along the curve
                newP1 = [
                    newP0[0] - (tangentAtIntersection[0] / tangentStartLength) * controlDistance,
                    newP0[1] - (tangentAtIntersection[1] / tangentStartLength) * controlDistance
                ];

                newP2 = [
                    newP3[0] + (tangentAtEnd[0] / tangentEndLength) * controlDistance,
                    newP3[1] + (tangentAtEnd[1] / tangentEndLength) * controlDistance
                ];
            } else {
                // for right curves, use the original logic
                newP1 = [
                    newP0[0] + (tangentAtIntersection[0] / tangentStartLength) * controlDistance,
                    newP0[1] + (tangentAtIntersection[1] / tangentStartLength) * controlDistance
                ];

                newP2 = [
                    newP3[0] - (tangentAtEnd[0] / tangentEndLength) * controlDistance,
                    newP3[1] - (tangentAtEnd[1] / tangentEndLength) * controlDistance
                ];
            }

            // create the cubic bezier path
            const cubicPath = `M ${newP0[0]},${newP0[1]} C ${newP1[0]},${newP1[1]} ${newP2[0]},${newP2[1]} ${newP3[0]},${newP3[1]}`;

            if (!addToBorder) {
                debugSvg += `\n<path d="${cubicPath}" stroke="${strokeColor}" stroke-width="3" fill="none" stroke-dasharray="6,6" stroke-linecap="round"/>`;

                // debug the control points
                debugSvg += debugUtils.point(newP0[0], newP0[1], strokeColor, `${labelPrefix}0`);
                debugSvg += debugUtils.point(newP1[0], newP1[1], strokeColor, `${labelPrefix}1`);
                debugSvg += debugUtils.point(newP2[0], newP2[1], strokeColor, `${labelPrefix}2`);
                debugSvg += debugUtils.point(newP3[0], newP3[1], strokeColor, `${labelPrefix}3`);
            }

            return cubicPath;
        }
        function createSvg(width: number, height: number, xPos: number, yPos: number, tailShift: number, tailWidth: number, overlayFlipped: boolean, color: string, isBorder: boolean): string {
            let strokeWidth = 3;
            if (height < 300) {
                strokeWidth = 2; // slightly thicker for small images to reduce aliasing
            }
            const pathAttributes = isBorder ? `fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" shape-rendering="geometricPrecision"` : `fill="${color}"`;

            const P0 = [0, overlayFlipped ? height : 0];
            const P1 = [width / 2, height * (overlayFlipped ? (1 - yPos * tailCurveDepth) : yPos * tailCurveDepth)];
            const P2 = [width, overlayFlipped ? height : 0];

            // convert to standard quadratic form: y = ax² + bx + c (in mathematical coordinates)
            // flip Y coordinates to match standard mathematical coordinate system (Y=0 at bottom)
            const mathP0 = [P0[0], height - P0[1]];
            const mathP1 = [P1[0], height - P1[1]];
            const mathP2 = [P2[0], height - P2[1]];

            // we need to parameterize x from 0 to width, so t = x/width
            const a = (mathP0[1] - 2 * mathP1[1] + mathP2[1]) / (width * width);
            const b = (2 * mathP1[1] - 2 * mathP0[1]) / width;
            const c = mathP0[1];

            // debug each of the bubble path's points
            debugSvg += debugUtils.point(0, overlayFlipped ? height : 0, "red", "BL");
            debugSvg += debugUtils.point(width / 2, height * (overlayFlipped ? (1 - yPos * tailCurveDepth) : yPos * tailCurveDepth), "cyan", "CP");
            debugSvg += debugUtils.point(width, overlayFlipped ? height : 0, "green", "BR");

            // calculate and debug the midpoint of the Bézier curve (t = 0.5)
            // P(0.5) = 0.25*P₀ + 0.5*P₁ + 0.25*P₂
            const midpointX = 0.25 * P0[0] + 0.5 * P1[0] + 0.25 * P2[0];
            const midpointY = 0.25 * P0[1] + 0.5 * P1[1] + 0.25 * P2[1];
            debugSvg += debugUtils.point(midpointX, midpointY, "gold", "MID");

            // debug the path curve
            debugSvg += `\n<path d="
            M 0, ${overlayFlipped ? height : 0}
            Q
            ${width / 2},
            ${height * (overlayFlipped ? (1 - yPos * tailCurveDepth) : yPos * tailCurveDepth)} ${width},
            ${overlayFlipped ? height : 0}
            " stroke="lightgrey" stroke-width="1" fill="none" stroke-dasharray="8,8"/>`;

            // debug each of the tail polygon's points
            const TailLeftPoint = [width * tailShift - tailWidth, overlayFlipped ? height : 0];
            debugSvg += debugUtils.point(TailLeftPoint[0], TailLeftPoint[1], "yellow", "TL");
            const TailRightPoint = [width * tailShift + tailWidth, overlayFlipped ? height : 0];
            debugSvg += debugUtils.point(TailRightPoint[0], TailRightPoint[1], "orange", "TR");
            const TailEndPoint = [width * xPos, height * (overlayFlipped ? (1 - yPos) : (yPos))];
            debugSvg += debugUtils.point(TailEndPoint[0], TailEndPoint[1], "purple", "TE");

            // find the slope of either side lines of the tail polygon; create a y=mx+b equation for each side
            // convert SVG coordinates to mathematical coordinates (flip Y-axis)
            const mathTailLeftPoint = [TailLeftPoint[0], height - TailLeftPoint[1]];
            const mathTailRightPoint = [TailRightPoint[0], height - TailRightPoint[1]];
            const mathTailEndPoint = [TailEndPoint[0], height - TailEndPoint[1]];

            // left line equation: y = mx + b (in mathematical coordinates)
            const leftSlope = (mathTailEndPoint[1] - mathTailLeftPoint[1]) / (mathTailEndPoint[0] - mathTailLeftPoint[0]);
            const leftIntercept = mathTailLeftPoint[1] - leftSlope * mathTailLeftPoint[0];

            // right line equation: y = mx + b (in mathematical coordinates)
            const rightSlope = (mathTailEndPoint[1] - mathTailRightPoint[1]) / (mathTailEndPoint[0] - mathTailRightPoint[0]);
            const rightIntercept = mathTailRightPoint[1] - rightSlope * mathTailRightPoint[0];
            debugSvg += debugUtils.line(TailLeftPoint[0], TailLeftPoint[1], TailEndPoint[0], TailEndPoint[1], "blue", "L");
            debugSvg += debugUtils.line(TailRightPoint[0], TailRightPoint[1], TailEndPoint[0], TailEndPoint[1], "red", "R");

            // find intersection points between tail lines and bubble curve
            // solve: ax² + bx + c = mx + n (where m is slope, n is intercept)
            // rearranged: ax² + (b-m)x + (c-n) = 0

            let leftIntersectionSvg: [number, number] | null = null;
            let rightIntersectionSvg: [number, number] | null = null;
            let leftCubicPath = "";
            let rightCubicPath = "";

            // left line intersection with curve
            const leftQuadA = a;
            const leftQuadB = b - leftSlope;
            const leftQuadC = c - leftIntercept;
            const leftDiscriminant = leftQuadB * leftQuadB - 4 * leftQuadA * leftQuadC;

            if (leftDiscriminant >= 0) {
                const leftIntersectionX1 = (-leftQuadB + Math.sqrt(leftDiscriminant)) / (2 * leftQuadA);
                const leftIntersectionX2 = (-leftQuadB - Math.sqrt(leftDiscriminant)) / (2 * leftQuadA);

                // pick the intersection that's within our domain and makes sense geometrically
                const leftX = (leftIntersectionX1 >= 0 && leftIntersectionX1 <= width) ? leftIntersectionX1 : leftIntersectionX2;
                const leftY = leftSlope * leftX + leftIntercept;

                // convert back to SVG coordinates for display
                leftIntersectionSvg = [leftX, height - leftY];
                debugSvg += debugUtils.point(leftIntersectionSvg[0], leftIntersectionSvg[1], "lime", "IL");

                // create cubic bezier curve from left intersection to leftmost point of bubble
                leftCubicPath = createCubicBezierFromIntersection(
                    leftX,
                    leftIntersectionSvg as [number, number],
                    0,
                    [0, overlayFlipped ? height : 0],
                    P0 as [number, number],
                    P1 as [number, number],
                    P2 as [number, number],
                    "cyan",
                    "LC",
                    isBorder
                );
            }

            // right line intersection with curve
            const rightQuadA = a;
            const rightQuadB = b - rightSlope;
            const rightQuadC = c - rightIntercept;
            const rightDiscriminant = rightQuadB * rightQuadB - 4 * rightQuadA * rightQuadC;

            if (rightDiscriminant >= 0) {
                const rightIntersectionX1 = (-rightQuadB + Math.sqrt(rightDiscriminant)) / (2 * rightQuadA);
                const rightIntersectionX2 = (-rightQuadB - Math.sqrt(rightDiscriminant)) / (2 * rightQuadA);

                // pick the intersection that's within our domain and makes sense geometrically
                const rightX = (rightIntersectionX1 >= 0 && rightIntersectionX1 <= width) ? rightIntersectionX1 : rightIntersectionX2;
                const rightY = rightSlope * rightX + rightIntercept;

                // convert back to SVG coordinates for display
                rightIntersectionSvg = [rightX, height - rightY];
                debugSvg += debugUtils.point(rightIntersectionSvg[0], rightIntersectionSvg[1], "magenta", "IR");

                // create cubic bezier curve from right intersection to rightmost point of bubble
                rightCubicPath = createCubicBezierFromIntersection(
                    rightX,
                    rightIntersectionSvg as [number, number],
                    width,
                    [width, overlayFlipped ? height : 0],
                    P0 as [number, number],
                    P1 as [number, number],
                    P2 as [number, number],
                    "orange",
                    "RC",
                    isBorder
                );
            }

            // create additional border elements if this is a border
            let borderExtensions = "";
            let backgroundPath = "";
            if (isBorder) {
                // add cubic bezier curves to border
                if (leftCubicPath) {
                    borderExtensions += `\n<path d="${leftCubicPath}" ${pathAttributes}/>`;
                }
                if (rightCubicPath) {
                    borderExtensions += `\n<path d="${rightCubicPath}" ${pathAttributes}/>`;
                }

                // add lines from intersections (or line endpoints) to tail end
                if (leftIntersectionSvg) {
                    borderExtensions += `\n<line x1="${leftIntersectionSvg[0]}" y1="${leftIntersectionSvg[1]}" x2="${TailEndPoint[0]}" y2="${TailEndPoint[1]}" ${pathAttributes}/>`;
                } else {
                    // use left tail line endpoint if no intersection
                    borderExtensions += `\n<line x1="${TailLeftPoint[0]}" y1="${TailLeftPoint[1]}" x2="${TailEndPoint[0]}" y2="${TailEndPoint[1]}" ${pathAttributes}/>`;
                }

                if (rightIntersectionSvg) {
                    borderExtensions += `\n<line x1="${rightIntersectionSvg[0]}" y1="${rightIntersectionSvg[1]}" x2="${TailEndPoint[0]}" y2="${TailEndPoint[1]}" ${pathAttributes}/>`;
                } else {
                    // use right tail line endpoint if no intersection
                    borderExtensions += `\n<line x1="${TailRightPoint[0]}" y1="${TailRightPoint[1]}" x2="${TailEndPoint[0]}" y2="${TailEndPoint[1]}" ${pathAttributes}/>`;
                }
            } else {
                // if not a border:

                // add the tail polygon
                backgroundPath = `\n<polygon points="
                ${TailLeftPoint[0]}, ${TailLeftPoint[1]}
                ${TailRightPoint[0]}, ${TailRightPoint[1]}
                ${TailEndPoint[0]}, ${TailEndPoint[1]}
                " ${pathAttributes}/>`;

                // add cubic bezier curves to background, except connect them to the tail right and left respectively
                if (leftCubicPath) {
                    backgroundPath += `\n<path d="${leftCubicPath} L ${TailLeftPoint[0]}, ${TailLeftPoint[1]}" ${pathAttributes}/>`;
                }
                if (rightCubicPath) {
                    backgroundPath += `\n<path d="${rightCubicPath} L ${TailRightPoint[0]}, ${TailRightPoint[1]}" ${pathAttributes}/>`;
                }
            }

            return  `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">\n` +
                    `${isBorder ? borderExtensions : backgroundPath}\n` +
                    `</svg>`;
        }

        let overlayBuffer: Buffer | undefined;
        let borderBuffer: Buffer | undefined;
        let backgroundCutSvg: Buffer | undefined;

        if (backgroundColor !== "transparent") {
            const overlaySvg = createSvg(width, height, xPos, yPos, tailShift, tailWidth, overlayFlipped, backgroundColor, false);
            overlayBuffer = await sharp(Buffer.from(overlaySvg), {
                density: 300,  // Higher DPI for better quality
                limitInputPixels: false
            })
            .resize(width, height, { fit: 'fill' })  // Ensure exact dimensions match
            .png({ quality: 100, compressionLevel: 0 })
            .toBuffer();
        }

        if (borderColor !== "transparent") {
            const borderSvg = createSvg(width, height, xPos, yPos, tailShift, tailWidth, overlayFlipped, borderColor, true);
            borderBuffer = await sharp(Buffer.from(borderSvg), {
                density: 300,  // Higher DPI for better quality
                limitInputPixels: false
            })
            .resize(width, height, { fit: 'fill' })  // Ensure exact dimensions match
            .png({ quality: 100, compressionLevel: 0 })
            .toBuffer();
        }

        if (backgroundColor === "transparent") {
            const overlaySvg = createSvg(width, height, xPos, yPos, tailShift, tailWidth, overlayFlipped, "white", false);
            backgroundCutSvg = await sharp(Buffer.from(overlaySvg), {
                density: 300,  // Higher DPI for better quality
                limitInputPixels: false
            })
            .resize(width, height, { fit: 'fill' })  // Ensure exact dimensions match
            .png({ quality: 100, compressionLevel: 0 })
            .toBuffer();
        }

        debugSvg += `\n</svg>`;

        const debugOverlaySvg = await sharp(Buffer.from(debugSvg), {
            density: 300,  // Higher DPI for better quality
            limitInputPixels: false
        })
        .resize(width, height, { fit: 'fill' })  // Ensure exact dimensions match
        .png({ quality: 100, compressionLevel: 0 })
        .toBuffer();

        const composites: sharp.OverlayOptions[] = [];
        if (backgroundCutSvg) {
            composites.push({
                input: backgroundCutSvg,
                blend: "dest-out",
                gravity: "center",
                tile: true,
            });
        }

        if (overlayBuffer) {
            composites.push({
                input: overlayBuffer,
                blend: "over",
                gravity: "center",
                tile: true,
            });
        }
        if (borderBuffer) {
            composites.push({
                input: borderBuffer,
                blend: "over",
                gravity: "center",
                tile: true,
            });
        }

        if (debugOverlaySvg && debug) {
            composites.push({
                input: debugOverlaySvg,
                blend: "over",
                gravity: "center",
                tile: true,
            });
        }

        const outputBuffer = await inputImage
            .composite(composites)
            .toFormat("gif")
            .toBuffer();

        action.reply(invoker, {
            content: `here's your chat bubble\n x=\`${args.x || xPos}\`, y=\`${args.y || yPos}\`, gravity=\`${gravity}\`, border=\`${borderColor}\`, background=\`${backgroundColor}\``,
            files: [new AttachmentBuilder(outputBuffer, { name: "bubble.gif" })]
        })
    }
);

export default command;
