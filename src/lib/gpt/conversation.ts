import { User } from "discord.js";
import { AnyModel, InferModelParameters, Model, ModelParameter } from "./modelTypes"
import { AnyPrompt, Prompt, promptParameterTypings } from "./promptManager"
import { getDefaultPrompt } from "./officialPrompts";
import { models } from "./models";
import * as log from "../log";
import { randomId } from "../id";

const defaultPrompt = await getDefaultPrompt();

export class Conversation<M extends AnyModel = typeof models['gpt-4.1-nano']> {
    id: string = randomId("conv");
    messages: unknown; // TODO: make message types
    prompt: Prompt<M, boolean, (string | undefined)> = defaultPrompt! as Prompt<M>;
    promptParameterOverrides: Partial<InferModelParameters<typeof promptParameterTypings>> = {};
    modelParameterOverrides: Partial<InferModelParameters<M['parameters']>> = {};
    model: M = models['gpt-4.1-nano'] as unknown as M;
    users: User[] = [];

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
}