import { Conversation, GPTMessage, ToolCall, ToolCallResponse } from "./main";
import { Model } from "./models";
import { tools as allTools, Tool, ToolParameter } from "./tools";
import ollama, { ChatRequest, ChatResponse } from "ollama";
import { Tool as OllamaTool, Message as OllamaMessage, ToolCall as OllamaToolCall } from "ollama";
import path from "path";
import fs from "fs";
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

function formatTool(tool: Tool): OllamaTool {
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

    try {
        let response: ChatResponse | undefined
        if (model.capabilities.includes('functionCalling')) {
            response = await ollama.chat({
                model: model.name,
                messages,
                tools,
                ...params,
            });
        } else {
            response = await ollama.chat({
                model: model.name,
                messages,
                ...params,
            });
        }
        // Parse tool calls if present
        const toolCalls = response.message?.tool_calls?.map((tc: OllamaToolCall) => new ToolCall({
            id: "llama_tool_call_id",
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
        // If the Ollama server is not running, return a fake GPTMessage
        if (err?.message?.includes('ECONNREFUSED') || err?.message?.includes('Failed to fetch') || err?.code === 'ECONNREFUSED') {
            return new GPTMessage({
                content: 'ollama server is not running',
                role: 'bot',
                toolCalls: [],
                attachments: [],
            });
        }
        // Otherwise, rethrow
        throw err;
    }
}
