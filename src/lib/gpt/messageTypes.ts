import { Attachment, Client, Collection, CommandInteraction, DMChannel, Guild, GuildChannel, Message, PartialGroupDMChannel, Role, User } from "discord.js";
import { FormattedCommandInteraction } from "../classes/command";
import * as log from "../log";
import { fetchGuildConfig } from "../guild_config_manager";
import { OmitMethods } from "../omitMethods";

export enum GPTAttachmentType {
    Text = "text",
    Image = "image",
    Video = "video",
    Audio = "audio",
    Unknown = "unknown"
}

let client: Client;
// this is ran on bot initialization, basically meaning that client will ALWAYS be defined
export function initGPTFetchClient(inputClient: Client) {
    if (!client) client = inputClient;
}

function getAttachmentType(filename: string): GPTAttachmentType {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (!ext) return GPTAttachmentType.Unknown;

    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg', 'apng', 'avif', 'ico'];
    const videoExts = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'mpeg', 'mpg'];
    const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus', 'wma', 'aiff', 'alac'];
    const textExts = [
        'txt', 'md', 'csv', 'json', 'xml', 'yaml', 'yml', 'ini', 'log', 'tsv', 'js', 'ts',
        'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'html', 'css', 'scss', 'less',
        'sh', 'bat', 'conf'
    ];

    if (imageExts.includes(ext)) return GPTAttachmentType.Image;
    if (videoExts.includes(ext)) return GPTAttachmentType.Video;
    if (audioExts.includes(ext)) return GPTAttachmentType.Audio;
    if (textExts.includes(ext)) return GPTAttachmentType.Text;

    return GPTAttachmentType.Unknown;
}

export class GPTAttachment<T extends GPTAttachmentType> {
    type: T; // will be set in the constructor by a detection function
    url?: string; // if the AI is uploading attachments (planned feature), it won't have a URL so it has to be able to be set later
    filename: string; // must be defined in constructor
    content: T extends GPTAttachmentType.Text ? string : T extends GPTAttachmentType.Unknown ? string : never = undefined as never;
    size: number

    constructor(filename: string, size: number, url?: string) {
        this.filename = filename;
        this.url = url;
        this.size = size;
        this.type = getAttachmentType(filename) as T; // type assertion to ensure T is correct
        if (this.type === GPTAttachmentType.Text) {
            // Set a placeholder while content is being fetched
            (this as GPTAttachment<GPTAttachmentType.Text>).content = "[Awaiting content status...]" as any;
        } else {
            this.content = undefined as never; // ensure content is not set for non-text attachments
        }
    }
    // super fucked up thing to make typescript happy
    private async fetchWithGoodType(this: GPTAttachment<GPTAttachmentType.Text | GPTAttachmentType.Unknown>) {
        if (this.size > 5 * 1000 * 1000) {// 5 megabytes
            this.content = `[SYSTEM]: this file exceeded the size limit of 5MB and was not downloaded. actual size: ${this.size / 1000 / 1000}MB`;
        } // *file size limit is mostly low because of api limits
        if (this.url) {
            try {
                const response: Response = await fetch(this.url);
                if (response.ok) {
                    const buffer = await response.arrayBuffer();
                    let text;
                    try {
                        const decoder = new TextDecoder('utf-8', { fatal: true });
                        text = decoder.decode(buffer);
                    } catch (err) {
                        log.error(`failed to decode GPT attachment text content from ${this.url}: ${err}`)
                        log.debug(`failed to decode GPT attachment text content from ${this.filename} (${this.url}): ${err}; buffer:`)
                        log.debug(buffer);
                        this.content = `[SYSTEM]: an error occurred while decoding this attachment's content: ${err}`
                        return;
                    }
                    log.debug(`fetched GPT attachment text content from ${this.url}`);
                    log.debug(text);
                    this.content = text;
                } else {
                    log.error(`failed to fetch GPT attachment text content from ${this.url}: ${response.status} ${response.statusText}`);
                    this.content = `[SYSTEM]: an http error occurred while fetching this attachment's content: ${response.status} ${response.statusText}`;
                }
            } catch (err) {
                log.error(`error fetching text content from ${this.url}:`, err);
                this.content = `[SYSTEM]: an internal error occurred while fetching this attachment's content, the exact cause will be investigated.`;
            }
        } else {
            log.warn(`no URL provided for text attachment: ${this.filename}`);
            this.content = `[SYSTEM]: this attachment's content couldn't be fetched because it does not have a url. under normal circumstances, this should never happen, so the cause will be investigated.`;
        }
    }

    async fetchContent(this: GPTAttachment<GPTAttachmentType>) {
        if (this.type === GPTAttachmentType.Text || this.type === GPTAttachmentType.Unknown) { // fuck it larp unknown in there as well
            // nobodys uploading binary files i'm sure its fine
            return await (this as GPTAttachment<GPTAttachmentType.Text | GPTAttachmentType.Unknown>).fetchWithGoodType();
        }
    }
}

enum GPTBaseMessageType {
    AssistantMessage = "assistant message",
    UserMessage = "user message",
    ToolCallResponse = "tool call response",
    System = "system"
}

export interface GPTBaseMessage {
    timestamp: number;
    type: GPTBaseMessageType;
}

export class ToolCall {
    id: string; // unique ID for the tool call; will generally be the one used by openai, not this one.
    name: string; // name of the tool
    parameters: Record<string, any>; // parameters for the tool call, will be converted to the correct type later

    constructor(args: ToolCall) {
        this.id = args.id
        this.name = args.name
        this.parameters = args.parameters
    }
}

enum AssistantMessageState {
    Waiting = "Waiting",
    ProcessingTools = "ProcessingTools",
    Sending = "Sending",
    Complete = "Complete"
}

export class GPTAssistantMessage implements GPTBaseMessage {
    messageId: string;
    content: string;
    attachments: GPTAttachment<GPTAttachmentType>[];
    toolCalls: ToolCall[];
    timestamp: number = Date.now();
    type: GPTBaseMessageType = GPTBaseMessageType.AssistantMessage;
    state: AssistantMessageState = AssistantMessageState.Waiting;

    constructor({ messageId = `sending:${Date.now()}`, content, attachments = [], toolCalls = [] }: Omit<GPTAssistantMessage, "timestamp" | "type" | "state">) {
        this.messageId = messageId;
        this.content = content;
        this.attachments = attachments;
        this.toolCalls = toolCalls;
    }
}

interface FormatCacheItem {
    type: "users" | "channels" | "roles";
    id: string;
    replacement: string;
    fetchedAt: number;
}

let fetchedCache: FormatCacheItem[] = [];
// this function essentially takes in the content and replaces all of the mentions with the special versions
export async function formatGPTMessageContent(content: string, guild: Guild | null): Promise<string> {
    if (!client) {
        log.warn("attempt to format GPT content while fetch client hasn't been initialized. HOW THE FUCK DID THIS HAPPEN!!!")
        return content; // failsafe that should NEVER happen but whatever just to be safe
    }

    const mentions = {
        users: (/<@!?(\d+)>/g).exec(content)?.slice(1),
        channels: (/<#!?(\d+)>/g).exec(content)?.slice(1),
        roles: (/<@&!?(\d+)>/g).exec(content)?.slice(1),
    }
    const locationMap = {
        "users": client.users,
        "channels": client.channels,
        "roles": guild?.roles,
    }
    const prefixMap = {
        "users": "<@",
        "channels": "<#",
        "roles": "<@&"
    }

    let processedContent = content;

    // purge cache items older than 1 hour
    fetchedCache = fetchedCache.filter(item => item.fetchedAt > Date.now() - 60 * 60 * 60 * 1000)

    await Promise.all(Object.entries(mentions).map(async ([inputType, ids]) => {
        const type = inputType as "users" | "channels" | "roles";
        const location = locationMap[type];
        if (!ids) return;
        await Promise.all(ids.map(async (id) => {
            // attempt to find it in cache
            let replacement = "unknown-" + type.slice(-1);
            const cachedItem = fetchedCache.find(item => item.id == id && item.type == type);
            if (cachedItem) {
                replacement = cachedItem.replacement
            } else if (location) {
                const fetchedItem = await location.fetch(id);
                if (fetchedItem) {
                    if (fetchedItem instanceof User) {
                        replacement = fetchedItem.username;
                    } else if ((fetchedItem instanceof GuildChannel) || (fetchedItem instanceof Role)) {
                        replacement = fetchedItem.name
                    }
                    fetchedCache.push({
                        type: type,
                        id: id,
                        replacement: replacement,
                        fetchedAt: Date.now()
                    });
                }
            };
            processedContent.replace(`${prefixMap[type]}${id}>`, `${prefixMap[type]}${replacement}>`)
        }));
    }));

    return processedContent;
}

export async function unformatGPTMessageContent(processedContent: string) {
    if (!client) {
        log.warn("attempt to format GPT content while fetch client hasn't been initialized. HOW THE FUCK DID THIS HAPPEN!!!")
        return processedContent; // failsafe that should NEVER happen but whatever just to be safe
    }

    const mentions = {
        users: (/<@!?(\w+)>/g).exec(processedContent)?.slice(1),
        channels: (/<#!?(\w+)>/g).exec(processedContent)?.slice(1),
        roles: (/<@&!?(\w+)>/g).exec(processedContent)?.slice(1),
    }
    const prefixMap = {
        "users": "<@",
        "channels": "<#",
        "roles": "<@&"
    }

    let content = processedContent;

    // purge cache items older than 1 hour
    fetchedCache = fetchedCache.filter(item => item.fetchedAt > Date.now() - 60 * 60 * 60 * 1000)

    await Promise.all(Object.entries(mentions).map(async ([inputType, names]) => {
        const type = inputType as "users" | "channels" | "roles";
        if (!names) return;
        await Promise.all(names.map(async (replacement) => {
            // attempt to find it in cache
            let id = replacement;
            const cachedItem = fetchedCache.find(item => item.replacement == replacement && item.type == type);
            if (cachedItem) {
                id = cachedItem.id
            } else {
                let fetchedItem
                switch (type) {
                    case "users":
                        fetchedItem = client.users.cache.find(u => u.username == replacement);
                    break;
                    case "channels":
                        fetchedItem = client.channels.cache.find(c => (c instanceof GuildChannel) && (c.name == replacement));
                    break;
                    case "roles": // i dont wanna do all that shit vro
                    break;
                    default:
                    break;
                }
                if (fetchedItem) {
                    id = fetchedItem.id;
                    fetchedCache.push({
                        type: type,
                        id: id,
                        replacement: replacement,
                        fetchedAt: Date.now()
                    });
                }
            };
            content.replace(`${prefixMap[type]}${id}>`, `${prefixMap[type]}${replacement}>`)
        }));
    }));

    return content;
}

export class GPTUserMessage implements GPTBaseMessage {
    messageId: string;
    content: string;
    rawContent: string; // content BEFORE being passed to formatGPTMessageContent
    attachments: GPTAttachment<GPTAttachmentType>[];
    timestamp: number;
    author: OmitMethods<User> | User; // objects in the db will not come with the functions
    type: GPTBaseMessageType = GPTBaseMessageType.UserMessage;

    constructor({ messageId, content, rawContent, attachments, timestamp, author }: Omit<OmitMethods<GPTUserMessage>, "type">) {
        this.messageId = messageId;
        this.content = content;
        this.rawContent = rawContent
        this.attachments = attachments;
        this.timestamp = timestamp;
        this.author = author;
    }

    static async fromMessage(message: Message) {
        initGPTFetchClient(message.client);
        const formattedAttachments = await Promise.all(message.attachments.map(async a => {
            const formattedAttachment = new GPTAttachment(a.name, a.size, a.url);
            await formattedAttachment.fetchContent();
            return formattedAttachment;
        }));

        const formattedContent = await formatGPTMessageContent(message.content, message.guild);

        return new GPTUserMessage({
            messageId: message.id,
            content: formattedContent,
            rawContent: message.content,
            attachments: formattedAttachments,
            timestamp: message.createdTimestamp,
            author: message.author
        });
    }

    static async fromInteraction(interaction: FormattedCommandInteraction, content: string, attachment: Attachment) {
        const formattedAttachment = new GPTAttachment(attachment.name, attachment.size, attachment.url);
        await formattedAttachment.fetchContent();

        const formattedContent = await formatGPTMessageContent(content, interaction.guild);

        return new GPTUserMessage({
            messageId: `i:${interaction.id}`,
            content: formattedContent,
            rawContent: content,
            attachments: [formattedAttachment],
            timestamp: interaction.createdTimestamp,
            author: interaction.author
        });
    }
}

export class GPTToolCallResponse implements GPTBaseMessage {
    origin: ToolCall;
    response: any; // dont like using any here so might replace it in the future but its fine for now
    timestamp: number = Date.now();
    type: GPTBaseMessageType = GPTBaseMessageType.ToolCallResponse

    constructor({ origin, response }: Omit<GPTToolCallResponse, "type" | "timestamp">) {
        this.origin = origin;
        this.response = response;
    }
}

export class GPTSystemMessage implements GPTBaseMessage {
    content: string;
    timestamp: number = Date.now();
    type: GPTBaseMessageType = GPTBaseMessageType.System;

    constructor({ content }: Omit<GPTSystemMessage, "type" | "timestamp">) {
        this.content = content;
    }
}

export type GPTMessage = GPTSystemMessage | GPTToolCallResponse | GPTAssistantMessage | GPTUserMessage