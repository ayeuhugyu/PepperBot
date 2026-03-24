import { Model } from "./modelTypes"

interface OverrideParameters<M extends Model> {

}

export class Conversation {
    messages: unknown // TODO: make message types
    prompt: unknown // TODO: make prompt type
    overrides: unknown // TODO: make override types
}