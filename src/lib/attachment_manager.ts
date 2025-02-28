import { AttachmentPayload } from "discord.js";

export function textToAttachment(text: string, name: string, description?: string): AttachmentPayload {
    return {
        name,
        attachment: Buffer.from(text, "utf8"),
        description,
    }
}