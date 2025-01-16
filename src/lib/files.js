import fsextra from "fs-extra";
import fs from "fs";
import * as globals from "./globals.js";
import * as log from "./log.js";

const config = globals.config;

export function generateLSText(path, truncateFileExtensions) {
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
            .replaceAll(",", "_")
            .slice(0, 200) + name.slice(name.lastIndexOf(".")).slice(0, 50);
    return correctedFileName;
}

export function readLinesBetween(filePath, startIndex, endIndex, callback) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return callback(err);
        }
        const lines = data.trim().split('\n');
        
        // Ensure startIndex and endIndex are within bounds
        const start = Math.max(startIndex, 0);
        const end = Math.min(endIndex, lines.length);

        // Read lines between start and end indices
        const resultLines = lines.slice(start, end).join('\n');

        callback(null, resultLines);
    });
}

export function getFileLength(filePath, callback) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return callback(err);
        }
        const lines = data.trim().split('\n');
        callback(null, lines.length);
    });
}