import { User } from "discord.js";
import { AnyModel, InferModelParameters, Model, ModelParameter } from "./modelTypes"
import { Prompt, promptParameterTypings } from "./promptManager"

export class Conversation<M extends AnyModel> {
    messages: unknown; // TODO: make message types
    prompt: Prompt<M, boolean, (string | undefined)>;
    promptParameterOverrides: Partial<InferModelParameters<typeof promptParameterTypings>> = {};
    modelParameterOverrides: Partial<InferModelParameters<M['parameters']>> = {};
    model: M;
    users: User[];
}