import { InferModelParameters, Model, ModelParameter } from "./modelTypes"

interface OverrideParameters<P extends Record<string, ModelParameter>> {
    modelParameters: InferModelParameters<P>
}

export class Conversation<M extends Model<Record<string, ModelParameter>>> {
    messages: unknown // TODO: make message types
    prompt: unknown // TODO: make prompt type
    overrides: OverrideParameters<M['parameters']>
    model: M;
}