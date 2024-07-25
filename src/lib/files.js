import fsextra from "fs-extra";
import fs from "fs";
import * as globals from "./globals.js";

const config = globals.config;

export async function generateLSText(path, truncateFileExtensions) {
    const files = fs.readdirSync(path);
    let text = "";
    for (let file = 0; file < files.length; file++) {
        text += `${files[file]}\n`;
    }
    if (truncateFileExtensions) {
        const lines = text.split("\n");
        const truncatedLines = lines.map((line) => {
            const lastDotIndex = line.lastIndexOf(".");
            if (lastDotIndex !== -1) {
                return line.slice(0, lastDotIndex);
            }
            return line;
        });
        text = truncatedLines.join("\n");
    }
    return text;
}

export async function textToFile(text, name) {
    await fsextra.ensureFile(`resources/containers/${name}.txt`, () => {});
    const file = `resources/containers/${name}.txt`;
    await fs.writeFile(file, text, () => {});
    return file;
}

export function fixFileName(name) {
    const fileNameWithoutExtension = name.slice(0, name.lastIndexOf("."));
    const correctedFileName =
        fileNameWithoutExtension
            .toLowerCase()
            .replaceAll(" ", "_")
            .replaceAll("-", "_")
            .replaceAll("/", "_")
            .replaceAll("\\", "_")
            .replaceAll(".", "_")
            .replaceAll("|", "_")
            .replaceAll('"', "_")
            .replaceAll(":", "_")
            .replaceAll("?", "_")
            .replaceAll("*", "_")
            .replaceAll("<", "_")
            .replaceAll(">", "_")
            .replaceAll(";", "_")
            .replaceAll(",", "_") + name.slice(name.lastIndexOf("."));
    return correctedFileName;
}
