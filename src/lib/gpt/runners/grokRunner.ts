import OpenAI from "openai";
import { runOpenAI } from "./openaiRunner";
import { Conversation } from "../conversation";
import { GPTAssistantMessage, GPTToolCall } from "../messageTypes";

const Grok = new OpenAI({
    apiKey: process.env.GROK_API_KEY,
    baseURL: "https://api.x.ai/v1"
});

export function runGrok(conversation: Conversation): Promise<(GPTAssistantMessage | GPTToolCall)[]> {
    return runOpenAI(conversation, Grok)
}