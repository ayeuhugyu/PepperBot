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
        const truncatedLines = lines.map(line => {
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
    fsextra.ensureFileSync(`${config.paths.containers}/${name}.txt`);
    const file = `${config.paths.containers}/${name}.txt`;
    await fs.writeFileSync(file, text);
    return file;
}

export function fixFileName(name) {
    const correctedFileName = name
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
        .replaceAll(",", "_")
    return correctedFileName;
}
