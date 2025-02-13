import { Attachment, ChannelType, Collection, Message, PermissionFlagsBits, TextChannel, User } from "discord.js";
import OpenAI from "openai";
import * as log from "./log";
import mime from 'mime-types';
import { EventEmitter } from "node:events";
import { RunnableToolFunction } from "openai/lib/RunnableFunction";
import { ChatCompletionMessageToolCall, ChatCompletionToolMessageParam } from "openai/resources";
import { FormattedCommandInteraction } from "./classes/command";
import { config } from "dotenv";
import TurndownService from "turndown";
import * as mathjs from "mathjs";
import * as cheerio from "cheerio";
import * as util from "util";
config(); // incase started using test scripts without bot running

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

let local_ips = ["192.168", "172.16", "10", "localhost"];
for (let i = 17; i <= 31; i++) {
    local_ips.push(`172.${i}`);
}

let conversations: Conversation[] = [];

const tools: { [name: string]: RunnableToolFunction<any> } = {
    get_current_date: {
        type: 'function',
        function: {
            name: "get_current_date",
            description: "returns the current date and time",
            parameters: {},
            function: () => {
                return new Date().toLocaleString();
            },
        }
    },
    get_listening_data: {
        type: 'function',
        function: {
            name: "get_listening_data",
            description: "retrieves last.fm listening data for a specific user",
            parse: JSON.parse,
            parameters: {
                type: 'object',
                properties: {
                    userid: {
                        type: "string",
                        description: "ID of the user to retrieve listening data for",
                    },
                }
            },
            function: async ({ userid }: { userid: string }) => {
                if (!userid) {
                    return "ERROR: No user ID provided.";
                }
                const url = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${userid}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=5`;
        
                try {
                    const response = await fetch(url);
                    const data = await response.json();
                    if (data.error) {
                        log.warn(`an error occurred while attempting to fetch Last.fm data for GPT: ${data.message}`);
                        return `an error occurred while attempting to fetch Last.fm data: ${data.message}`
                    }
                    const mapped = data.recenttracks.track.map((track: any) => ({ // i dont wanna re create lastfms api types so ill just use any for now
                        artist: track.artist['#text'],
                        track: track.name,
                        album: track.album['#text'],
                        url: track.url,
                        date: track.date ? track.date['#text'] : 'Now Playing'
                    }));
                    return mapped
                } catch (err: any) {
                    log.warn(`an error occurred while attempting to fetch Last.fm data for GPT: ${err.message}`);
                    return `an error occurred while attempting to fetch Last.fm data: ${err.message}`
                }
            },
        }
    },
    math: {
        type: 'function',
        function: {
            name: "math",
            description: "evaluates a mathematical expression. Supports most mathjs functions, it just gets plugged directly into mathjs.evaluate(). This should only be used when you must use math. ",
            parse: JSON.parse,
            parameters: {
                type: 'object',
                properties: {
                    expression: {
                        type: "string",
                        description: "mathematical expression to evaluate",
                    },
                }
            },
            function: async ({ expression }: { expression: string }) => {
                try {
                    return mathjs.evaluate(expression);
                } catch (err: any) {
                    return `an error occurred while attempting to evaluate the expression: ${err.message}`
                }
            },
        }
    },
    random: {
        type: 'function',
        function: {
            name: "random",
            description: "returns a random number between two values. This should only be used when users ask for random values.",
            parse: JSON.parse,
            parameters: {
                type: 'object',
                properties: {
                    min: {
                        type: "number",
                        description: "minimum value",
                    },
                    max: {
                        type: "number",
                        description: "maximum value",
                    },
                }
            },
            function: async ({ min, max }: { min: number, max: number }) => {
                return Math.floor(Math.random() * (max - min + 1) + min);
            },
        }
    },
    request_url: {
        type: 'function',
        function: {
            name: "request_url",
            description: "Fetches a URL and returns the main content as markdown. Does not support local addresses for security reasons.",
            parse: JSON.parse,
            parameters: {
                type: 'object',
                properties: {
                    url: {
                        type: "string",
                        description: "URL to fetch. Do not input local addresses. IP's are fine, just not local ones.",
                    },
                    keepScripts: {
                        type: "boolean",
                        description: "whether to keep scripts in the fetched content",
                        default: false,
                    },
                    raw: {
                        type: "boolean",
                        description: "whether to return the raw HTML instead of markdown",
                        default: false,
                    },
                }
            },
            function: async ({ url, keepScripts, raw }: { url: string, keepScripts: boolean, raw: boolean }) => {
                if (!url) {
                    return "ERROR: No URL provided.";
                }
                for (let ipStart of local_ips) {
                    if (url.replace(/^https?:\/\//, '').startsWith(ipStart)) {
                        log.warn(`attempt to access local ip from request_url`);
                        return `refused attempt to access private ip from request_url`;
                    }
                }
                try {
                    const response = await fetch(url);
                    const html = await response.text();
                    if (raw) {
                        return html;
                    }
            
                    const $ = cheerio.load(html);
                    if (!keepScripts) {
                        $('script, style, noscript, iframe').remove();
                    }
                    const turndownService = new TurndownService();
        
                    $('a[href]').each((_, element) => {
                        const href = $(element).attr('href');
                        if (href && (href.startsWith('/') || href.startsWith('./'))) {
                            const absoluteUrl = new URL(href, url).href;
                            $(element).attr('href', absoluteUrl);
                        }
                    });
        
                    const mainContent = $('article').html() || $('main').html() || $('body').html();
                    if (!mainContent) return "No content found.";
                    let markdown = turndownService.turndown(mainContent);
                    if (markdown.length > 100000) {
                        return markdown.slice(0, 100000) + " ... (truncated due to length)";
                    }
                    return markdown
                } catch (err: any) {
                    
                    log.warn(`an error occurred while attempting to fetch URL for GPT: ${err.message}`);
                    return `an error occurred while attempting to fetch the URL: ${err.message}`;
                }
            },
        }
    },
    search: {
        type: 'function',
        function: {
            name: "search",
            description: "searches Google for a query and returns the results",
            parse: JSON.parse,
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: "string",
                        description: "query to search for",
                    },
                }
            },
            function: async ({ query }: { query: string }) => {
                const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID}`;
                try {
                    const response = await fetch(url);
                    const data = await response.json();
                    if (data.error) {
                        log.warn(`an error occurred while attempting to search Google for GPT: ${data.error.message}`);
                        return `an error occurred while attempting to search Google: ${data.error.message}`;
                    }
                    const results = Array.isArray(data.items) ? data.items : [data.items];
                    let newResults = [];
                    for (let result of results) {
                        newResults.push({ title: result.title, snippet: result.snippet, link: result.link })
                    }
                    return newResults;
                } catch (err: any) {
                    log.warn(`an error occurred while attempting to search Google for GPT: ${err.message}`);
                    return `an error occurred while attempting to search Google: ${err.message}`;
                }
            },
        }
    }
}

const botPrompt = `Prompt unfinished. `

export enum GPTRole { // in theory i could import these from openai, but they have a lot of other weird stuff added to them and i dont wanna deal with that
    User = "user",
    Assistant = "assistant",
    System = "system",
    Tool = "tool"
}

export enum GPTContentPartType {
    Text = "text",
    Image = "image_url",
}

export type GPTFormattedCommandInteraction = FormattedCommandInteraction & {
    author: User;
    cleanContent: string;
    content: string;
    attachments: Collection<string, Attachment>;
}

export enum GPTModel {
    gpt_4o_mini = "gpt-4o-mini",
    gpt_35_turbo = "gpt-3.5-turbo",
}

export enum GPTModality {
    Text = "text",
    Audio = "audio",
}

export class GPTContentPart {
    type: GPTContentPartType = GPTContentPartType.Text;
    text: string | undefined;
    image_url: object | undefined;
    constructor ({ type = GPTContentPartType.Text, text, image_url }: { type?: GPTContentPartType, text?: string, image_url?: string } = {}) {
        this.type = type;
        if (type === GPTContentPartType.Text) { // if type is text, set text to text or "No text provided."
            this.text = text || "No text provided.";
            this.image_url = undefined;
        } else if (type === GPTContentPartType.Image) { // if type is image, set image_url to image_url or undefined
            this.text = undefined;
            this.image_url = image_url ? { url: image_url } : undefined;
        } else { // if type is not text or image, log an error
            log.error(`Invalid type provided: ${type}`);
        }
    }
}

export class GPTMessage {
    role: GPTRole = GPTRole.User;
    tool_call_id: string | undefined;
    content: string | GPTContentPart[] = [];
    name: string | undefined;
    message_id: string | undefined;
    discord_message: Message | GPTFormattedCommandInteraction | undefined;
    timestamp: number = Date.now();
    tool_calls: ChatCompletionMessageToolCall[] | undefined;
    addDiscordValues(message: Message) {
        this.discord_message = message;
        this.message_id = message.id.toString();
        this.timestamp = message.createdTimestamp || Date.now();
    }
    constructor (args: Partial<GPTMessage> = {}) {
        Object.assign(this, args);
    }
}

export const APIParametersDescriptions = {
    model: "type of model to use for messages",
    temperature: "controls randomness of output",
    top_p: "controls diversity of output",
    frequency_penalty: "penalizes new words based on their existing frequency",
    max_completion_tokens: "max number of words to generate",
    presence_penalty: "penalizes new words based on whether they appear in the text so far",
    seed: "random seed for reproducibility",
} // may or may not be used in the future for a help command

export class APIParameters {
    model: GPTModel = GPTModel.gpt_4o_mini;
    temperature: number = 1;
    top_p: number = 1;
    frequency_penalty: number = 0;
    max_completion_tokens: number | undefined;
    presence_penalty: number = 0;
    seed: number | undefined = Math.floor(Math.random() * 1000000); // for reproducibility
    /* // users should not be able to modify these values
    private store: boolean = false; // whether it should send conversations to openai's statistics and model improvement stuff (no)
    private logprobs: boolean = false;
    private top_logprobs: number | undefined;
    private logit_bias: Object | undefined;
    private service_tier: string | undefined;
    private n: number = 1;
    private stop: string[] | undefined;
    private modalities: GPTModality[] = [GPTModality.Text];
    private prediction: Object | undefined; 
    private audio: Object | undefined;
    private response_format: Object | undefined;
    private stream: boolean = false;
    private tools: Array<Object> | undefined; // do not use this it sucks
    private tool_choice: string | undefined; // do not use this it sucks
    private paralell_tool_calls: boolean | undefined; // do not use this it sucks
    private user: string | undefined; // for tracking, dont use
    */
    constructor ({ params }: { params?: APIParameters } = {}) {
        if (params) {
            Object.assign(this, params);
        }
    }
}

const openAIImageTypes = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/jpg"];

function getFileType(filename: string): string {
    const mimeType = mime.lookup(filename);
    if (mimeType) {
        if (mimeType.startsWith('text/')) {
            return 'text';
        } else if (mimeType.startsWith('image/')) {
            if (!openAIImageTypes.includes(mimeType)) {
                return 'other: ' + mimeType;
            }
            return 'image';
        } else {
            return 'other: ' + mimeType;
        }
    }
    return 'none';
}

async function sanitizeMessage(message: Message | GPTFormattedCommandInteraction): Promise<GPTContentPart[]> {
    let contentParts = [];

    if (message.cleanContent || message.content) {
        contentParts.push(new GPTContentPart({ type: GPTContentPartType.Text, text: message.cleanContent || message.content || "Error finding message content. " }));
    }
    if (message.attachments.size > 0) {
        for (const attachment of message.attachments.values()) {
            const fileType = getFileType(attachment.name || "");
            if (fileType === "image") {
                contentParts.push(new GPTContentPart({ type: GPTContentPartType.Image, image_url: attachment.url }));
            } else if (fileType === ("text")) {
                const text = await fetch(attachment.url).then((response) => response.text());
                contentParts.push(new GPTContentPart({ type: GPTContentPartType.Text, text: `Attachment ${attachment.name}: ${text}` }));
            } else if (fileType.startsWith("other: ")) {
                contentParts.push(new GPTContentPart({ type: GPTContentPartType.Text, text: `Attachment ${attachment.name} is of type ${fileType.substring(7)} and cannot be processed.` }));
            }
        }
    }
    return contentParts;
}

export enum ConversationEvents {
    Message = "message",
    FatalError = "fatal_error",
    FunctionCall = "function_call",
    FunctionCallResult = "function_call_result",
}

export class Conversation {
    users: User[] = [];
    messages: GPTMessage[] = [];
    api_parameters: APIParameters = new APIParameters();
    emitter: EventEmitter = new EventEmitter();
    id: string = Math.random().toString(36).substring(2, 15); // random id for the conversation, may be used to find it later

    on = this.emitter.on.bind(this.emitter);
    off = this.emitter.off.bind(this.emitter);
    once = this.emitter.once.bind(this.emitter);
    emit = this.emitter.emit.bind(this.emitter);
    removeAllListeners = this.emitter.removeAllListeners.bind(this.emitter);

    toApiInput() {
        const apiConversation: any = {
            messages: this.messages.map((message) => {
                const apiMessage: any = {
                    role: message.role,
                    tool_calls: message.tool_calls,
                    tool_call_id: message.tool_call_id
                }
                if (message.name) {
                    apiMessage.name = message.name;
                }
                if (message.content) {
                    if (typeof message.content === "string") {
                        apiMessage.content = message.content;
                    } else {
                        message.content = Array.isArray(message.content) ? message.content.map((content) => { // this shouldn't have to exist but Typescripple Does Not Detect
                            const apiContent: any = {
                                type: content.type,
                            }
                            if (content.text) {
                                apiContent.text = content.text;
                            }
                            if (content.image_url) {
                                apiContent.image_url = content.image_url;
                            }
                            return apiContent;
                        }) : message.content;
                        apiMessage.content = message.content;
                    }
                }
                return apiMessage;
            })
        }; // i am not gonna make a whole type for this ngl i do not care enough
        for (const [key, value] of Object.entries(this.api_parameters)) {
            if (value !== undefined) {
                apiConversation[key] = value;
            }
        }
        return apiConversation;
    }

    addNonDiscordMessage(message: GPTMessage): GPTMessage {
        this.messages.push(message);
        return message;
    }

    async addMessage(message: Message | GPTFormattedCommandInteraction, role: GPTRole = GPTRole.User): Promise<GPTMessage> {
        const newMessage = new GPTMessage();
        newMessage.discord_message = message;
        if (this.users.find((user) => user.id === message.author.id) === undefined) {
            this.users.push(message.author);
        }
        newMessage.timestamp = message.createdTimestamp || Date.now();
        newMessage.message_id = message.id.toString();
        newMessage.content = await sanitizeMessage(message);
        newMessage.name = message.author.username;
        newMessage.role = role;
        this.messages.push(newMessage);
        return newMessage;
    }

    async run() {
        try {
            const apiInput = this.toApiInput();
            const response = await openai.beta.chat.completions.runTools({
                tools: Object.values(tools),
                ...apiInput
            }).on('message', (msg) => {
                if (msg.role === GPTRole.Tool) {
                    log.info(`finished processing tool (${msg.tool_call_id})`);
                    const message = new GPTMessage({ role: GPTRole.Tool, content: msg.content as string, tool_call_id: msg.tool_call_id })
                    this.addNonDiscordMessage(message);
                    this.emitter.emit(ConversationEvents.FunctionCallResult, msg);
                } else if (msg.role === GPTRole.Assistant) {
                    let message = new GPTMessage()
                    message.name = "PepperBot";
                    message.role = GPTRole.Assistant;
                    if (msg.tool_calls && msg.tool_calls.length >= 1) { // TODO: some of these arent getting added cuz they're not actually discord messages, which makes openai error
                        for (const toolCall of msg.tool_calls) {
                            log.info(`processing tool call "${toolCall.function.name}" (${toolCall.id})`);
                            this.emitter.emit(ConversationEvents.FunctionCall, toolCall);
                        }
                        message.tool_calls = msg.tool_calls;
                        this.addNonDiscordMessage(message); // have to do this because openai will error if it doesnt find it, also tool call messages have no content so it shouldn't matter.
                    }
                    message.content = msg.content as string;
                    console.log(message)
                    // we dont add the message because its not yet a discord message
                }
            });

            return await response.finalChatCompletion();
        } catch (err: any) {
            log.error(`internal error while executing GPT:`);
            log.error(err);
            this.emitter.emit(ConversationEvents.FatalError, `${err.message}`);
            return;
        }
    }
    constructor(message: Message | GPTFormattedCommandInteraction) {
        this.users.push(message.author);
        const prompt = getPrompt(message.author.id);
        this.messages.push(new GPTMessage({ role: GPTRole.System, content: prompt }));
        if (message instanceof Message && message.reference && message.reference.messageId) {
            message.channel.messages.fetch(message.reference.messageId).then((msg) => {
                if (msg) {
                    this.addMessage(msg, GPTRole.User);
                } else {
                    log.error(`error fetching referenced message: ${message?.reference?.messageId}`);
                }
            }).catch((err) => {
                log.error(`error fetching referenced message: ${err}`);
            });
        }
    }
}

function getPrompt(user: string): string { // userid
    // functionality not done
    return botPrompt
}

export function getConversation(message: Message | GPTFormattedCommandInteraction) {
    let currentConversation = conversations.find((conv) => conv && conv.messages.find((msg) => (message instanceof Message) && msg.message_id === message.reference?.messageId)) || conversations.find((conv) => conv.users.find((user) => user.id === message.author.id));
    if ((message instanceof Message) && (message.mentions !== undefined) && message.mentions.has(message.client.user as User) && message.content?.includes(`<@!${message.client.user?.id}>`)) { // if the message is a mention of the bot, start a new conversation
        if (currentConversation) { // TODO: thisll cause issues because someone else can just reply into a conversation with an @ and itll just delete the conversation
            conversations = conversations.filter((conv) => conv.id !== currentConversation?.id);
            currentConversation = undefined;
        }
    }
    if (!currentConversation) {
        currentConversation = new Conversation(message);
        conversations.push(currentConversation);
    }
    console.log(util.inspect(currentConversation.messages, { depth: 1, colors: true }))
    return currentConversation;
}

export enum GPTProcessorLogType {
    ToolCall = "ToolCall",
    ToolCallResult = "ToolCallResult",
    SentMessage = "Message",
    Error = "Error",
    Warning = "Warning",
    FollowUp = "FollowUp",
}

export class GPTProcessor {
    repliedMessage: Message | FormattedCommandInteraction | undefined = undefined;
    sentMessage: Message | undefined = undefined;
    async log({ t, content }: { t: GPTProcessorLogType, content: string }) { // this is named log because then you can literally just plug console into it and itll work
        if (!this.sentMessage) {
            log.error(`no sent message to log to`);
            return;
        } // TODO: use discord action instead of the default methods
        if (t !== GPTProcessorLogType.SentMessage && t !== GPTProcessorLogType.FollowUp) {
            const editContent = this.sentMessage.content + `\n-# [${t}] ${content}`;
            return await this.sentMessage.edit({ content: editContent });
        } else if (t === GPTProcessorLogType.SentMessage) {
            return await this.sentMessage.edit({ content: content });
        } else if (t === GPTProcessorLogType.FollowUp) {
            if (this.repliedMessage instanceof Message) {
                const channel = this.repliedMessage.channel;
                if (channel && channel instanceof TextChannel) {
                    return await channel.send(content);
                } else {
                    return await this.sentMessage.edit({ content: this.sentMessage.content + `\n${content}` });
                }
            }
            if ((this.repliedMessage as FormattedCommandInteraction)) {
                const forced_ephemeral = (((this.repliedMessage as FormattedCommandInteraction).memberPermissions?.has(PermissionFlagsBits.UseExternalApps)) && (this.repliedMessage?.client.guilds.cache.find((g) => g.id === this.repliedMessage?.guildId) !== undefined) && this.repliedMessage?.guildId !== undefined) ? true : false
                if (forced_ephemeral) {
                    return await this.repliedMessage?.followUp(content);
                } else {
                    const channel = this.repliedMessage?.channel;
                    if (channel && channel instanceof TextChannel) {
                        return await channel.send(content);
                    }
                }
            }
        }
    }
}

const typingSpeedWPM = 500; // words per minute
const messageSplitCharacters = "$SPLIT_MESSAGE$"

export async function respond(userMessage: Message | GPTFormattedCommandInteraction, processor: GPTProcessor) {
    const conversation = getConversation(userMessage);
    await conversation.addMessage(userMessage, GPTRole.User);
    conversation.on(ConversationEvents.FunctionCall, async (toolCall: ChatCompletionMessageToolCall) => {
        await processor.log({ t: GPTProcessorLogType.ToolCall, content: `${toolCall.function.name} (${toolCall.id}) with args ${JSON.stringify(toolCall.function.arguments, null, 2).replaceAll(/\n/g, ' ').replaceAll("\\", "")}` });
    });
    conversation.on(ConversationEvents.FatalError, async (error: any) => {
        await processor.log({ t: GPTProcessorLogType.Error, content: `fatal error: ${error}; debug data will persist` });
        conversation.removeAllListeners();
    });
    conversation.on(ConversationEvents.FunctionCallResult, async (result: ChatCompletionToolMessageParam) => {
        await processor.log({ t: GPTProcessorLogType.ToolCallResult, content: `completed tool call ${result.tool_call_id}` });
    }); // no need to log any of these, they're all already logged elsewhere
    const response = await conversation.run();
    const fullMessageContent = response?.choices[0]?.message?.content;
    let messages = fullMessageContent?.split(messageSplitCharacters) || [fullMessageContent || ""];
    if (messages.length > 10) {
        const remainingMessages = messages.slice(10).join('\n');
        messages = [...messages.slice(0, 10), remainingMessages];
    }
    const sentEdit = await processor.log({ t: GPTProcessorLogType.SentMessage, content: messages[0] || "error while generating GPT response; the error has been logged. " });
    if (sentEdit) {
        conversation.addMessage(sentEdit, GPTRole.Assistant);
    }
    if (messages.length > 1) {
        for (let i = 1; i < messages.length; i++) {
            const typingDelay = Math.min((60 / typingSpeedWPM) * 1000 * messages[i].split(' ').length, 1000);
            await new Promise(resolve => setTimeout(resolve, typingDelay));
            if (processor.repliedMessage instanceof Message) {
                if (processor.repliedMessage.channel && processor.repliedMessage.channel instanceof TextChannel) {
                    await processor.repliedMessage.channel.sendTyping();
                }
            }
            const sentMessage = await processor.log({ t: GPTProcessorLogType.FollowUp, content: messages[i] });
            if (sentMessage) {
                conversation.addMessage(sentMessage, GPTRole.Assistant);
            }
        }
    }
    conversation.removeAllListeners();
}