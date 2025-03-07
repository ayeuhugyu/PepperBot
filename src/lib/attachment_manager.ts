import { AttachmentPayload } from "discord.js";

export function textToAttachment(text: string, name: string, description?: string): AttachmentPayload {
    return {
        name,
        attachment: Buffer.from(text, "utf8"),
        description,
    }
}

export function fixFileName(name: string, extensionless = false): string {
    const fileNameWithoutExtension = extensionless ? name : name.slice(0, name.lastIndexOf("."));
    const extension = extensionless ? "" : name.slice(name.lastIndexOf("."));
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
            .slice(0, 200) + extension.slice(0, 50);
    return correctedFileName;
}