import fsextra from "fs-extra";
import fs from "fs";
import { inTextFilesList } from "./types/textFilesHandler.js";

const configNonDefault = await import("../../config.json", { assert: { type: 'json' }});
const config = configNonDefault.default

export async function generateLSText(path) {
    const files = fs.readdirSync(path);
    let text = "";
    for (let file = 0; file < files.length; file++) {
        text += `${files[file]}\n`;
    }
    return text;
}

export async function textToFile(text, name) {
    fsextra.ensureFileSync(`${config.paths.containers}/${name}.txt`);
    const file = `${config.paths.containers}/${name}.txt`;
    fs.writeFileSync(file, text);
    return file;
}

export async function inTextFilesHandler(text) {
    if (text.includes("file://")) {
        const files = text.split("file://");
        let filenames = [];
        files.forEach((file) => {
            const filename = file.substring(0, file.indexOf(" "));
            filenames.push(filename);
        });
        return new inTextFilesList({
            directFileNames: filenames,
            originalText: text,
        });
    } else {
        return text;
    }
}
