import OpenAI from "openai";
import { runOpenAI } from "./openai_runner";
import { Conversation, GPTMessage } from "./main";

const Mistral = new OpenAI({
    apiKey: process.env.MISTRAL_API_KEY,
    baseURL: "https://api.mistral.ai/v1"
})

// Rate limiting: 1 request per 1.25 seconds
const RATE_LIMIT_MS = 1250;
let lastRequestTime = 0;
const requestQueue: Array<() => Promise<any>> = [];
let isProcessing = false;

async function processQueue() {
    if (isProcessing || requestQueue.length === 0) {
        return;
    }

    isProcessing = true;

    while (requestQueue.length > 0) {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        if (timeSinceLastRequest < RATE_LIMIT_MS) {
            const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        const request = requestQueue.shift();
        if (request) {
            lastRequestTime = Date.now();
            await request();
        }
    }

    isProcessing = false;
}

function queueRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        requestQueue.push(async () => {
            try {
                const result = await fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
        processQueue();
    });
}

export function runMistral(conversation: Conversation): Promise<GPTMessage> {
    return queueRequest(() => runOpenAI(conversation, Mistral))
}