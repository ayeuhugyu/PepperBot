import { randomUUIDv7 } from "bun";
import { Attachment, Collection, Message, User } from "discord.js";
import { Prompt } from "../prompt_manager";
import { getDefaultPrompt } from "./officialPrompts";
import { Models, Model } from "./models";
import { client } from "../../bot";
import * as log from "../log";
import { incrementGPTModelUsage } from "../statistics";
import { tools, ToolType } from "./tools";
import chalk from "chalk";
import * as action from "../discord_action";
import { DiscordAnsi } from "../discord_ansi";
import { randomId } from "../id";
import { FormattedCommandInteraction } from "../classes/command";

export enum GPTAttachmentType {
    Text = "text",
    Image = "image",
    Video = "video",
    Audio = "audio",
    Unknown = "unknown"
}

export const userPrompts = new Map<string, Prompt>();

function getAttachmentType({ filename, url }: { filename: string, url: string }): GPTAttachmentType {
    const ext = filename.split('.').pop()?.toLowerCase();
    // TODO: finish
    // unfinished functionality, will be expanded later
        // first, detect by extension. if its not video or image or audio, then download it and test it for utf8 encoding to test for text
    return GPTAttachmentType.Text;
}

// TODO: update everything to allow for GPTFormattedCommandInteraction

export type GPTFormattedCommandInteraction = FormattedCommandInteraction & {
    author: User;
    content: string;
    attachments: Collection<string, Attachment>;
}

export class GPTAttachment<T extends GPTAttachmentType> {
    type: T; // will be set in the constructor by a detection function
    url?: string; // if the AI is uploading attachments (planned feature), it won't have a URL so it has to be able to be set later
    filename: string; // must be defined in constructor
    content: T extends GPTAttachmentType.Text ? string : never = undefined as never;

    constructor(filename: string, url?: string) {
        this.filename = filename;
        this.url = url;
        this.type = getAttachmentType({ filename, url: url || "" }) as T; // type assertion to ensure T is correct
        if (this.type === GPTAttachmentType.Text) {
            (this as GPTAttachment<GPTAttachmentType.Text>).content = "" as any; // placeholder for text content
        } else {
            this.content = undefined as never; // ensure content is not set for non-text attachments
        }
    }
}

export class ToolCall {
    id: string = "unknown"; // unique ID for the tool call; will generally be the one used by openai, not this one.
    name: string = "UnknownTool"; // name of the tool
    parameters: Record<string, any> = {}; // parameters for the tool call, will be converted to the correct type later

    constructor(args: Omit<ToolCall, "serialize">) {
        this.id = args.id
        this.name = args.name
        this.parameters = args.parameters
    }

    serialize(discordCompatible = false) {
        const c = discordCompatible ? DiscordAnsi : chalk;
        // Visually rich, readable, and compact tool call serialization
        const lines = [];
        lines.push(
            (discordCompatible
                ? DiscordAnsi.gold(DiscordAnsi.bold(" Tool Call ")) + c.gray(`  [${this.name}]  `) + c.gray(`#${this.id}`)
                : chalk.bgYellowBright.bold.black(" Tool Call ") + chalk.gray(`  [${this.name}]  `) + chalk.gray(`#${this.id}`)
            )
        );
        lines.push(c.gray(`  Parameters:`));
        if (Object.keys(this.parameters).length > 0) {
            lines.push(c.white(JSON.stringify(this.parameters, null, 2).split("\n").map(l => "  " + l).join("\n")));
        } else {
            lines.push(c.gray("  [no parameters]"));
        }
        return lines.join("\n");
    }
}

export class GPTMessage {
    content?: string = undefined;
    attachments: GPTAttachment<any>[] = [];
    role: "user" | "bot";
    toolCalls?: ToolCall[];
    author: User;
    discordId?: string;
    timestamp: Date = new Date();
    serialize(discordCompatible = false) {
        const c = discordCompatible ? DiscordAnsi : chalk;
        // Visually rich, readable, and compact message serialization
        const lines = [];
        lines.push(
            (discordCompatible
                ? c.bgBlue(c.bold(` GPT Message `)) + c.gray(`  [${this.role.toUpperCase()}]  `) + c.green(this.author.username) + c.gray(` (${this.author.id})`)
                : chalk.bgBlueBright.bold.black(` GPT Message `) + chalk.gray(`  [${this.role.toUpperCase()}]  `) + chalk.greenBright(this.author.username) + chalk.gray(` (${this.author.id})`)
            )
        );
        lines.push(c.gray(`  ${this.timestamp.toLocaleString()}`));
        lines.push("");
        if (this.content) {
            lines.push(c.bold("Content:") +
                "\n" + c.white(this.content.split("\n").map(l => "  " + l).join("\n")));
        }
        if (this.attachments.length) {
            lines.push(c.bold("Attachments:") +
                "\n" + this.attachments.map(att =>
                    c.cyan("  • ") + (discordCompatible ? DiscordAnsi.gold(att.filename) : chalk.yellow(att.filename)) + c.gray(` (${att.type})`)
                ).join("\n"));
        }
        if (this.toolCalls?.length) {
            lines.push(c.bold("Tool Calls:") +
                "\n" + this.toolCalls.map(call =>
                    c.cyan("  → ") + c.magenta(call.name) +
                    c.gray(` [${call.id}]`) +
                    (Object.keys(call.parameters).length
                        ? c.gray(": ") + c.white(JSON.stringify(call.parameters))
                        : "")
                ).join("\n"));
        }
        lines.push("");
        return lines.join("\n");
    }

    constructor(params: Omit<GPTMessage, "timestamp" | "attachments" | "author" | "serialize"> & Partial<Pick<GPTMessage, "attachments" | "author">>) {
        this.content = params.content;
        this.attachments = params.attachments || [];
        this.role = params.role;
        this.author = params.author || (client.user as User);
        this.discordId = params.discordId;
        this.toolCalls = params.toolCalls || [];
    }
}

export class ToolCallResponse {
    role: "tool" = "tool";
    call: {
        id: string;
        name: string;
        parameters: Record<string, any>;
    } = {
        id: "unknown", // unique ID for the tool call; will generally be the one used by openai, not this one.
        name: "UnknownTool",
        parameters: {}
    }
    response: {
        data: any;
        error: boolean;
    } = {
        data: "An unknown tool was called. This should never happen.",
        error: true
    };
    date: Date = new Date(); // timestamp of the tool call response

    serialize(discordCompatible = false) {
        const c = discordCompatible ? DiscordAnsi : chalk;
        // Visually rich, readable, and compact tool call response serialization
        const lines = [];
        lines.push(
            (discordCompatible
                ? DiscordAnsi.gold(DiscordAnsi.bold(" Tool Call Response ")) + c.gray(`  [${this.call.name}]  `) + c.gray(`#${this.call.id}`)
                : chalk.bgMagentaBright.bold.black(" Tool Call Response ") + chalk.gray(`  [${this.call.name}]  `) + chalk.gray(`#${this.call.id}`)
            )
        );
        lines.push(c.gray(`  ${this.date.toLocaleString()}`));
        lines.push("");
        lines.push(c.bold("Parameters:") +
            "\n" + c.white(JSON.stringify(this.call.parameters, null, 2).split("\n").map(l => "  " + l).join("\n")));
        lines.push(c.bold("Response:") +
            "\n" + c.white(JSON.stringify(this.response.data, null, 2).split("\n").map(l => "  " + l).join("\n")));
        lines.push(
            c.bold("Error:") +
            " " + (this.response.error ? c.red(" TRUE ") : c.green(" FALSE "))
        );
        lines.push("");
        return lines.join("\n");
    }

    constructor(callId: string, toolName: string, parameters: Record<string, any>, data: any, error: boolean = false) {
        this.call.id = callId;
        this.call.name = toolName;
        this.call.parameters = parameters;
        this.response.data = data;
        this.response.error = error;
    }
}

export const conversations: Conversation[] = [];

export class Conversation {
    id: string = randomId(); // TODO: replace this with the same ID system as p/schedule
    users: User[] = []; // do not include bot user
    prompt: Prompt = getDefaultPrompt();
    model: Model = Models["gpt-4.1-nano"] // default model, can be changed later
    api_parameters: Partial<Record<keyof typeof this.model["parameters"], string | number>> = {}; // users can only input strings, they will be converted to the correct type later by the corrosponding function
    messages: (GPTMessage | ToolCallResponse)[] = [];

    private _onToolCallListener: ((calls: ToolCall[]) => void) | null = null;

    constructor() {
        conversations.push(this);
        return this;
    }

    bindOnToolCall(fn: (calls: ToolCall[]) => void) {
        log.debug(`Binding onToolCall listener for conversation ${this.id}.`);
        this._onToolCallListener = fn;
    }

    unbindOnToolCall() {
        log.debug(`Unbinding onToolCall listener for conversation ${this.id}.`);
        this._onToolCallListener = null;
    }

    addMessage(message: GPTMessage, doNotAddUser: boolean = false) {
        log.debug(`Adding message to conversation ${this.id}:`, message.serialize());
        this.messages.push(message);

        if (!doNotAddUser) this.addUser(message.author); // ensure the user is added to the conversation

        return message;
    }

    addToolCallResponse(response: ToolCallResponse) {
        log.debug(`Adding tool call response to conversation ${this.id}:`, response.serialize());
        this.messages.push(response);
        // do not add user, as this is a tool response
        return response;
    }

    addDiscordMessage(message: Message) {
        const gptMessage = new GPTMessage({
            content: message.content,
            attachments: message.attachments?.map(att => new GPTAttachment(att.name, att.url)),
            role: "user",
            author: message.author,
            discordId: message.id
        });
        this.addMessage(gptMessage);
        return gptMessage;
    }

    delete() {
        const conversationIndex = conversations.findIndex(c => c.id === this.id);
        if (conversationIndex !== -1) {
            conversations.splice(conversationIndex, 1);
        }
    }

    removeUser(user: User) {
        const userIndex = this.users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            this.users.splice(userIndex, 1);
        }
        // if there are no users left, delete the conversation
        if (this.users.length === 0) {
            this.delete();
        }
    }

    addUser(user: User) {
        if (this.users.some(u => u.id === user.id)) {
            return this; // user already in conversation
        }
        this.users.push(user);
        return this;
    }

    async processToolCalls(message: GPTMessage) {
        log.debug(`Processing tool calls for message in conversation ${this.id}:`, message.toolCalls?.map(tc => tc.serialize()).join("\n"));
        if (!message.toolCalls || message.toolCalls.length === 0) {
            log.debug(`No tool calls to process for message in conversation ${this.id}.`);
            return;
        }
        // Call the single listener with the tool calls, if set
        if (this._onToolCallListener) {
            try { this._onToolCallListener(message.toolCalls); } catch (e) { log.warn('Error in onToolCall listener:', e); }
        }
        const tools = this.getTools();
        for (const call of message.toolCalls) {
            const tool = Object.entries(tools).find(([key, t]) => t.data.name === call.name)?.[1];
            if (!tool) {
                log.warn(`Tool ${call.name} not found for conversation ${this.id}.`);
                continue;
            }
            if (tool.data.type !== ToolType.Official) {
                const errorResponse = new ToolCallResponse(call.id, call.name, call.parameters, { error: `Custom tool calls are not yet supported. Please inform the user of this.` }, true);
                this.addToolCallResponse(errorResponse);
                log.warn(`Attempt to call custom tool ${call.name} in conversation ${this.id}. This is not supported yet.`);
                continue;
            }
            try {
                const response = await tool.function(call.parameters);
                const toolResponse = new ToolCallResponse(call.id, call.name, call.parameters, response);
                this.addToolCallResponse(toolResponse);
            } catch (err) {
                log.error(`Error running tool ${call.name} for conversation ${this.id}:`, err);
                const errorResponse = new ToolCallResponse(call.id, call.name, call.parameters, { error: err }, true);
                this.addToolCallResponse(errorResponse);
            }
        }
    }

    async run(): Promise<GPTMessage> {
        log.debug(`Running model ${this.model.name} for conversation ${this.id} with prompt:`, this.prompt.author.username + "/" + this.prompt.name);
        const start = performance.now();
        let didError = false;
        const res = await this.model.runner(this).catch(err => {
            log.error(`Error running model ${this.model.name} for conversation ${this.id}:`, err);
            didError = true;
            return new GPTMessage({
                content: `Error running model: ${err.message}`,
                role: "bot",
                author: client.user as User,
            });
        });
        if (!didError) await incrementGPTModelUsage(this.model.name);
        this.addMessage(res);
        let didAnyToolCalls = false;
        if (res.toolCalls && res.toolCalls.length > 0) {
            const currentMessageLength = this.messages.length;
            await this.processToolCalls(res);
            if (this.messages.length > currentMessageLength) didAnyToolCalls = true;
        }
        const end = performance.now();
        log.info(`GPT Message generated for conversation ${this.id} with model ${this.model.name} in ${(end - start).toFixed(3)}ms.`);
        if (didAnyToolCalls) {
            return await this.run(); // re-run the model to process the tool call responses that were added, but only if new messages were added
        }
        return res;
    }
    // TODO: finish
    getTools() { // functionality for this is incomplete, will be expanded later
        // i hope to make it so that with prompts you can disable specific tools or add custom tools which prompt the user for return values
        return tools;
    }

    filterParameters() {
        const availableParameters = Object.keys(this.model.parameters);
        const filteredParameters: Record<string, unknown> = {};
        const entries = Object.entries(this.api_parameters || {});
        const filteredEntries = entries.filter(([key, _]) => availableParameters.includes(key));
        return Object.fromEntries(filteredEntries);
    }

    serialize(discordCompatible = false) {
        const c = discordCompatible ? DiscordAnsi : chalk;
        // Visually rich, readable, and compact conversation serialization
        const lines = [];
        lines.push(
            (discordCompatible
                ? c.cyan(c.bold(` Conversation `)) + c.gray(`  #${this.id}`)
                : chalk.bgCyan.bold.black(` Conversation `) + chalk.gray(`  #${this.id}`)
            )
        );
        lines.push("");
        lines.push(c.bold("Users:") +
            (this.users.length
                ? "\n" + this.users.map(u =>
                    "  " + c.green(u.username) + c.gray(` (${u.id})`)
                ).join("\n")
                : " " + c.gray("[no users]"))
        );
        lines.push(c.bold("Prompt:") +
            " " + (discordCompatible ? DiscordAnsi.gold(`${this.prompt.author.username}/${this.prompt.name}`) : chalk.yellow(`${this.prompt.author.username}/${this.prompt.name}`))
        );
        lines.push(c.bold("Model:") +
            " " + c.cyan(this.model.name)
        );
        lines.push(c.bold("API Parameters:") +
            (Object.entries(this.api_parameters).length
                ? "\n" + Object.entries(this.api_parameters).map(([key, value]) =>
                    "  " + c.cyan(key) + c.gray(": ") + c.white(value ? String(value) : "")
                ).join("\n")
                : " " + c.gray("[no API parameters]"))
        );
        lines.push("");
        lines.push(c.bold("Messages:") +
            (this.messages.length
                ? "\n" + this.messages.map((m, i) =>
                    c.gray("─".repeat(50)) +
                    "\n\n" + (typeof m.serialize === "function" ? m.serialize(discordCompatible).split("\n").map(l => "  " + l).join("\n") : "")
                ).join("\n")
                : " " + c.gray("[no messages]"))
        );
        lines.push("");
        return lines.join("\n");
    }

    setPrompt(prompt: Prompt) {
        log.debug(`[Conversation ${this.id}] setPrompt called with prompt: ${prompt.name}`);
        this.prompt = prompt;
        Object.entries(prompt.api_parameters || {}).forEach(([key, value]) => {
            this.api_parameters[key as any] = value; // set the API parameters from the prompt
        });
    }
}

function ensureConversationByUserId(user: User, alwaysCreateNew: boolean = false): Conversation {
    const currentConversation = conversations.find(c => c.users.some(u => u === user));
    if (currentConversation && !alwaysCreateNew) {
        log.debug(`Found existing conversation for user ${user.username} (${user.id}):`, currentConversation.id);
        return currentConversation
    }
    // alwaysCreateNew is always true from here on
    log.debug(`No existing conversation found for user ${user.username} (${user.id}) or alwaysCreateNew was true, creating a new one.`);
    currentConversation?.removeUser(user); // remove the user from the current conversation if it exists
    const newConversation = new Conversation();
    newConversation.addUser(user);
    newConversation.setPrompt(userPrompts.get(user.id) || getDefaultPrompt());
    if (userPrompts.get(user.id)) {
        userPrompts.delete(user.id); // remove the user prompt if it exists, as it will be set on the conversation
    }
    log.debug(`Created new conversation for user ${user.username} (${user.id}):`, newConversation.id);
    return newConversation;
}

function getConversationByMessageId(messageId: string): Conversation | undefined {
    return conversations.find(c => c.messages.some(m => ('discordId' in m) && (m.discordId === messageId)));
}

export async function getConversation(message: Message) {
    log.debug(`Getting conversation for message ${message.id} from user ${message.author.username} (${message.author.id})`);
    // if the message directly mentions the bot, create a new conversation
    let messageIdConversation = getConversationByMessageId(message.reference?.messageId || "");
    if (message.content.includes(`<@${client.user?.id}>`) || message.content.includes(`<@!${client.user?.id}>`)) {
        log.debug(`Message ${message.id} directly mentions the bot, creating a new conversation.`);
        const newConversation = ensureConversationByUserId(message.author, true);
        let repliedMessage = null;
        try {
            repliedMessage = await message.channel.messages.fetch(message.reference?.messageId || "");
        } catch (err) {
            log.warn(`Failed to fetch replied message for message ${message.id}:`, err);
        }
        if (repliedMessage) {
            newConversation.addDiscordMessage(repliedMessage);
            log.debug(`Added replied message to new conversation ${newConversation.id}.`);
        }
        return newConversation;
    } else if (messageIdConversation) {
        log.debug(`Found existing conversation for message ${message.id}:`, messageIdConversation.id);
        return messageIdConversation;
    } else {
        log.debug(`Could not find existing conversation via message search, checking by user ID.`);
        return ensureConversationByUserId(message.author);
    }
}

function messageifyToolCall(call: ToolCall): string {
    return `-# [tool call]: ${call.name} (${call.id}) with parameters: ${JSON.stringify(call.parameters).replaceAll("\n", " ")}`;
}

export async function respond(message: Message) {
    const conversation = await getConversation(message);
    conversation.addDiscordMessage(message);
    log.info(`Responding to message in conversation ${conversation.id} from user ${message.author.username} (${message.author.id})`);

    let currentContent = "processing..."

    const processingMessage = await action.reply(message as Message<true>, { content: "processing..." });
    if (!processingMessage) {
        return log.error(`Failed to send processing message for conversation ${conversation.id}.`);
    }

    conversation.bindOnToolCall(async (calls: ToolCall[]) => {
        currentContent += `\n${calls.map(messageifyToolCall).join("\n")}`;
        action.edit(processingMessage, {
            content: currentContent
        })
    });

    try { // TODO: add attachment support
        const response = await conversation.run();
        log.debug(`Response generated for conversation ${conversation.id}:`, response.serialize());
        await action.edit(processingMessage, { content: response.content || "No response content generated."} );
    } catch (error: any) {
        log.error(`Error responding to message in conversation ${conversation.id}:`, error);
        await action.edit(processingMessage, { content: "error occurred while generating gpt response; " + error.message || error.toString() });
    }

    conversation.unbindOnToolCall();
}