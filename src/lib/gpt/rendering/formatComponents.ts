import type { AttachmentPayload } from "discord.js";
import { type TopLevelComponent } from "../../discord_action";
import { renderLatex } from "./renderLatex"; // Adjust this path.
import { MediaGallery, Separator, SeparatorSpacing, TextDisplay, Thumbnail } from "../../classes/components";
import { findImages, findMath, findSeparators } from "./findParts";
import { findTables, renderTable } from "./renderTable";

export async function formatComponents(
    content: string,
): Promise<{
    components: TopLevelComponent[];
    attachments: AttachmentPayload[];
}> {
    const components: TopLevelComponent[] = [];
    const attachments: AttachmentPayload[] = [];

    let cursor = 0;
    let pendingText = "";
    let totalTextLength = 0;

    function flushText(): void {
        if (pendingText.trim()) {
            components.push(
                new TextDisplay({
                    content: pendingText,
                }),
            );

            totalTextLength += pendingText.length;
        }

        pendingText = "";
    }

    const candidates = [
        ...findTables(content),
        ...findImages(content),
        ...findSeparators(content),
        ...findMath(content).map((match) => ({
            ...match,
            kind: "math" as const,
        })),
    ].sort(
        (a, b) => a.start - b.start || b.end - a.end,
    );

    const matches: typeof candidates = [];
    let previousEnd = -1;

    for (const candidate of candidates) {
        if (candidate.start < previousEnd) continue;

        matches.push(candidate);
        previousEnd = candidate.end;
    }

    for (const match of matches) {
        pendingText += content.slice(cursor, match.start);

        const original = content.slice(match.start, match.end);
        cursor = match.end;

        if (attachments.length >= 10) {
            pendingText += original;
            continue;
        }

        if (match.kind === "separator") {
            flushText();

            components.push(
                new Separator({
                    divider: true,
                    spacing: SeparatorSpacing.Small,
                }),
            );

            continue;
        }

        if (match.kind === "image") {
            flushText();

            components.push(
                new MediaGallery({
                    media: [
                        new Thumbnail({
                            url: match.url,
                            description:
                                match.description.slice(0, 1_024) || undefined,
                        }),
                    ],
                }),
            );

            continue;
        }

        let image: Buffer;

        try {
            image =
                match.kind === "table"
                    ? await renderTable(match.source)
                    : await renderLatex(match.latex, match.displayMode);
        } catch {
            pendingText += original;
            continue;
        }

        flushText();

        const name = `latex-${attachments.length}.png`;

        attachments.push({
            attachment: image,
            name,
        });

        components.push(
            new MediaGallery({
                media: [
                    new Thumbnail({
                        url: `attachment://${name}`,
                    }),
                ],
            }),
        );
    }

    pendingText += content.slice(cursor);
    flushText();

    if (components.length > 40 || totalTextLength > 4_000) {
        throw new RangeError(
            "response exceeds discord message's limits",
        );
    }

    return { components, attachments };
}