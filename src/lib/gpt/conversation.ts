import { Client, Collection, User } from "discord.js";
import { AnyModel, InferModelParameters, Model, ModelParameter } from "./modelTypes"
import { AnyPrompt, Prompt, promptParameterTypings } from "./promptManager"
import { getDefaultPrompt } from "./officialPrompts";
import { models } from "./models";
import * as log from "../log";
import { randomId } from "../id";
import { AnyGPTMessage, GPTMessageType, GPTMessageTypeMap, GPTUser, GPTUserMessage } from "./messageTypes";
import { Mutex } from "async-mutex";

const defaultPrompt = await getDefaultPrompt();

let client: Client | undefined = undefined;
export function initGPTMainClient(newClient: Client) {
    client = newClient;
}
export class Conversation<M extends AnyModel = typeof models['gpt-4.1-nano']> {
    id: string = randomId("conv");
    messages: Collection<number, AnyGPTMessage> = new Collection();
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
        for (let i = this.messages.size - 1; i >= 0; i--) {
            const msg = this.messages.get(i);
            if (!type || (msg && msg.type === type)) {
                return msg as GPTMessageTypeMap[T];
            }
        }
        return undefined;
    }

    generateResponse(message: GPTUserMessage) {
        // run the model

    }
}