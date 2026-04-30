import { Client, Collection, User } from "discord.js";
import { AnyModel, InferModelParameters, Model, ModelParameter } from "./modelTypes"
import { AnyPrompt, Prompt, promptParameterTypings } from "./promptManager"
import { getDefaultPrompt } from "./officialPrompts";
import { ModelName, models } from "./models";
import * as log from "../log";
import { randomId } from "../id";
import { AnyGPTMessage, GPTMessageType, GPTMessageTypeMap, GPTToolCall, GPTToolResponse, GPTUser, GPTUserMessage } from "./messageTypes";
import { Mutex } from "async-mutex";
import { modelRunnerIndex } from "./modelRunners";
import { ToolName, tools } from "./tools";
import { InferParameters } from "./toolTypes";

let client: Client | undefined = undefined;
export function initGPTMainClient(newClient: Client) {
    client = newClient;
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

    addMessage(...messages: AnyGPTMessage[]) {
        log.debug(`adding gpt messages to conversation ${this.id}`);
        log.debug(messages);
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

    async run() {
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
                    } else {
                        // is custom tool
                        // do nothing because i do not want to deal with this right now
                    }
                }));
                response = await modelRunnerIndex[this.model.name as ModelName](this);
                this.addMessage(...response);
                unansweredToolCalls = this.getUnansweredToolCalls();
            }
        } catch (err) {
            log.error(`error while running gpt conversation ${this.id}:`);
            log.error(err);
        } finally {
            release();
        }
    }
}