import { AttachmentFlags, Client, MessageType, User, type Message, type Collection, APIAttachment } from "discord.js";
import { type OmitMethods } from "../omitMethods";
import { randomId } from "../id";
import { type ToolName } from "./tools";
import { type ToolResponse } from "./toolTypes";
import * as log from "../log";
import { Conversation } from "./conversation";
import { MIMEType } from "node:util";

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
    contentType?: MIMEType;
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
                contentType: attachment.contentType ? new MIMEType(attachment.contentType) : undefined,
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

    async fetchDiscordMessage(): Promise<Message | undefined> {
        if (this.beenDeleted) {
            return undefined;
        }
        if (!client) {
            log.warn("attempt to fetch discord message for gpt user message without initializing client");
            return undefined;
        }

        // if this fails due to the message not existing, consider the message deleted
        try {
            const channel = await client.channels.fetch(this.discordData.channelId);
            if (!channel?.isTextBased()) {
                log.warn("channel for gpt user message is not text based or does not exist", { channelId: this.discordData.channelId });
                this.beenDeleted = true;
                return undefined;
            }
            const message = await channel.messages.fetch(this.discordData.messageId);
            return message;
        } catch (error) {
            log.error("failed to fetch discord message for gpt user message, marking as deleted", { messageId: this.discordData.messageId, channelId: this.discordData.channelId, error });
            this.beenDeleted = true;
            return undefined;
        }
    }

    async fetchUser(): Promise<User | undefined> {
        if (!client) {
            log.warn("attempt to fetch gpt user without initializing client");
            return undefined;
        }

        try {
            return await client.users.fetch(this.author.id);
        } catch (error) {
            log.error("failed to fetch user for gpt message", { userId: this.author.id, error });
            return undefined;
        }
    }
}

export class GPTAssistantMessage implements GPTBaseMessage {
    readonly type = GPTMessageType.Assistant;
    id: string = randomId("gpt-assistant-message");
    createdAt: Date = new Date();
    attachments: GPTAttachment[] = [];
    content: string;
    toolCallIds: string[]; // list of tool call ids associated with this message
    beenDeleted: boolean = false;
    sent?: boolean = false;
    discordData?: GPTDiscordData;

    constructor(data: Omit<OmitMethods<GPTAssistantMessage>, "id" | "type" | "sent" | "createdAt">) {
        this.attachments = data.attachments;
        this.content = data.content;
        this.toolCallIds = data.toolCallIds;
        this.beenDeleted = data.beenDeleted;
        this.discordData = data.discordData;
    }

    async fetchDiscordMessage(): Promise<Message | undefined> {
        if (this.beenDeleted || !this.discordData || !this.sent) {
            return undefined;
        }
        if (!client) {
            log.warn("attempt to fetch discord message for gpt assistant message without initializing client");
            return undefined;
        }

        try {
            const channel = await client.channels.fetch(this.discordData.channelId);
            if (!channel?.isTextBased()) {
                log.warn("channel for gpt assistant message is not text based or does not exist", { channelId: this.discordData.channelId });
                this.beenDeleted = true;
                return undefined;
            }
            const message = await channel.messages.fetch(this.discordData.messageId);
            return message;
        } catch (error) {
            log.error("failed to fetch discord message for gpt assistant message, marking as deleted", { messageId: this.discordData.messageId, channelId: this.discordData.channelId, error });
            this.beenDeleted = true;
            return undefined;
        }
    }

    fetchToolCalls(conversation: Conversation): Collection<number, GPTToolCall> {
        return conversation.messages.filter(m => {
            if (m.type === GPTMessageType.ToolCall) {
                return (this.toolCallIds.includes(m.toolCallId));
            }
            return false;
        }) as Collection<number, GPTToolCall>;
    }
}

export class GPTToolCall implements GPTBaseMessage {
    readonly type = GPTMessageType.ToolCall;
    id: string = randomId("gpt-tool-call");
    createdAt: Date = new Date();
    toolCallId: string = randomId("gpt-tool-call-id"); // this is the id that will be sent to openai, and should be used to match tool calls and responses. openai will more than likely provide their own.
    toolName: ToolName | string; // | string because there's no way to know the names of custom tools
    arguments: Record<string, unknown>;
    answered: boolean = false;

    constructor(data: Omit<OmitMethods<GPTToolCall>, "type" | "id" | "createdAt" | "answered">) {
        this.toolCallId = data.toolCallId ?? randomId("gpt-tool-call-id");
        this.toolName = data.toolName;
        this.arguments = data.arguments;
    }

    fetchResponse(conversation: Conversation): GPTToolResponse | undefined {
        return conversation.messages.filter((m) => {
            if (m.type === GPTMessageType.ToolResponse) {
                if (m.toolCallId === this.toolCallId) return true
            }
            return false;
        }).first() as GPTToolResponse | undefined;
    }
}

export class GPTToolResponse implements GPTBaseMessage {
    readonly type = GPTMessageType.ToolResponse;
    id: string = randomId("gpt-tool-response");
    createdAt: Date = new Date();
    toolCallId: string;
    toolName: ToolName | string; // | string because there's no way to know the names of custom tools
    response: ToolResponse<unknown>;

    constructor(data: Omit<OmitMethods<GPTToolResponse>, "id" | "type" | "createdAt">) {
        this.toolCallId = data.toolCallId;
        this.toolName = data.toolName;
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

export type GPTMessageTypeMap = {
    [GPTMessageType.User]: GPTUserMessage;
    [GPTMessageType.Assistant]: GPTAssistantMessage;
    [GPTMessageType.ToolCall]: GPTToolCall;
    [GPTMessageType.ToolResponse]: GPTToolResponse;
    [GPTMessageType.System]: GPTSystemMessage;
};