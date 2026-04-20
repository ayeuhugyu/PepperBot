import { AttachmentFlags, Client, type Message } from "discord.js";
import { type OmitMethods } from "../omitMethods";
import { randomId } from "../id";
import { type ToolName } from "./tools";
import { type ToolResponse } from "./toolTypes";
import * as log from "../log";

let client: Client | null = null;
export function initGPTFetchClient(newClient: Client) {
    client = newClient;
}



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
    createdAt: Date;
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
    createdAt: Date = new Date();
    author: GPTUser;
    attachments: GPTAttachment[] = [];
    content: string;
    beenDeleted: boolean = false;
    discordData: GPTDiscordData;

    constructor(data: Omit<OmitMethods<GPTUserMessage>, "id" | "type">) {
        this.author = data.author;
        this.attachments = data.attachments;
        this.content = data.content;
        this.beenDeleted = data.beenDeleted;
        this.discordData = data.discordData;
    }

    static fromMessage(message: Message): GPTUserMessage {
        return new GPTUserMessage({
            createdAt: message.createdAt,
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
    createdAt: Date = new Date();
    attachments: GPTAttachment[] = [];
    content: string;
    beenDeleted: boolean = false;
    sent?: boolean = false;
    discordData?: GPTDiscordData;

    constructor(data: Omit<OmitMethods<GPTAssistantMessage>, "id" | "type" | "sent" | "createdAt">) {
        this.attachments = data.attachments;
        this.content = data.content;
        this.beenDeleted = data.beenDeleted;
        this.discordData = data.discordData;
    }
}

export class GPTToolCall implements GPTBaseMessage {
    readonly type = GPTMessageType.ToolCall;
    id: string = randomId("gpt-tool-call");
    createdAt: Date = new Date();
    toolCallId: string = randomId("gpt-tool-call-id"); // this is the id that will be sent to openai, and should be used to match tool calls and responses. openai will more than likely provide their own.
    toolName: ToolName | string; // | string because there's no way to know the names of custom tools
    arguments: Record<string, unknown>;

    constructor(data: Omit<OmitMethods<GPTToolCall>, "type" | "id" | "createdAt">) {
        this.toolCallId = data.toolCallId ?? randomId("gpt-tool-call-id");
        this.toolName = data.toolName;
        this.arguments = data.arguments;
    }
}

export class GPTToolResponse implements GPTBaseMessage {
    readonly type = GPTMessageType.ToolResponse;
    id: string = randomId("gpt-tool-response");
    createdAt: Date = new Date();
    toolCallId: string;
    response: ToolResponse<unknown>;

    constructor(data: Omit<OmitMethods<GPTToolResponse>, "id" | "type" | "createdAt">) {
        this.toolCallId = data.toolCallId;
        this.response = data.response;
    }
}

export class GPTSystemMessage implements GPTBaseMessage {
    readonly type = GPTMessageType.System;
    id: string = randomId("gpt-system-message");
    createdAt: Date = new Date();
    content: string;

    constructor(data: Omit<OmitMethods<GPTSystemMessage>, "id" | "type" | "createdAt">) {
        this.content = data.content;
    }
}

export type AnyGPTMessage = GPTUserMessage | GPTAssistantMessage | GPTToolCall | GPTToolResponse | GPTSystemMessage;