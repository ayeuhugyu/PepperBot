import { AttachmentFlags, Message, type APIAttachment } from "discord.js";
import { OmitMethods } from "../omitMethods";
import { randomId } from "../id";
import * as log from "../log";


export enum GPTMessageType {
    User = 'user',
    Assistant = 'assistant',
    ToolCall = 'tool_call',
    ToolResponse = 'tool_response',
    System = 'system'
}

export interface GPTBaseMessage {
    readonly type: GPTMessageType;
    id: string;
}

// each type will need to have its own properties

export interface GPTUser {
    id: string;
    username: string;
    avatar: string;
}

interface GPTDiscordData {
    messageId: string;
    referenceMessageId?: string;
    channelId: string;
    guildId?: string;
}

interface GPTAttachment {
    id: string;
    filename: string;
    url: string;
    proxyUrl: string;
    size: number;
    contentType?: string;
    height?: number | null;
    width?: number | null;
    durationSecs?: number;
    waveform?: string;
    isRemix: boolean; // found in AttachmentFlags
}

export class GPTUserMessage implements GPTBaseMessage {
    readonly type = GPTMessageType.User;
    id: string = randomId("gpt-user-message");
    author: GPTUser;
    attachments: GPTAttachment[] = [];
    content: string;
    beenDeleted: boolean = false;
    discordData: GPTDiscordData;

    constructor(data: Pick<OmitMethods<GPTUserMessage>, "author" | "attachments" | "content" | "beenDeleted" | "discordData">) {
        this.author = data.author;
        this.attachments = data.attachments;
        this.content = data.content;
        this.beenDeleted = data.beenDeleted;
        this.discordData = data.discordData;
    }

    static fromMessage(message: Message): GPTUserMessage {
        return new GPTUserMessage({
            author: {
                id: message.author.id,
                username: message.author.username,
                avatar: message.author.displayAvatarURL()
            },
            attachments: message.attachments.map((attachment): GPTAttachment => ({
                id: attachment.id,
                filename: attachment.name ?? 'unknown',
                url: attachment.url,
                proxyUrl: attachment.proxyURL,
                size: attachment.size,
                contentType: attachment.contentType ?? undefined,
                height: attachment.height,
                width: attachment.width,
                durationSecs: attachment.duration ?? undefined,
                waveform: attachment.waveform ?? undefined,
                isRemix: attachment.flags.has(AttachmentFlags.IsRemix),
            })),
            content: message.content,
            beenDeleted: false,
            discordData: {
                messageId: message.id,
                referenceMessageId: message.reference?.messageId,
                channelId: message.channel.id,
                guildId: message.guild?.id
            }
        });
    };
}

export class GPTAssistantMessage implements GPTBaseMessage {
    readonly type = GPTMessageType.Assistant;
    id: string = randomId("gpt-assistant-message");
    attachments: GPTAttachment[] = [];
    content: string;
    beenDeleted: boolean = false;
    sent?: boolean = false;
    discordData: GPTDiscordData;

    constructor(data: Pick<OmitMethods<GPTAssistantMessage>, "attachments" | "content" | "beenDeleted" | "sent" | "discordData">) {
        this.attachments = data.attachments;
        this.content = data.content;
        this.beenDeleted = data.beenDeleted;
        this.sent = data.sent;
        this.discordData = data.discordData;
    }
}