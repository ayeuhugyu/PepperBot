import fs from "fs-extra";
import { randomUUIDv7 } from "bun";

export function textToFile(text: string, filename: string) {
    const uniqueId = randomUUIDv7();
    fs.writeFileSync(`cache/containers/${filename}_${uniqueId}.txt`, text);
    return `cache/containers/${filename}_${uniqueId}.txt`;
}