import { DBGPTAttachment } from "knex/types/tables";
import { TypeofAnyGPTAttachment, ErrorGPTAttachment, TextGPTAttachment, AudioGPTAttachment, ImageGPTAttachment, VideoGPTAttachment } from "./messageTypes";

export function parseDBAttachments(dbattachments: DBGPTAttachment[]) {
    return dbattachments.map((att) => {
        let usedClass: TypeofAnyGPTAttachment;
        let extraData: any = {};
        switch (att.type) {
            case "unknown":
                return undefined;
            case "error":
                usedClass = ErrorGPTAttachment;
                extraData = { error: att.error };
                break;
            case "text":
                usedClass = TextGPTAttachment;
                extraData = { content: att.content };
                break;
            case "audio":
                usedClass = AudioGPTAttachment;
                break;
            case "image":
                usedClass = ImageGPTAttachment;
                break;
            case "video":
                usedClass = VideoGPTAttachment;
                break;
            default:
                return undefined;
        }

        return new usedClass({
            ...extraData,
            expiresAt: new Date(att.expires_at),
            filename: att.filename,
            id: att.id,
            url: att.url,
            size: att.size
        });
    }).filter((a) => a != undefined);
}
