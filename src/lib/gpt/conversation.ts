import { Client, Collection, User } from "discord.js";
import { AnyModel, InferModelParameters, Model, ModelParameter } from "./modelTypes"
import { AnyPrompt, Prompt, promptParameterTypings } from "./promptManager"
import { getDefaultPrompt } from "./officialPrompts";
import { ModelName, models } from "./models";
import * as log from "../log";
import { randomId } from "../id";
import { AnyGPTMessage, GPTMessageType, GPTMessageTypeMap, GPTUser, GPTUserMessage } from "./messageTypes";
import { Mutex } from "async-mutex";
import { modelRunnerIndex } from "./modelRunners";

const defaultPrompt = await getDefaultPrompt();

let client: Client | undefined = undefined;
export function initGPTMainClient(newClient: Client) {
    client = newClient;
}

/*
filterParameters() {
        const availableParameters = this.model.parameters.map(p => p.key);
        log.debug(`filtering API parameters for conversation ${this.id}. Available parameters:`, availableParameters);
        const entries = Object.entries(this.api_parameters || {});
        const filteredEntries = entries.filter(([key, _]) => availableParameters.includes(key));
        log.debug(`filtered parameters:`, Object.fromEntries(filteredEntries));
        return Object.fromEntries(filteredEntries);
    }
*/
export class Conversation<M extends AnyModel = any> {
    id: string = randomId("conv");
    messages: AnyGPTMessage[] = [];
    prompt: Prompt<M, boolean, (string | undefined)> = defaultPrompt! as Prompt<M>;
    promptParameterOverrides: Partial<InferModelParameters<typeof promptParameterTypings>> = {};
    modelParameterOverrides: Partial<InferModelParameters<M['parameters']>> = {};
    model: M = models['gpt-4.1-nano'] as unknown as M;
    users: GPTUser[] = [];
    isRunningMutex: Mutex = new Mutex();

    setPrompt(prompt: AnyPrompt) {
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

    async run() {
        // acquire running mutex
        const release = await this.isRunningMutex.acquire();
        try {
            const response = await modelRunnerIndex[this.model.name as ModelName](this);
            this.messages.push(...response);
        } catch (err) {
            log.error(`error while running gpt conversation ${this.id}:`);
            log.error(err);
        } finally {
            release();
        }
    }
}