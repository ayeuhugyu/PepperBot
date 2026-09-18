import sharp from "sharp";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

const parser = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath);

type Node = {
    type: string;
    value?: string;
    alt?: string;
    align?: Array<"left" | "center" | "right" | null>;
    children?: Node[];
    position?: {
        start: { offset?: number };
        end: { offset?: number };
    };
    url?: string;
    title?: string | null;
};

export type TableMatch = {
    kind: "table";
    start: number;
    end: number;
    source: string;
};

export function findTables(content: string): TableMatch[] {
    const matches: TableMatch[] = [];

    function visit(node: Node): void {
        if (node.type === "table") {
            const start = node.position?.start.offset;
            const end = node.position?.end.offset;

            if (start !== undefined && end !== undefined) {
                matches.push({
                    kind: "table",
                    start,
                    end,
                    source: content.slice(start, end),
                });
            }

            return;
        }

        for (const child of node.children ?? []) {
            visit(child);
        }
    }

    visit(parser.parse(content) as Node);

    return matches.sort((a, b) => a.start - b.start);
}

export interface TableRenderOptions {
    maxWidth?: number;
    maxColumnWidth?: number;
    fontSize?: number;
    fontFamily?: string;
    fontFile?: string;
}

function plainText(node: Node, source: string): string {
    if (node.type === "link" || node.type === "linkReference") {
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;

        if (start !== undefined && end !== undefined) {
            return source.slice(start, end);
        }
    }

    if (node.type === "break") return "\n";
    if (node.type === "image") return node.alt ?? "";
    if (node.value !== undefined) return node.value;

    return (node.children ?? [])
        .map((child) => plainText(child, source))
        .join("");
}

function cellMarkup(node: Node, source: string): string {
    if (node.type === "link" && node.url) {
        const label = (node.children ?? [])
            .map((child) => cellMarkup(child, source))
            .join("");

        const url = escapeMarkup(node.url);

        const title = node.title
            ? ` &quot;${escapeMarkup(node.title)}&quot;`
            : "";

        return (
            `[${label}](` +
            `<span foreground="#60a5fa">${url}</span>` +
            `${title})`
        );
    }

    if (node.type === "linkReference") {
        return escapeMarkup(plainText(node, source));
    }

    if (node.type === "break") return "\n";

    if (node.type === "image") {
        return escapeMarkup(node.alt ?? "");
    }

    if (node.value !== undefined) {
        return escapeMarkup(node.value);
    }

    return (node.children ?? [])
        .map((child) => cellMarkup(child, source))
        .join("");
}

function escapeMarkup(text: string): string {
    return text
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export async function renderTable(
    markdown: string,
    options: TableRenderOptions = {},
): Promise<Buffer> {
    if (markdown.length > 30_000) {
        throw new RangeError("table source is too large");
    }

    const root = parser.parse(markdown) as Node;

    function findTable(node: Node): Node | undefined {
        if (node.type === "table") return node;

        for (const child of node.children ?? []) {
            const found = findTable(child);
            if (found) return found;
        }

        return undefined;
    }

    const table = findTable(root);

    if (!table) {
        throw new Error("no markdown table found");
    }

    const rows = table.children ?? [];
    const columns = rows[0]?.children?.length ?? 0;

    if (
        rows.length === 0 ||
        rows.length > 60 ||
        columns === 0 ||
        columns > 12
    ) {
        throw new RangeError("table exceeds row/column limits");
    }

    const maxWidth = options.maxWidth ?? 800;
    const maxColumnWidth = options.maxColumnWidth ?? 240;
    const fontSize = options.fontSize ?? 14;
    const fontFamily = options.fontFamily ?? "sans";

    if (
        !Number.isFinite(maxWidth) ||
        maxWidth < 100 ||
        maxWidth > 2_000 ||
        !Number.isFinite(maxColumnWidth) ||
        maxColumnWidth < 40 ||
        maxColumnWidth > 2_000 ||
        !Number.isFinite(fontSize) ||
        fontSize < 8 ||
        fontSize > 40
    ) {
        throw new RangeError("invalid table rendering options");
    }

    const paddingX = 12;
    const paddingY = 9;

    const columnLimit = Math.floor(
        Math.min(maxColumnWidth, (maxWidth - 1) / columns),
    );

    const textWidth = columnLimit - paddingX * 2;

    if (textWidth < 20) {
        throw new RangeError("too many columns for the requested width");
    }

    type CellImage = {
        data: Buffer;
        width: number;
        height: number;
    };

    const cells: Array<Array<CellImage | null>> = [];
    const columnWidths = Array<number>(columns).fill(48);
    const rowHeights: number[] = [];

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row: Array<CellImage | null> = [];
        let rowHeight = Math.ceil(fontSize * 1.4) + paddingY * 2;

        for (let column = 0; column < columns; column++) {
            const node = rows[rowIndex].children?.[column];
            const text = node ? plainText(node, markdown).trim() : "";

            if (text.length > 2_000) {
                throw new RangeError("table cell is too long");
            }

            if (!text) {
                row.push(null);
                continue;
            }

            const alignment = table.align?.[column] ?? "left";
            const weight = rowIndex === 0 ? "bold" : "normal";

            const { data, info } = await sharp({
                text: {
                    text: `
                        <span foreground="#f2f3f5" weight="${weight}">${node ? cellMarkup(node, markdown) : ""}</span>
                    `.trim(),
                    font: `${fontFamily} ${fontSize}`,
                    ...(options.fontFile
                        ? { fontfile: options.fontFile }
                        : {}),
                    width: textWidth,
                    wrap: "word-char",
                    align: alignment,
                    rgba: true,
                    dpi: 72,
                },
            })
                .toColourspace("srgb")
                .png()
                .toBuffer({ resolveWithObject: true });

            row.push({
                data,
                width: info.width,
                height: info.height,
            });

            columnWidths[column] = Math.max(
                columnWidths[column],
                info.width + paddingX * 2,
            );

            rowHeight = Math.max(
                rowHeight,
                info.height + paddingY * 2,
            );
        }

        cells.push(row);
        rowHeights.push(rowHeight);
    }

    const width = columnWidths.reduce((sum, value) => sum + value, 0) + 1;
    const height = rowHeights.reduce((sum, value) => sum + value, 0) + 1;

    if (width > maxWidth || height > 4_000) {
        throw new RangeError("rendered table exceeds image size limits");
    }

    const backgrounds: string[] = [];
    const overlays: sharp.OverlayOptions[] = [];

    let y = 0;

    for (let rowIndex = 0; rowIndex < cells.length; rowIndex++) {
        let x = 0;

        const background =
            rowIndex === 0
                ? "#36393f"
                : rowIndex % 2 === 0
                  ? "#292b30"
                  : "#202225";

        for (let column = 0; column < columns; column++) {
            const cellWidth = columnWidths[column];
            const cellHeight = rowHeights[rowIndex];

            backgrounds.push(`
                <rect
                    x="${x + 0.5}"
                    y="${y + 0.5}"
                    width="${cellWidth}"
                    height="${cellHeight}"
                    fill="${background}"
                    stroke="#45474d"
                    stroke-width="1"
                />
            `);

            const cell = cells[rowIndex][column];

            if (cell) {
                const alignment = table.align?.[column] ?? "left";

                const spareWidth = Math.max(
                    0,
                    cellWidth - paddingX * 2 - cell.width,
                );

                const offset =
                    alignment === "right"
                        ? spareWidth
                        : alignment === "center"
                          ? Math.floor(spareWidth / 2)
                          : 0;

                overlays.push({
                    input: cell.data,
                    left: x + paddingX + offset,
                    top: y + paddingY,
                });
            }

            x += cellWidth;
        }

        y += rowHeights[rowIndex];
    }

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="${width}"
            height="${height}"
        >
            ${backgrounds.join("")}
        </svg>
    `;

    return sharp(Buffer.from(svg))
        .toColourspace("srgb")
        .composite(overlays)
        .png()
        .toBuffer();
}