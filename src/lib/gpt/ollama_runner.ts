import { Conversation, GPTMessage, ToolCall, ToolCallResponse } from "./main";
import { Model } from "./models";
import { tools as allTools, FakeTool, Tool, ToolParameter } from "./tools";
import ollama, { ChatRequest, ChatResponse } from "ollama";
import { Tool as OllamaTool, Message as OllamaMessage, ToolCall as OllamaToolCall } from "ollama";
import path from "path";
import fs from "fs";
import * as log from "../log";
import { fixFileName } from "../attachment_manager";

function getRequiredParameters(parameters: Record<string, ToolParameter>): string[] {
    const required: string[] = [];
    for (const paramKey in parameters) {
        const param = parameters[paramKey];
        if (param.required) required.push(param.key);
    }
    return required;
}

function formatToolParameters(parameters: Record<string, ToolParameter>) {
    const formatted: Record<string, {
        type: string;
        description: string;
        items?: { type: string };
        default?: unknown;
    }> = {};
    for (const paramKey in parameters) {
        const param = parameters[paramKey];
        formatted[param.key] = {
            type: param.type === 'array' ? 'array' : param.type,
            description: param.description,
        };
        if (param.arraytype) {
            formatted[param.key].items = { type: param.arraytype };
        }
        if (param.default !== undefined) {
            formatted[param.key].default = param.default;
        }
    }
    return formatted;
}

function formatTool(tool: Tool | FakeTool): OllamaTool {
    const formattedParameters = formatToolParameters(tool.data.parameters);
    const required = getRequiredParameters(tool.data.parameters);

    const parametersObj: {
        type: 'object';
        properties: typeof formattedParameters;
        required?: string[];
    } = {
        type: 'object',
        properties: formattedParameters,
    };
    if (required.length > 0) parametersObj.required = required;

    return {
        type: 'function',
        function: {
            name: tool.data.name,
            description: tool.data.description,
            parameters: parametersObj,
        },
    };
}

// Helper: convert attachments to ollama format (text, image, video)
async function formatOllamaUserMessage(msg: GPTMessage) {
    const content: string = msg.content ?? '';
    const attachments = msg.attachments || [];
    let ollamaContent: OllamaMessage["content"] = '';
    let images: OllamaMessage["images"] = [];
    if (content) ollamaContent += content;
    for (const att of attachments) {
        if (att.type === 'text' && att.content) {
            ollamaContent += att.content;
        } else if ((att.type === 'image' || att.type === 'video') && att.url) {
            const cacheDir = path.resolve(process.cwd(), 'cache', 'ollama');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            const fileName = path.basename(fixFileName(att.filename));
            const filePath = path.join(cacheDir, fileName);

            // Download if not already cached
            if (!fs.existsSync(filePath)) {
                const response = await fetch(att.url);
                const arrayBuffer = await response.arrayBuffer();
                fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
            }

            // Read file and convert to base64
            const fileBuffer = fs.readFileSync(filePath);
            const attachmentBase64Data = fileBuffer.toString('base64');
            // ollama expects images in base64 format
            images.push(attachmentBase64Data as unknown as (Uint8Array & string)); // this is literally the example used in the ollamajs docs so i can't imagine this is wrong, idfk why theres a type error from it
        }
    }
    return { content: ollamaContent, images };
}

async function formatOllamaConversation(conversation: Conversation) {
    // System prompt
    const systemPrompt = conversation.prompt?.content || '';
    const ollamaMessages: OllamaMessage[] = [{ role: 'system', content: systemPrompt }];
    for (const msg of conversation.messages) {
        if (msg.role === 'tool' || (typeof msg === 'object' && msg !== null && 'call' in msg)) {
            // Tool response
            ollamaMessages.push({
                role: 'tool',
                content: typeof (msg as ToolCallResponse).response.data === 'string' ? (msg as ToolCallResponse).response.data : JSON.stringify((msg as ToolCallResponse).response.data),
            });
            continue;
        }
        const gptMsg = msg as GPTMessage;
        if (gptMsg.role === 'bot') {
            ollamaMessages.push({ role: 'assistant', content: gptMsg.content ?? '' });
        } else if (gptMsg.role === 'user') {
            ollamaMessages.push({ role: 'user', ...await formatOllamaUserMessage(gptMsg) });
        }
    }
    return ollamaMessages;
}

export async function runOllama(conversation: Conversation): Promise<GPTMessage> {
    const model: Model = conversation.model;
    const messages = await formatOllamaConversation(conversation);
    const params = conversation.filterParameters();
    const tools: OllamaTool[] = Object.entries(conversation.getTools()).map(([_, tool]) => formatTool(tool));

    // create a temporary model name using the conversation's id
    const tempModelName = `conv-temp-${conversation.id}-${model.name}`.replace(/[^a-zA-Z0-9_\-]/g, "_");

    try {
        // check if the model already exists
        const existingModels = await ollama.list();
        const modelExists = existingModels.models.some((m: { name: string }) => m.name === tempModelName);

        // copy the base model to a temporary model for this conversation if it doesn't exist
        if (!modelExists) {
            log.info(`creating ollama temporary model ${tempModelName} from ${model.name}`);
            await ollama.create({
                model: tempModelName,
                from: model.name,
                system: conversation.prompt?.content || "",
            });
        }

        let response: ChatResponse | undefined;
        if (model.capabilities.includes('functionCalling')) {
            response = await ollama.chat({
                model: tempModelName,
                messages,
                tools,
                keep_alive: "10m",
                ...params,
            });
        } else {
            response = await ollama.chat({
                model: tempModelName,
                messages,
                keep_alive: "10m",
                ...params,
            });
        }

        // Parse tool calls if present
        const toolCalls = response.message?.tool_calls?.map((tc: OllamaToolCall) => new ToolCall({
            id: "llama_tool_call_id", // ollama does not provide a unique ID for tool calls
            name: tc.function.name,
            parameters: tc.function.arguments,
        })) || [];
        return new GPTMessage({
            content: response.message?.content ?? '',
            role: 'bot',
            toolCalls,
            attachments: [],
        });
    } catch (err: any) {
        if (err?.message?.includes('ECONNREFUSED') || err?.message?.includes('Failed to fetch') || err?.code === 'ECONNREFUSED') {
            return new GPTMessage({
                content: 'ollama server is not running',
                role: 'bot',
                toolCalls: [],
                attachments: [],
            });
        }
        throw err;
    }
}

const existingModels = await ollama.list();
const tempModels = existingModels.models.filter((m: { name: string }) => m.name.startsWith(`conv-temp-`));
// Clean up temporary models
for (const model of tempModels) {
    try {
        await ollama.delete({ model: model.name });
        log.info(`deleted ollama temporary model ${model.name}`);
    } catch (err) {
        console.error(`Failed to delete temporary model ${model.name}:`, err);
    }
}