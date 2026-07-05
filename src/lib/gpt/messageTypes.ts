import { AttachmentFlags, Client, MessageType, User, type Message, type Collection, APIAttachment } from "discord.js";
import { type OmitMethods } from "../omitMethods";
import { randomId } from "../id";
import { type ToolName } from "./tools";
import { ToolErrorResponse, ToolSuccessResponse, type ToolResponse } from "./toolTypes";
import * as log from "../log";
import { Conversation } from "./conversation";
import { lookup } from "mime-types";
import { existsSync } from "fs-extra";
import { readFileSync, writeFileSync } from "node:fs";
import prettyBytes from "pretty-bytes";
import database from "../data_manager";
import { parseDBAttachments } from "./parseDbAttachments";

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
    avatar?: string;
}

interface GPTDiscordData {
    messageId: string;
    referenceMessageId?: string;
    channelId: string;
    guildId?: string;
}


export enum GPTAttachmentType {
    Image = "image",
    Video = "video",
    Audio = "audio",
    Unknown = "unknown",
    Text = "text",
    Error = "error",
}

export class GPTAttachment {
    type: GPTAttachmentType = GPTAttachmentType.Unknown;
    id: string;
    filename: string;
    url: string;
    size: number; // in bytes
    expiresAt: Date;

    constructor(data: Omit<OmitMethods<GPTAttachment>, "id"> & { id?: string }) {
        this.type = GPTAttachmentType.Unknown;
        this.id = data.id ?? randomId("gpt-attachment");
        this.filename = data.filename;
        this.url = data.url;
        this.size = data.size;
        this.expiresAt = data.expiresAt;
        this.type = data.type;
    }

    static async new(data: Omit<OmitMethods<GPTAttachment>, "id" | "type"> & { id?: string }) {
        log.debug(`creating new gpt attachment`);
        const type = lookup(data.filename);
        log.debug(`found type: ${type}`);
        let expired = data.expiresAt.getTime() < new Date().getTime();
        log.debug(`expired: ${expired}`);
        if (type) {
            const pureType = type.split("/")[0];
            switch (pureType) {
                case "image":
                    log.debug(`detected type: image`);
                    if (expired) {
                        return new ErrorGPTAttachment({...data, error: "error creating attachment: the url is now expired. please ignore this message and pretend as though the image was never added."});
                    }
                    return new ImageGPTAttachment(data);
                case "audio":
                    log.debug(`detected type: audio`);
                    if (expired) {
                        return new ErrorGPTAttachment({...data, error: "error creating attachment: the url is now expired. please ignore this message and pretend as though the sound was never added."});
                    }
                    return new AudioGPTAttachment(data);
                case "video":
                    log.debug(`detected type: video`);
                    if (expired) {
                        return new ErrorGPTAttachment({...data, error: "error creating attachment: the url is now expired. please ignore this message and pretend as though the video was never added."});
                    }
                    return new VideoGPTAttachment(data);
                case "text":
                case "application":
                    log.debug(`detected type: text or application`);
                    // will run for both "text" and "application"
                    // attempt to download the text content and decode it as utf-8
                    try {
                        // check cache
                        if (data.id && existsSync(`cache/attachments/${data.id}`)) {
                            log.debug(`found already cached attachment: ${data.id}, returning that instead`);
                            const content = readFileSync(`cache/attachments/${data.id}`, "utf-8");
                            return new TextGPTAttachment({...data, content: content});
                        }
                        // fetch content
                        if (expired) {
                            return new ErrorGPTAttachment({...data, error: "error creating attachment: the url is now expired, and it was not previously cached. please ignore this message and pretend as though the file was never added."});
                        }
                        const response = await fetch(data.url);
                        if (!response.ok) {
                            log.debug(`error fetching attachment content: non-200 response from attachment url`);
                            log.debug(await response.text());
                            return new ErrorGPTAttachment({...data, error: "error fetching attachment content: non-200 response from attachment url"});
                        }
                        const buffer = await response.arrayBuffer();
                        const decoded = new TextDecoder('utf-8', { fatal: true }).decode(buffer);

                        log.debug(`decoded text of size ${decoded.length}`);

                        // write cache
                        const att = new TextGPTAttachment({...data, content: decoded});
                        writeFileSync(`cache/attachments/${att.id}`, decoded, "utf-8");
                        log.debug(`cached and returned attachment`);
                        return att;
                    } catch (err) {
                        log.error(`error while fetching attachment content:`);
                        log.error(err);
                        return new ErrorGPTAttachment({...data, error: `error while fetching attachment content: ${err}`});
                    }
                default:
                    log.debug(`detected type: unprocessable (${pureType})`);
                    return new ErrorGPTAttachment({...data, error: "unprocessable attachment type"});
            }
        } else {
            return new ErrorGPTAttachment({...data, error: "unknown attachment type"})
        }
    }
}

export class ImageGPTAttachment extends GPTAttachment {
    type: GPTAttachmentType.Image = GPTAttachmentType.Image;

    constructor(data: Omit<OmitMethods<ImageGPTAttachment>, "id" | "type"> & { id?: string }) {
        super({...data, type: GPTAttachmentType.Image});
        this.type = GPTAttachmentType.Image
    }
};

export class VideoGPTAttachment extends GPTAttachment {
    type: GPTAttachmentType.Video = GPTAttachmentType.Video;

    constructor(data: Omit<OmitMethods<VideoGPTAttachment>, "id" | "type"> & { id?: string }) {
        super({...data, type: GPTAttachmentType.Video});
        this.type = GPTAttachmentType.Video
    }
};


export class AudioGPTAttachment extends GPTAttachment {
    type: GPTAttachmentType.Audio = GPTAttachmentType.Audio;

    constructor(data: Omit<OmitMethods<ImageGPTAttachment>, "id" | "type"> & { id?: string }) {
        super({...data, type: GPTAttachmentType.Audio});
        this.type = GPTAttachmentType.Audio
    }
};
export class TextGPTAttachment extends GPTAttachment {
    type: GPTAttachmentType.Text;
    content: string;

    constructor(data: Omit<OmitMethods<TextGPTAttachment>, "id" | "type"> & { id?: string }) {
        super({...data, type: GPTAttachmentType.Text});
        this.type = GPTAttachmentType.Text;
        this.content = data.content;
    }

    formatText() {
        return `user attached a file: ${this.filename} (${prettyBytes(this.size)}), its content is as follows:\n\n${this.content}`;
    }
}

export class ErrorGPTAttachment extends GPTAttachment {
    type: GPTAttachmentType.Error;
    error: string;

    constructor(data: Omit<OmitMethods<ErrorGPTAttachment>, "id" | "type"> & { id?: string }) {
        super({...data, type: GPTAttachmentType.Error});
        this.type = GPTAttachmentType.Error;
        this.error = data.error;
    }

    formatText() {
        return `user attached a file: ${this.filename} (${prettyBytes(this.size)}) however there was an error in processing it:\n\n${this.error}`;
    }
}

export type AnyGPTAttachment = ErrorGPTAttachment | TextGPTAttachment | ImageGPTAttachment | AudioGPTAttachment | VideoGPTAttachment;
export type TypeofAnyGPTAttachment =
    typeof ErrorGPTAttachment |
    typeof TextGPTAttachment |
    typeof ImageGPTAttachment |
    typeof AudioGPTAttachment |
    typeof VideoGPTAttachment;


async function extractAttachments(message: Message<boolean>): Promise<AnyGPTAttachment[]> {
    return await Promise.all(message.attachments.map(async (att) => {
        const data: Omit<OmitMethods<GPTAttachment>, "id" | "type"> = {
            filename: att.name,
            size: att.size,
            url: att.url,
            expiresAt: new Date(Date.now() + (att.duration ?? (12 * 60 * 60) * 1000)) // 12 hours default
        };

        return await GPTAttachment.new(data);
    }));
}

export class GPTUserMessage implements GPTBaseMessage {
    readonly type = GPTMessageType.User;
    id: string = randomId("gpt-user-message");
    createdAt: Date = new Date();
    author: GPTUser;
    attachments: AnyGPTAttachment[] = [];
    content: string;
    beenDeleted: boolean = false;
    discordData: GPTDiscordData;

    constructor(data: Omit<OmitMethods<GPTUserMessage>, "id" | "type" | "createdAt"> & { id?: string, createdAt?: Date }) {
        if (data.id) this.id = data.id;
        if (data.createdAt) this.createdAt = data.createdAt;
        this.author = data.author;
        this.attachments = data.attachments;
        this.content = data.content;
        this.beenDeleted = data.beenDeleted;
        this.discordData = data.discordData;
    }

    static async fromMessage(message: Message): Promise<GPTUserMessage | GPTAssistantMessage> {
        if (message.author.id === client?.user?.id) {
            const msg = (await database("gpt_messages").where({ id: message.id }).first());
            const assistantDBAttachments = await database("gpt_attachments").where({ message_id: message.id });
            return new GPTAssistantMessage({
                createdAt: new Date(msg?.created_at ?? message.createdTimestamp),
                id: msg?.id,
                content: msg?.content ?? message.content,
                discordData: {
                    messageId: msg?.discord_message_id ?? message.content,
                    channelId: msg?.discord_channel_id ?? message.channelId,
                    referenceMessageId: msg?.discord_reference_id ?? message.reference?.messageId,
                    guildId: msg?.discord_guild_id ?? message.guildId ?? undefined,
                },
                beenDeleted: msg?.been_deleted ?? false,
                attachments: assistantDBAttachments.length > 0 ? parseDBAttachments(assistantDBAttachments) : await extractAttachments(message),
                toolCallIds: JSON.parse(msg?.tool_call_ids ?? "[]"),
            });
        }
        return new GPTUserMessage({
            createdAt: message.createdAt,
            author: {
                id: message.author.id,
                username: message.author.username,
                avatar: message.author.displayAvatarURL()
            },
            attachments: await extractAttachments(message),
            content: message.content,
            beenDeleted: false,
            discordData: {
                messageId: message.id,
                referenceMessageId: message.reference?.messageId,
                channelId: message.channel?.id,
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
    attachments: AnyGPTAttachment[] = [];
    content: string;
    toolCallIds: string[]; // list of tool call ids associated with this message
    beenDeleted: boolean = false;
    sent?: boolean = false;
    discordData?: GPTDiscordData;

    constructor(data: Omit<OmitMethods<GPTAssistantMessage>, "id" | "type" | "sent" | "createdAt"> & { id?: string, createdAt?: Date }) {
        if (data.id) this.id = data.id;
        if (data.createdAt) this.createdAt = data.createdAt;
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

    fetchToolCalls(conversation: Conversation): GPTToolCall[] {
        return conversation.messages.filter(m => {
            if (m.type === GPTMessageType.ToolCall) {
                return (this.toolCallIds.includes(m.toolCallId));
            }
            return false;
        }) as GPTToolCall[];
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

    constructor(data: Omit<OmitMethods<GPTToolCall>, "type" | "id" | "createdAt" | "answered"> & { id?: string, createdAt?: Date, answered?: boolean }) {
        if (data.id) this.id = data.id;
        if (data.createdAt) this.createdAt = data.createdAt;
        if (data.answered) this.answered = data.answered;
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
        })[0] as GPTToolResponse | undefined;
    }
}

export class GPTToolResponse implements GPTBaseMessage {
    readonly type = GPTMessageType.ToolResponse;
    id: string = randomId("gpt-tool-response");
    createdAt: Date = new Date();
    toolCallId: string;
    toolName: ToolName | string; // | string because there's no way to know the names of custom tools
    response: ToolResponse<unknown>;

    constructor(data: Omit<OmitMethods<GPTToolResponse>, "id" | "type" | "createdAt"> & { id?: string, createdAt?: Date }) {
        if (data.id) this.id = data.id;
        if (data.createdAt) this.createdAt = data.createdAt;
        this.toolCallId = data.toolCallId;
        this.toolName = data.toolName;
        this.response = data.response;
    }

    static newCustom(tc: GPTToolCall, data: string, isError: boolean) {
        if (isError) {
            return new GPTToolResponse({
                toolName: tc.toolName,
                toolCallId: tc.toolCallId,
                response: new ToolErrorResponse(data),
            });
        } else {
            return new GPTToolResponse({
                toolName: tc.toolName,
                toolCallId: tc.toolCallId,
                response: new ToolSuccessResponse(data),
            })
        }
    }
}

export class GPTSystemMessage implements GPTBaseMessage {
    readonly type = GPTMessageType.System;
    id: string = randomId("gpt-system-message");
    createdAt: Date = new Date();
    content: string;

    constructor(data: Omit<OmitMethods<GPTSystemMessage>, "id" | "type" | "createdAt"> & { id?: string, createdAt?: Date }) {
        if (data.id) this.id = data.id;
        if (data.createdAt) this.createdAt = data.createdAt;
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