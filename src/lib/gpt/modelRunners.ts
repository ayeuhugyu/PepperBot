import { Conversation } from "./conversation";
import { GPTAssistantMessage, GPTToolCall } from "./messageTypes";
import { ModelName } from "./models";
import { runOpenAI } from "./runners/openaiRunner";

export type ModelRunner = (conversation: Conversation) => Promise<(GPTAssistantMessage | GPTToolCall)[]>

export const modelRunnerIndex: Record<ModelName, ModelRunner> = {
    "gpt-3.5-turbo": runOpenAI,
    "gpt-4.1-nano": runOpenAI,
    "gpt-4o-mini": runOpenAI,
    "gpt-5-mini": runOpenAI,
    "o3-mini": runOpenAI,
    "closex/neuraldaredevil-8b-abliterated": runOpenAI, // temporary
    "deepseek-r1": runOpenAI, // temporary
    "mistral-small-latest": runOpenAI, // temporary
    "grok-3-mini-beta": runOpenAI // temporary
}