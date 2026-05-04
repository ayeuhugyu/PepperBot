import { Client, Collection, User } from "discord.js";
import { AnyModel, InferModelParameters, Model, ModelParameter } from "./modelTypes"
import { AnyPrompt, Prompt, promptParameterTypings } from "./promptManager"
import { getDefaultPrompt } from "./officialPrompts";
import { ModelName, models } from "./models";
import * as log from "../log";
import { randomId } from "../id";
import { AnyGPTMessage, GPTAssistantMessage, GPTMessageType, GPTMessageTypeMap, GPTToolCall, GPTToolResponse, GPTUser, GPTUserMessage, initGPTFetchClient } from "./messageTypes";
import { Mutex } from "async-mutex";
import { modelRunnerIndex } from "./modelRunners";
import { ToolName, tools } from "./tools";
import { InferParameters, ToolErrorResponse } from "./toolTypes";
import EventEmitter from "events";
import TypedEventEmitter from "typed-emitter";
import { initReplacerClient } from "./contentReplace";
import { initTemplatingClient } from "./promptTemplating";

let client: Client | undefined = undefined;
export function initGPTClients(newClient: Client) {
    client = newClient;
    initReplacerClient(newClient);
    initTemplatingClient(newClient);
    initGPTFetchClient(newClient);
}

const defaultPrompt = await getDefaultPrompt();


export class Conversation<M extends AnyModel = any> {
    id: string = randomId("conv");
    messages: AnyGPTMessage[] = [];
    prompt: Prompt<M, boolean, (string | undefined)> = defaultPrompt! as unknown as Prompt<M>;
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
        log.debug(messages);
        messages.forEach(m => {
            this.emitter.emit("message", m);
            if (m.type === GPTMessageType.ToolCall) {
                this.emitter.emit("toolCall", m);
                if (!(m.toolName in tools)) {
                    // is custom tool
                    console.log(`emitting custom tc`);
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
        log.info(`set prompt on conversation ${this.id}`);
        log.debug(`set prompt on conversation ${this.id} to ${prompt.author.id}/${prompt.name}; full data:`)
        log.debug(conv);
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
        const allParameters = { ...this.prompt.modelParameters, ...this.modelParameterOverrides };
        // filter them
        const filteredParameters: Record<string, Partial<InferModelParameters<M['parameters']>>[string]> = {};
        Object.entries(allParameters).forEach(([k, v]) => {
            if (k in this.model.parameters) filteredParameters[k] = v;
        });

        return filteredParameters as Partial<InferModelParameters<M['parameters']>>;
    }

    getUnansweredToolCalls(): GPTToolCall[] {
        return this.messages.filter(m => m.type === GPTMessageType.ToolCall && m.answered == false) as GPTToolCall[];
    }

    async run(): Promise<GPTAssistantMessage | undefined> {
        // acquire running mutex
        const release = await this.isRunningMutex.acquire();
        try {
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

            return response.filter(m => m.type === GPTMessageType.Assistant)[0];
        } catch (err) {
            log.error(`error while running gpt conversation ${this.id}:`);
            log.error(err);
        } finally {
            release();
        }
    }
}