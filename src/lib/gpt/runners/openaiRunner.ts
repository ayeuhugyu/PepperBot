import OpenAI from "openai";
import { AnyGPTMessage, GPTMessageType } from "../messageTypes";
import { ChatCompletionAssistantMessageParam, ChatCompletionContentPart, ChatCompletionMessageParam, ChatCompletionUserMessageParam } from "openai/resources/chat";
import { Conversation } from "../conversation";
import * as log from "../../log";

export const openaiDefault = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const supportedImageFileTypes = ["png", "jpg", "jpeg", "webp", "gif"];

async function formatMessage(message: AnyGPTMessage, conversation: Conversation): Promise<ChatCompletionMessageParam | null> {
    log.debug(`formatting gpt message:`);
    log.debug(message);

    switch (message.type) {
        case GPTMessageType.System:
            return {
                role: "system",
                content: message.content
            }
        case GPTMessageType.User:
            const userdata: ChatCompletionUserMessageParam = {
                role: "user",
                content: [] as ChatCompletionContentPart[],
            };

            if (message.content.length > 0) {
                (userdata.content as ChatCompletionContentPart[]).push({
                    type: "text",
                    text: message.content,
                });
            }

            if (message.attachments.length > 0) { // TODO: make this less shit because oml this sucks
                await Promise.all(message.attachments.map((att) => {
                    return new Promise<void>(async (resolve, reject) => {
                        log.debug(`GPT processing attachment of type ${att.contentType} (${att.filename})`);
                    const currentDate = new Date();
                    if ((message.createdAt.getTime() + (att.durationSecs ?? (24 * 60 * 60)) * 1000) < currentDate.getTime()) { // if the attachment has expired OR it has been 24 hours since its creation (if an expiry date was not specified),
                        (userdata.content as ChatCompletionContentPart[]).push({
                            type: "text",
                            text: `[SYSTEM]: user attached a file (${att.filename}), but it has now expired and is no longer available. please ignore this image and pretend it does not exist. do not inform the user unless directly inquired.`,
                        });
                    } else {
                        switch (att.contentType?.type) {
                            case "video":
                                if (conversation.model.capabilities.includes("videoVision")) {
                                    // do something...
                                    // dunno what yet because there are no models with this that i have enabled
                                    // will add if i find a model capable of this later
                                } else {
                                    (userdata.content as ChatCompletionContentPart[]).push({
                                        type: "text",
                                        text: `[SYSTEM]: user attached a video (${att.filename}) but this model is not capable of viewing videos.`,
                                    });
                                }
                            break;
                            case "image":
                                if (conversation.model.capabilities.includes("vision")) {
                                    const splitImageFilename = att.filename.split(".");
                                    if (supportedImageFileTypes.includes(splitImageFilename[splitImageFilename.length - 1])) {
                                        (userdata.content as ChatCompletionContentPart[]).push({
                                            type: "image_url",
                                            image_url: {
                                                url: att.url
                                            }
                                        });
                                    }
                                } else {
                                    (userdata.content as ChatCompletionContentPart[]).push({
                                        type: "text",
                                        text: `[SYSTEM]: user attached an image (${att.filename}) but this model is not capable of viewing images.`
                                    });
                                }
                            break;
                            case "audio":
                                (userdata.content as ChatCompletionContentPart[]).push({
                                    type: "text",
                                    text: `[SYSTEM]: user attached an audio file (${att.filename}), but audio files are not currently supported.` // openai's audio stuff is for GENERATING them, it does not hear.
                                });
                            default: // for any other file types:
                            // attempt to download the file, if it is utf-8 encoded put it in there as text.
                            if (att.size > 5 * 1000 * 1000) { // 5MB size limit
                                (userdata.content as ChatCompletionContentPart[]).push({
                                    type: "text",
                                    text: `[SYSTEM]: user attached a file (${att.filename}), but it exceeded the 5 megabyte size limit for further processing.`
                                });
                            } else {
                                try {
                                    const response = await fetch(att.url);
                                    const buffer = await response.arrayBuffer();
                                    const decoder = new TextDecoder('utf-8', { fatal: true });
                                    let text = decoder.decode(buffer);

                                    (userdata.content as ChatCompletionContentPart[]).push({
                                        type: "text",
                                        text: `[SYSTEM]: user attached a text attachment. its decoded contents are below, after the filename and size:\n${att.filename} (${att.size} BYTES)\n\n${text}`
                                    })
                                } catch (err) {
                                    log.error(`failed to decode GPT attachment text content from ${att.url}: ${err}`);
                                    log.debug(`failed to decode GPT attachment text content from ${att.filename} (${att.url}) ${err}`);
                                    (userdata.content as ChatCompletionContentPart[]).push({
                                        type: "text",
                                        text: `[SYSTEM]: an error occurred while decoding this attachment's content: ${err}`,
                                    });
                                }
                            }
                            break;
                        }
                    }

                    resolve();
                    });
                }));
            }

            return userdata;
        case GPTMessageType.Assistant:
            const assistantdata: ChatCompletionAssistantMessageParam = {
                role: "assistant",
                content: message.content,
                tool_calls: [],
            };
            if (conversation.model.capabilities.includes("functionCalling")) {
                message.fetchToolCalls(conversation).forEach(toolCall => {
                    const response = toolCall.fetchResponse(conversation);
                    if (response) { // if the response doesn't exist yet, we will simply omit it. openai throws errors if the responses don't exist. due to the mutex, this shouldn't ever happen, but just in case.
                        assistantdata.tool_calls?.push({
                            type: "function",
                            id: toolCall.toolCallId,
                            function: {
                                arguments: JSON.stringify(toolCall.arguments),
                                name: toolCall.toolName,
                            },
                        });
                    }
                });
            } else {
                delete assistantdata.tool_calls;
            }

            return assistantdata;
        case GPTMessageType.ToolCall: // for tool calls, do nothing. they are handled in the assistant message formatter.
            return null;
        case GPTMessageType.ToolResponse:
            return null;
        default:
            log.error(`wrongly typed gpt message was attempted to be formatted.`);
            return {
                role: "system",
                content: "[SYSTEM MESSAGE]: this message was unable to be processed correctly. the error has been logged and it will be dealt with."
            }
    }
}


// import OpenAI from "openai";
// import { Conversation, GPTAttachment, GPTMessage, ToolCall, ToolCallResponse } from "./main";
// import { JSONSchemaDefinition } from "openai/lib/jsonschema";
// import { RunnableToolFunction } from "openai/lib/RunnableFunction";
// import { JSONSchemaType } from "openai/lib/jsonschema";
// import { FakeTool, Tool } from "./tools";
// import {
//     ChatCompletionMessageParam,
//     ChatCompletionToolMessageParam,
//     ChatCompletionMessageToolCall,
//     ChatCompletionAssistantMessageParam,
//     ChatCompletionUserMessageParam,
//     ChatCompletionTool,
//     ChatCompletionContentPart,
//     ChatCompletionContentPartText,
//     ChatCompletionContentPartImage,
// } from "openai/resources/chat/completions/completions";
// import { Model } from "./models";
// import { inspect } from "node:util";

// export const openai_default = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// });

// type AttachmentType = 'text' | 'image' | 'audio' | 'video' | 'unknown';

// interface Attachment {
//     type: AttachmentType;
//     content?: string;
//     url?: string;
// }

// function formatSystemMessage(prompt: string): ChatCompletionMessageParam {
//     return {
//         role: 'system',
//         content: prompt,
//     };
// }

// let openAIAllowedImageExtensions: string[] = ["jpg", "jpeg", "png", "gif", "webp"];

// function formatUserMessage(msg: GPTMessage): ChatCompletionUserMessageParam {
//     const content: string = msg.content ?? '';
//     const contentParts: ChatCompletionContentPart[] = [];
//     if (content) {
//         contentParts.push({ type: 'text', text: content });
//     }
//     if (msg.attachments && msg.attachments.length > 0) {
//         for (const att of msg.attachments as GPTAttachment<any>[]) {
//             if (att.type === 'text' && att.content) {
//                 contentParts.push({ type: 'text', text: att.content });
//             } else if (att.type === 'image' && att.url) {
//                 const ext = att.filename.split('.').pop()?.toLowerCase();
//                 if (ext && openAIAllowedImageExtensions.includes(ext)) {
//                     contentParts.push({ type: 'image_url', image_url: { url: att.url } });
//                 } else {
//                     contentParts.push({ type: 'text', text: `[User attached an image file with unsupported extension: .${ext || 'unknown'}]` });
//                 }
//             } else if (att.type === 'audio') {
//                 // OpenAI expects base64+format for input_audio, not a URL. If not available, add a text part.
//                 contentParts.push({ type: 'text', text: '[User attached an audio file that cannot be processed by the AI (audio input must be base64)]' });
//             } else if (att.type === 'video' || att.type === 'unknown') {
//                 contentParts.push({ type: 'text', text: '[User attached a file that cannot be processed by the AI (video or unknown type)]' });
//             }
//         }
//     }

//     return {
//         role: 'user',
//         content: contentParts.length > 0 ? contentParts : '',
//         // name: msg.author?.username,
//         // the way openai handles names is really stupid and if your username is just something that is like an actual thing the bot will think you're talking about that thing
//         // for some god forsaken fucking reason they probably just append it to the start of the message or some stupid bullshit
//     };
// }

// function formatAssistantMessage(msg: GPTMessage): ChatCompletionAssistantMessageParam {
//     const content: string = msg.content ?? '';
//     // Only allow text/refusal for assistant content array
//     const contentParts: (ChatCompletionContentPartText | { type: 'refusal'; refusal: string })[] = [];
//     if (content) {
//         contentParts.push({ type: 'text', text: content });
//     }
//     if (msg.attachments && msg.attachments.length > 0) {
//         for (const att of msg.attachments as Attachment[]) {
//             if (att.type === 'text' && att.content) {
//                 contentParts.push({ type: 'text', text: att.content });
//             } else if (att.type === 'image' || att.type === 'audio' || att.type === 'video' || att.type === 'unknown') {
//                 // Assistant cannot send image/audio/video/unknown as content parts, so add a text note
//                 contentParts.push({ type: 'text', text: '[Assistant attached a file that cannot be processed by the AI (non-text attachment)]' });
//             }
//         }
//     }
//     let tool_calls: ChatCompletionMessageToolCall[] | undefined = undefined;
//     if (msg.toolCalls && msg.toolCalls.length > 0) {
//         tool_calls = msg.toolCalls.map(tc => ({
//             id: tc.id,
//             type: 'function',
//             function: {
//                 name: tc.name,
//                 arguments: JSON.stringify(tc.parameters),
//             },
//         }));
//     }
//     return {
//         role: 'assistant',
//         content: contentParts.length > 0 ? contentParts : '',
//         tool_calls,
//     };
// }

// function formatToolMessage(toolResp: ToolCallResponse): ChatCompletionToolMessageParam {
//     return {
//         role: 'tool',
//         tool_call_id: toolResp.call.id,
//         content: typeof toolResp.response.data === 'string' ? toolResp.response.data : JSON.stringify(toolResp.response.data),
//     };
// }

// export function formatConversation(conversation: Conversation): ChatCompletionMessageParam[] {
//     const systemPrompt: string = conversation.prompt?.content || '';
//     const openaiMessages: ChatCompletionMessageParam[] = [formatSystemMessage(systemPrompt)];

//     for (const msg of conversation.messages) {
//         // ToolCallResponse detection: must have 'call' property
//         if (msg.role === 'tool' || (typeof msg === 'object' && msg !== null && 'call' in msg)) {
//             openaiMessages.push(formatToolMessage(msg as ToolCallResponse));
//             continue;
//         }
//         const gptMsg = msg as GPTMessage;
//         if (gptMsg.role === 'bot') {
//             openaiMessages.push(formatAssistantMessage(gptMsg));
//         } else if (gptMsg.role === 'user') {
//             openaiMessages.push(formatUserMessage(gptMsg));
//         }
//     }
//     return openaiMessages;
// }

// type ToolParameter = {
//     key: string;
//     type: string;
//     description: string;
//     arraytype?: string;
//     default?: unknown;
//     required?: boolean;
// };

// function formatTool(tool: Tool | FakeTool): ChatCompletionTool {
//     const formattedParameters = formatToolParameters(tool.data.parameters);
//     const required = getRequiredParameters(tool.data.parameters);

//     const parametersObj: {
//         type: 'object';
//         properties: typeof formattedParameters;
//         required?: string[];
//     } = {
//         type: 'object',
//         properties: formattedParameters,
//     };
//     if (required.length > 0) parametersObj.required = required;

//     return {
//         type: 'function',
//         function: {
//             name: tool.data.name,
//             description: tool.data.description,
//             parameters: parametersObj,
//         },
//     };
// }

// function formatToolParameters(parameters: Record<string, ToolParameter>) {
//     const formatted: Record<string, {
//         type: string;
//         description: string;
//         items?: { type: string };
//         default?: unknown;
//     }> = {};
//     for (const paramKey in parameters) {
//         const param = parameters[paramKey];
//         formatted[param.key] = {
//             type: param.type === 'array' ? 'array' : param.type,
//             description: param.description,
//         };
//         if (param.arraytype) {
//             formatted[param.key].items = { type: param.arraytype };
//         }
//         if (param.default !== undefined) {
//             formatted[param.key].default = param.default;
//         }
//     }
//     return formatted;
// }

// function getRequiredParameters(parameters: Record<string, ToolParameter>): string[] {
//     const required: string[] = [];
//     for (const paramKey in parameters) {
//         const param = parameters[paramKey];
//         if (param.required) required.push(param.key);
//     }
//     return required;
// }

// export async function runOpenAI(conversation: Conversation, openai: OpenAI = openai_default): Promise<GPTMessage> {
//     const model: Model = conversation.model;
//     const apiConversation: ChatCompletionMessageParam[] = formatConversation(conversation);
//     const tools: ChatCompletionTool[] = Object.entries(conversation.getTools()).map(([_, tool]) => formatTool(tool));

//     const params = conversation.filterParameters();

//     const response = await openai.chat.completions.create({
//         model: model.name,
//         messages: apiConversation,
//         tools: tools,
//         tool_choice: 'auto',
//         ...params,
//     });
//     return new GPTMessage({
//         content: response.choices[0]?.message?.content ?? "",
//         role: 'bot',
//         toolCalls: response.choices[0]?.message?.tool_calls?.map(tc => (new ToolCall({
//             id: tc.id,
//             name: tc.function.name,
//             parameters: JSON.parse(tc.function.arguments) as Record<string, any>,
//         }))) || [],
//         attachments: [] // AI cannot currently attach stuff, this could be changed in the future though.
//     });
// }