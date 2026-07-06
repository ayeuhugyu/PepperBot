import { Client, Collection, Guild, Message, User } from "discord.js";
import { AnyModel, InferModelParameters, Model, ModelParameter } from "./modelTypes"
import { AnyPrompt, Prompt, promptParameterTypings } from "./promptManager"
import { getDefaultPrompt } from "./officialPrompts";
import { ModelName, models } from "./models";
import * as log from "../log";
import { randomId } from "../id";
import { AnyGPTAttachment, AnyGPTMessage, GPTAssistantMessage, GPTAttachment, GPTAttachmentType, GPTMessageType, GPTMessageTypeMap, GPTSystemMessage, GPTToolCall, GPTToolResponse, GPTUser, GPTUserMessage, initGPTFetchClient } from "./messageTypes";
import { Mutex } from "async-mutex";
import { modelRunnerIndex } from "./modelRunners";
import { ToolName, tools } from "./tools";
import { InferParameters, ToolErrorResponse } from "./toolTypes";
import EventEmitter from "events";
import TypedEventEmitter from "typed-emitter";
import { initReplacerClient } from "./contentReplace";
import { initTemplatingClient } from "./promptTemplating";
import database from "../data_manager";
import { parseDBAttachments } from "./parseDbAttachments";
import { Tables } from "knex/types/tables";

let client: Client | undefined = undefined;
export function initGPTClients(newClient: Client) {
    client = newClient;
    initReplacerClient(newClient);
    initTemplatingClient(newClient);
    initGPTFetchClient(newClient);
}

const defaultPrompt = await getDefaultPrompt();

export class Conversation<M extends AnyModel = AnyModel> {
    id: string = randomId("conv");
    messages: AnyGPTMessage[] = [];
    prompt: Prompt<M> = defaultPrompt as unknown as Prompt<M>;
    promptParameterOverrides: Partial<InferModelParameters<typeof promptParameterTypings>> = {};
    modelParameterOverrides: Partial<InferModelParameters<M['parameters']>> = {};
    model: M = models['gpt-4.1-nano'] as unknown as M;
    users: GPTUser[] = [];
    isRunningMutex: Mutex = new Mutex();
    readonly emitter = new EventEmitter() as TypedEventEmitter<{
        message: (message: AnyGPTMessage) => void;
        toolCall: (tc: GPTToolCall) => void;
        toolCallResponse: (res: GPTToolResponse) => void;
        customToolCall: (tc: GPTToolCall) => void;
    }>;

    addMessage(...messages: AnyGPTMessage[]) {
        log.debug(`adding gpt messages to conversation ${this.id}`);
        log.debug(messages.map(m => m.id));
        messages.forEach(m => {
            this.emitter.emit("message", m);
            if (m.type === GPTMessageType.User) {
                if (!this.users.find((u) => u.id === m.author?.id)) this.users.push(m.author);
            }
            if (m.type === GPTMessageType.ToolCall) {
                this.emitter.emit("toolCall", m);
                if (!(m.toolName in tools)) {
                    // is custom tool
                    this.emitter.emit("customToolCall", m);
                }
            }
            if (m.type === GPTMessageType.ToolResponse) {
                this.emitter.emit("toolCallResponse", m);
            }
        })
        this.messages.push(...messages);
    }

    setPrompt(prompt: AnyPrompt) {
        log.debug(`setting prompt of ${this.id} to ${prompt.author.username}/${prompt.name}`);
        const conv = this as Conversation<typeof prompt.model>;
        conv.prompt = prompt;
        conv.model = prompt.model;
        // no need to update the prompt's model parameters, they'll be filtered later on their own.
        log.debug(`set prompt on conversation ${this.id} to ${prompt.author.id}/${prompt.name}`)
        return conv;
    }

    sortMessages() {
        log.debug(`sorting messages for gpt conversation ${this.id}`);
        this.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    getLatestMessage<T extends GPTMessageType>(type?: GPTMessageType): GPTMessageTypeMap[T] | undefined {
        this.sortMessages();
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const msg = this.messages[i];
            if (!type || (msg && msg.type === type)) {
                return msg as GPTMessageTypeMap[T];
            }
        }
        return undefined;
    }

    getModelParameters(): Partial<InferModelParameters<M['parameters']>> {
        const allParameters = { ...(this.prompt?.modelParameters ?? {}), ...this.modelParameterOverrides };
        // filter them
        const filteredParameters: Record<string, Partial<InferModelParameters<M['parameters']>>[string]> = {};
        Object.entries(allParameters).forEach(([k, v]) => {
            if (k in this.model.parameters) filteredParameters[k] = v;
        });

        return filteredParameters as Partial<InferModelParameters<M['parameters']>>;
    }

    getPromptParameters(): Partial<InferModelParameters<typeof promptParameterTypings>> {
        return { ...(this.prompt?.promptParameters ?? {}), ...this.promptParameterOverrides };;
    }

    getUnansweredToolCalls(): GPTToolCall[] {
        return this.messages.filter(m => m.type === GPTMessageType.ToolCall && m.answered == false) as GPTToolCall[];
    }

    async run(): Promise<GPTAssistantMessage | undefined> {
        // acquire running mutex
        const release = await this.isRunningMutex.acquire();
        try {
            this.sortMessages();
            let response = await modelRunnerIndex[this.model.name as ModelName](this);
            this.addMessage(...response);
            let unansweredToolCalls = this.getUnansweredToolCalls();
            while (unansweredToolCalls.length > 0) {
                await Promise.all(unansweredToolCalls.map(async (tc) => {
                    if (tc.toolName in tools) {
                        // is official tool
                        const tool = tools[tc.toolName as ToolName];
                        const response = await tool.execute(tc.arguments as unknown as any);
                        this.addMessage(new GPTToolResponse({
                            response: response,
                            toolCallId: tc.toolCallId,
                            toolName: tc.toolName,
                        }));

                        tc.answered = true;
                        return;
                    } else {
                        // is custom tool
                        // do nothing, wait for a tool response to be added. if it takes longer than 15 minutes for that, timeout
                        const start = Date.now();
                        while (!tc.fetchResponse(this)) {
                            if ((Date.now() - start) > 15 * 60 * 1000) {
                                this.addMessage(new GPTToolResponse({
                                    response: new ToolErrorResponse("custom tool response took longer than 15 minutes and timed out."),
                                    toolCallId: tc.toolCallId,
                                    toolName: tc.toolName,
                                }));
                            }

                            await new Promise((resolve) => setTimeout(resolve, 1000)); // check only every second to prevent super ultra spam
                        }

                        tc.answered = true;
                        return;
                    }
                }));

                response = await modelRunnerIndex[this.model.name as ModelName](this);
                this.addMessage(...response);
                unansweredToolCalls = this.getUnansweredToolCalls();
            }

            await this.write();

            return response.filter(m => m.type === GPTMessageType.Assistant)[0];
        } catch (err) {
            log.error(`error while running gpt conversation ${this.id}:`);
            log.error((err as unknown as Error)?.message?.replaceAll(/(?:http[s]?:\/\/.)?(?:www\.)?[-a-zA-Z0-9@%._\+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/gm, "[URL REDACTED]") ?? "unknown error, full error found on debug loglevel");
            // shoutout regex from https://regex101.com/r/3fYy3x/1
            log.debug(`error while running gpt conversation ${this.id}:`);
            log.debug(err);
        } finally {
            release();
        }
    }

    async fetchGuild(): Promise<Guild | null> {
        let guild: Guild | null = null;
        await Promise.all(this.messages.map(async (m) => {
            if (m.type === GPTMessageType.User) {
                if (!m.beenDeleted) {
                    const msg = await m.fetchDiscordMessage();
                    if (msg) {
                        guild = msg.guild;
                        return guild;
                    }
                }
            }
        }));

        return guild;
    }

    async write() {
        try {
            log.debug(`writing conversation ${this.id}`);

            await database.transaction(async (trx) => {
                // write metadata
                await trx("gpt_conversation_meta")
                    .insert({
                        id: this.id,
                        model: this.model.name,
                        prompt_author_id: this.prompt.author.id,
                        prompt_name: this.prompt.name,
                        model_parameter_overrides: JSON.stringify(this.modelParameterOverrides),
                        prompt_parameter_overrides: JSON.stringify(this.promptParameterOverrides),
                    })
                    .onConflict("id")
                    .merge();

                // write users
                for (const user of this.users) {
                    await trx("gpt_users").insert({
                        conversation_id: this.id,
                        id: user.id,
                        username: user.username,
                        avatar: user.avatar,
                    }).onConflict(['conversation_id', 'id']).merge()
                };

                // write messages
                for (const msg of this.messages) {
                    let attachmentPromises: Promise<any>[] = [];
                    switch (msg.type) {
                        case GPTMessageType.Assistant:
                            await trx("gpt_assistant_messages").insert({
                                conversation_id: this.id,
                                type: "assistant",
                                id: msg.id,
                                created_at: msg.createdAt.getTime(),
                                content: msg.content,
                                tool_call_ids: JSON.stringify(msg.toolCallIds),
                                been_deleted: msg.beenDeleted,
                                sent: msg.sent,
                                discord_message_id: msg.discordData?.messageId,
                                discord_reference_id: msg.discordData?.referenceMessageId,
                                discord_channel_id: msg.discordData?.channelId,
                                discord_guild_id: msg.discordData?.guildId,
                            }).onConflict("id").merge();

                            // write attachments for this message (if applicable)
                            if (msg.attachments.length > 0) {
                                for (const att of msg.attachments) {
                                    attachmentPromises.push(trx("gpt_attachments").insert({
                                        id: att.id,
                                        filename: att.filename,
                                        expires_at: att.expiresAt.getTime(),
                                        message_id: msg.id,
                                        size: att.size,
                                        type: att.type,
                                        url: att.url,
                                        content: att.type === GPTAttachmentType.Text ? att.content : undefined,
                                        error: att.type === GPTAttachmentType.Error ? att.error : undefined,
                                    }).onConflict("id").merge());
                                }
                                await Promise.all(attachmentPromises);
                            }
                        break;
                        case GPTMessageType.User:
                            await trx("gpt_user_messages").insert({
                                conversation_id: this.id,
                                type: "user",
                                id: msg.id,
                                author_id: msg.author.id,
                                created_at: msg.createdAt.getTime(),
                                content: msg.content,
                                been_deleted: msg.beenDeleted,
                                discord_message_id: msg.discordData?.messageId,
                                discord_reference_id: msg.discordData?.referenceMessageId,
                                discord_channel_id: msg.discordData?.channelId,
                                discord_guild_id: msg.discordData?.guildId,
                            }).onConflict("id").merge();

                            // write attachments for this message (if applicable)
                            if (msg.attachments.length > 0) {
                                for (const att of msg.attachments) {
                                    attachmentPromises.push(trx("gpt_attachments").insert({
                                        id: att.id,
                                        filename: att.filename,
                                        expires_at: att.expiresAt.getTime(),
                                        message_id: msg.id,
                                        size: att.size,
                                        type: att.type,
                                        url: att.url,
                                        content: att.type === GPTAttachmentType.Text ? att.content : undefined,
                                        error: att.type === GPTAttachmentType.Error ? att.error : undefined,
                                    }).onConflict("id").merge())
                                }
                                await Promise.all(attachmentPromises);
                            }
                        break;
                        case GPTMessageType.System:
                            await trx("gpt_system_messages").insert({
                                conversation_id: this.id,
                                type: "system",
                                id: msg.id,
                                created_at: msg.createdAt.getTime(),
                                content: msg.content,
                            }).onConflict("id").merge();
                        break;
                        case GPTMessageType.ToolCall:
                            await trx("gpt_tool_call_messages").insert({
                                conversation_id: this.id,
                                type: "tool_call",
                                id: msg.id,
                                tool_call_id: msg.toolCallId,
                                tool_name: msg.toolName,
                                // Ensure this is stringified since Knex won't auto-convert
                                // objects to JSON strings for all DB dialects
                                arguments: JSON.stringify(msg.arguments),
                                answered: msg.answered,
                                created_at: msg.createdAt.getTime(),
                            }).onConflict("id").merge();
                        break;
                        case GPTMessageType.ToolResponse:
                            await trx("gpt_tool_response_messages").insert({
                                conversation_id: this.id,
                                type: "tool_response",
                                id: msg.id,
                                tool_call_id: msg.toolCallId,
                                tool_name: msg.toolName,
                                response: JSON.stringify(msg.response),
                                created_at: msg.createdAt.getTime(),
                            }).onConflict("id").merge();
                        break;
                        default:
                            log.error(`wrongly typed message (WHADDAFUK!???!??) on conversation ${this.id}`);
                        break;
                    }
                }

                await trx.commit();
            });
        } catch (error) {
            log.error(`error writing conversation ${this.id}:`);
            log.error(error);
            log.debug(`error writing conversation`);
            log.debug(JSON.stringify(this));
        }
    }

    constructor(id?: string) {
        if (id) this.id = id;
        this.getModelParameters = this.getModelParameters.bind(this);
        this.getPromptParameters = this.getPromptParameters.bind(this);
    }

    async useOverrideData(userid: string, isNewConversation: boolean = true) {
        const userPromptDefault = await database("prompt_defaults").where({ user_id: userid }).first();
        if (userPromptDefault && isNewConversation) {
            this.setPrompt(((await Prompt.fromName(userPromptDefault.author_id ?? process.env.DISCORD_OAUTH_CLIENT_ID ?? "1209297323029565470", userPromptDefault.prompt_name ?? "default")) ?? (await getDefaultPrompt())) as Prompt<M>);
            log.debug(`changed prompt of conversation ${this.id} to \`${this.prompt.author.username}/${this.prompt.name}\` as it is ${userid}'s default prompt`);
        }
        const data = await database("gpt_starting_data_overrides").where({ user_id: userid }).first();
        if (data) {
            if (data.prompt_author_id && data.prompt_name) this.setPrompt(((await Prompt.fromName(data?.prompt_author_id ?? process.env.DISCORD_OAUTH_CLIENT_ID ?? "1209297323029565470", data?.prompt_name ?? "default")) ?? (await getDefaultPrompt())!) as Prompt<M>);
            log.debug(`changed prompt of conversation ${this.id} to \`${this.prompt.author.username}/${this.prompt.name}\` as it was set in ${userid}'s starting data overrides`);
            if (data.model) this.model = ((data?.model ?? "") in models ? models[data?.model as keyof typeof models] : models["gpt-4.1-nano"]) as M;
            if (data.prompt_parameter_overrides) this.promptParameterOverrides = JSON.parse(data?.prompt_parameter_overrides ?? "{}");
            if (data.model_parameter_overrides) this.modelParameterOverrides = JSON.parse(data?.model_parameter_overrides ?? "{}");
            // now that this conversation has used these overrides, drop them
            await database("gpt_starting_data_overrides").where({ user_id: userid }).delete();
        }
    }
}

export async function getConversation(id: string, noensure: true): Promise<Conversation | undefined>;
export async function getConversation(id?: string, noensure?: false): Promise<Conversation>;
export async function getConversation(id?: string, noensure?: boolean): Promise<Conversation | undefined> {
    if (!id) return new Conversation();
    const conversation = new Conversation(id);
    const dbmeta = await database("gpt_conversation_meta").select("*").where({ id }).first();
    if (noensure && !dbmeta) return undefined;

    const dbusers = await database("gpt_users").select("*").where({ conversation_id: id });
    const dbmessages = await database("gpt_messages").select("*").where({ conversation_id: id });

    conversation.prompt = (await Prompt.fromName(dbmeta?.prompt_author_id ?? process.env.DISCORD_OAUTH_CLIENT_ID ?? "1209297323029565470", dbmeta?.prompt_name ?? "default")) ?? (await getDefaultPrompt());
    conversation.model = (dbmeta?.model ?? "") in models ? models[dbmeta?.model as keyof typeof models] : models["gpt-4.1-nano"];
    conversation.promptParameterOverrides = JSON.parse(dbmeta?.prompt_parameter_overrides ?? "{}");
    conversation.modelParameterOverrides = JSON.parse(dbmeta?.model_parameter_overrides ?? "{}");
    conversation.users = dbusers;
    await Promise.all(dbmessages.map(async (msg) => {
        switch (msg.type) {
            case "user":
                const dbattachments = await database("gpt_attachments").where({ message_id: msg.id });
                conversation.messages.push(new GPTUserMessage({
                    createdAt: new Date(msg.created_at),
                    id: msg.id,
                    content: msg.content!,
                    author: dbusers.find(u => u.id === msg.author_id)!,
                    discordData: {
                        messageId: msg.discord_message_id!,
                        channelId: msg.discord_channel_id!,
                        referenceMessageId: msg.discord_reference_id!,
                        guildId: msg.discord_guild_id ?? undefined,
                    },
                    beenDeleted: msg.been_deleted!,
                    attachments: parseDBAttachments(dbattachments),
                }));
            break;
            case "assistant":
                const assistantDBAttachments = await database("gpt_attachments").where({ message_id: msg.id });
                conversation.messages.push(new GPTAssistantMessage({
                    createdAt: new Date(msg.created_at),
                    id: msg.id,
                    content: msg.content!,
                    discordData: {
                        messageId: msg.discord_message_id!,
                        channelId: msg.discord_channel_id!,
                        referenceMessageId: msg.discord_reference_id!,
                        guildId: msg.discord_guild_id ?? undefined,
                    },
                    beenDeleted: Boolean(msg.been_deleted),
                    attachments: parseDBAttachments(assistantDBAttachments),
                    toolCallIds: JSON.parse(msg.tool_call_ids ?? "[]"),
                }));
            break;
            case "tool_call":
                conversation.messages.push(new GPTToolCall({
                    createdAt: new Date(msg.created_at),
                    id: msg.id,
                    arguments: JSON.parse(msg.arguments ?? "{}"),
                    toolCallId: msg.tool_call_id!,
                    toolName: msg.tool_name!,
                    answered: Boolean(msg.answered),
                }));
            break;
            case "tool_response":
                conversation.messages.push(new GPTToolResponse({
                    createdAt: new Date(msg.created_at),
                    id: msg.id,
                    toolCallId: msg.tool_call_id!,
                    toolName: msg.tool_name!,
                    response: JSON.parse(msg.response!),
                }));
            break;
            case "system":
                conversation.messages.push(new GPTSystemMessage({
                    createdAt: new Date(msg.created_at),
                    id: msg.id,
                    content: msg.content ?? "",
                }));
            break;
        }
    }));

    conversation.sortMessages();

    return conversation;
}

export async function getConversationFromMessageId(messageId: string): Promise<Conversation | undefined> {
    const message = await database("gpt_messages").where({ discord_message_id: messageId }).first();
    if (message) {
        return await getConversation(message.conversation_id, true);
    }
    return undefined;
}

export async function getUsersLatestConversation(userid: string, noensure: true): Promise<Conversation | undefined>;
export async function getUsersLatestConversation(userid: string, noensure?: false): Promise<Conversation>;
export async function getUsersLatestConversation(userid: string, noensure?: boolean) {
    const message = await database("gpt_user_messages").where({ author_id: userid }).orderBy("created_at", "desc").first();
    return await getConversation(message?.conversation_id ?? "", (noensure ?? false) as any); // idfk why typescript doesn't like this
}

export async function shouldForceNextNew(userid: string) {
    const forceNewEntries = await database("gpt_force_next_new").select("*").where({ user_id: userid });
    const should = forceNewEntries.length > 0;
    if (should) await database("gpt_force_next_new").where({ user_id: userid }).delete();
    return should;
}

export async function writeOverrides(data: Tables["gpt_starting_data_overrides"]) {
    await database("gpt_starting_data_overrides").insert(data).onConflict("user_id").merge();
}