import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html";
import { TeX } from "mathjax-full/js/input/tex";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages";
import { mathjax } from "mathjax-full/js/mathjax";
import { SVG } from "mathjax-full/js/output/svg";
import sharp from "sharp";

// Initialize once, not once per expression.
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const document = mathjax.document("", {
    InputJax: new TeX({
        packages: AllPackages,
        maxBuffer: 16384,
        maxMacros: 1000,

        formatError: (_jax: any, error: any) => {
            throw error;
        },
    }),

    OutputJax: new SVG({
        fontCache: "none",
    }),
});

function svgDimensionToPixels(value: string): number {
    const match = /^(\d+(?:\.\d+)?)(ex|em|px)?$/.exec(value);

    if (!match) {
        throw new Error(`Unsupported SVG dimension: ${value}`);
    }

    const amount = Number(match[1]);

    switch (match[2]) {
        case "ex":
            return amount * 10;
        case "em":
            return amount * 20;
        default:
            return amount;
    }
}

export function latexToSvg(
    latex: string,
    displayMode = true
): string {
    if (latex.length > 16384) {
        throw new RangeError("LaTeX expression is too long.");
    }

    const container = document.convert(latex, {
        display: displayMode,
        em: 20,
        ex: 10,
        containerWidth: 1200,
    });

    const svgNode = adaptor.tags(container, "svg")[0];

    if (!svgNode) {
        throw new Error("mathjax did not produce an svg");
    }

    const width = svgDimensionToPixels(
        adaptor.getAttribute(svgNode, "width")
    );

    const height = svgDimensionToPixels(
        adaptor.getAttribute(svgNode, "height")
    );

    if (!Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0 ||
        width > 2000 ||
        height > 2000) {
        throw new RangeError("equation exceeds image size limits");
    }

    adaptor.setAttribute(svgNode, "width", String(Math.ceil(width)));
    adaptor.setAttribute(svgNode, "height", String(Math.ceil(height)));

    return adaptor
        .outerHTML(svgNode)
        .replace(/currentColor/g, "#f2f3f5");
}

export async function svgToPng(svg: string): Promise<Buffer> {
    const background = "#202225";

    return sharp(Buffer.from(svg), {
        density: 72,
        limitInputPixels: 16_000_000,
    })
        .resize({
            width: 700,
            withoutEnlargement: true,
        })
        .flatten({ background })
        .extend({
            top: 6,
            bottom: 6,
            left: 10,
            right: 10,
            background,
        })
        .png()
        .toBuffer();
}

export async function renderLatex(
    latex: string,
    displayMode = true
): Promise<Buffer> {
    return svgToPng(latexToSvg(latex, displayMode));
}
