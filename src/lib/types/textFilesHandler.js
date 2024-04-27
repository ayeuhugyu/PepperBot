import fs from "fs";

const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));

export class inTextFilesList {
    constructor({ directFileNames, originalText }) {
        this.originalText = originalText;
        this.directFileNames = directFileNames;
    }
    async replaceInTextFiles() {
        let text = this.originalText;
        this.directFileNames.forEach(async (file) => {
            const fileText = await fs.readFileSync(
                `${config.paths.filehost}/file`,
                "utf-8"
            );
            text = text.replace(`file://${file}`, fileText);
        });
        return text;
    }
}
