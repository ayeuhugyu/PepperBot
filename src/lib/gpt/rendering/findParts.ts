import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";

const parser = unified()
    .use(remarkParse)
    .use(remarkMath);

type MarkdownNode = {
    type: string;
    value?: string;
    children?: MarkdownNode[];
    position?: {
        start: { offset?: number };
        end: { offset?: number };
    };
    url?: string;
    alt?: string;
};

type MathMatch = {
    start: number;
    end: number;
    latex: string;
    displayMode: boolean;
};

const codeParser = unified().use(remarkParse);

function shouldRenderMath(
    content: string,
    match: MathMatch,
    maxInlineLength = 3,
): boolean {
    if (match.displayMode) {
        return true;
    }

    const expressionLength = match.latex.replace(/\s+/g, "").length;

    if (expressionLength > maxInlineLength) {
        return true;
    }

    const lineStart =
        content.lastIndexOf("\n", Math.max(0, match.start - 1)) + 1;

    const nextNewline = content.indexOf("\n", match.end);
    const lineEnd = nextNewline === -1 ? content.length : nextNewline;

    const before = content.slice(lineStart, match.start).trim();
    const after = content.slice(match.end, lineEnd).trim();

    return before.length === 0 && after.length === 0;
}

export function findMath(content: string): MathMatch[] {
    type Range = {
        start: number;
        end: number;
    };

    const codeRanges: Range[] = [];
    const candidates: MathMatch[] = [];

    function walk(
        node: MarkdownNode,
        visitor: (node: MarkdownNode) => void,
    ): void {
        visitor(node);

        for (const child of node.children ?? []) {
            walk(child, visitor);
        }
    }

    function getRange(node: MarkdownNode): Range | undefined {
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;

        if (start === undefined || end === undefined) {
            return undefined;
        }

        return { start, end };
    }

    walk(codeParser.parse(content) as MarkdownNode, (node) => {
        if (node.type !== "code" && node.type !== "inlineCode") {
            return;
        }

        const range = getRange(node);

        if (range) {
            codeRanges.push(range);
        }
    });

    function overlapsCode(start: number, end: number): boolean {
        return codeRanges.some(
            (range) => start < range.end && end > range.start,
        );
    }

    function isEscaped(index: number): boolean {
        let backslashes = 0;

        for (
            let i = index - 1;
            i >= 0 && content[i] === "\\";
            i--
        ) {
            backslashes++;
        }

        return backslashes % 2 === 1;
    }

    walk(parser.parse(content) as MarkdownNode, (node) => {
        if (node.type !== "math" && node.type !== "inlineMath") {
            return;
        }

        const range = getRange(node);

        if (!range || overlapsCode(range.start, range.end)) {
            return;
        }

        const raw = content.slice(range.start, range.end);

        const isSingleDollarInline =
            node.type === "inlineMath" &&
            raw.startsWith("$") &&
            !raw.startsWith("$$");

        if (isSingleDollarInline) {
            const afterOpening = content[range.start + 1] ?? "";
            const beforeClosing = content[range.end - 2] ?? "";
            const afterClosing = content[range.end] ?? "";

            if (
                /\s/.test(afterOpening) ||
                /\s/.test(beforeClosing) ||
                /[0-9]/.test(afterClosing)
            ) {
                return;
            }
        }

        candidates.push({
            ...range,
            latex: node.value ?? "",
            displayMode: node.type === "math",
        });
    });

    const openingDelimiter = /\\[(\[]/g;
    let opening: RegExpExecArray | null;

    while ((opening = openingDelimiter.exec(content)) !== null) {
        const start = opening.index;

        if (isEscaped(start) || overlapsCode(start, start + 2)) {
            continue;
        }

        const displayMode = opening[0] === "\\[";
        const closingDelimiter = displayMode ? "\\]" : "\\)";
        const bodyStart = start + 2;

        let closingIndex = content.indexOf(
            closingDelimiter,
            bodyStart,
        );

        while (
            closingIndex !== -1 &&
            isEscaped(closingIndex)
        ) {
            closingIndex = content.indexOf(
                closingDelimiter,
                closingIndex + 2,
            );
        }

        if (closingIndex === -1) {
            continue;
        }

        const end = closingIndex + 2;

        if (overlapsCode(start, end)) {
            continue;
        }

        const latex = content.slice(bodyStart, closingIndex).trim();

        if (!latex) {
            continue;
        }

        candidates.push({
            start,
            end,
            latex,
            displayMode,
        });

        openingDelimiter.lastIndex = end;
    }

    candidates.sort((a, b) => a.start - b.start || b.end - a.end);

    const matches: MathMatch[] = [];
    let previousEnd = -1;

    for (const candidate of candidates) {
        if (candidate.start < previousEnd) {
            continue;
        }

        matches.push(candidate);
        previousEnd = candidate.end;
    }

    return matches.filter((match) =>
        shouldRenderMath(content, match),
    );
}

type ImageMatch = {
    kind: "image";
    start: number;
    end: number;
    url: string;
    description: string;
};

export function findImages(content: string): ImageMatch[] {
    const matches: ImageMatch[] = [];

    function visit(node: MarkdownNode): void {
        if (node.type === "image") {
            const start = node.position?.start.offset;
            const end = node.position?.end.offset;

            if (
                start === undefined ||
                end === undefined ||
                !node.url
            ) {
                return;
            }

            try {
                const url = new URL(node.url);

                if (
                    !["https:", "http:"].includes(url.protocol) ||
                    url.username ||
                    url.password
                ) {
                    return;
                }

                matches.push({
                    kind: "image",
                    start,
                    end,
                    url: url.href,
                    description: node.alt ?? "",
                });
            } catch {
                // do nothing
            }

            return;
        }

        for (const child of node.children ?? []) {
            visit(child);
        }
    }

    visit(parser.parse(content) as MarkdownNode);

    return matches;
}

type SeparatorMatch = {
    kind: "separator";
    start: number;
    end: number;
};

export function findSeparators(content: string): SeparatorMatch[] {
    const matches: SeparatorMatch[] = [];

    function visit(node: MarkdownNode): void {
        if (node.type === "thematicBreak") {
            const start = node.position?.start.offset;
            const end = node.position?.end.offset;

            if (start !== undefined && end !== undefined) {
                matches.push({
                    kind: "separator",
                    start,
                    end,
                });
            }

            return;
        }

        for (const child of node.children ?? []) {
            visit(child);
        }
    }

    visit(parser.parse(content) as MarkdownNode);

    return matches;
}