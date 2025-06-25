import OpenAI from "openai";
import { runOpenAI } from "./openai_runner";
import { Conversation, GPTMessage } from "./main";

const Grok = new OpenAI({
    apiKey: process.env.GROK_API_KEY,
    baseURL: "https://api.x.ai/v1"
})

export function runGrok(conversation: Conversation): Promise<GPTMessage> {
    return runOpenAI(conversation, Grok)
}