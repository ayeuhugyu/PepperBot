import OpenAI from "openai";
import { AnyGPTMessage, GPTAssistantMessage, GPTAttachmentType, GPTMessageType, GPTToolCall } from "../messageTypes";
import { ChatCompletionAssistantMessageParam, ChatCompletionContentPart, ChatCompletionMessageParam, ChatCompletionTool, ChatCompletionToolMessageParam, ChatCompletionUserMessageParam } from "openai/resources/chat";
import { Conversation } from "../conversation";
import * as log from "../../log";
import { AnyTool, CustomTool, CustomToolParameter, Tool, ToolParameter } from "../toolTypes";
import { ModelName } from "../models";
import { replaceContentIn, replaceContentOut } from "../contentReplace";
import { applyPromptTemplating } from "../promptTemplating";

export const openaiDefault = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const supportedImageFileTypes = ["png", "jpg", "jpeg", "webp", "gif"];

async function formatMessage(message: AnyGPTMessage, conversation: Conversation): Promise<ChatCompletionMessageParam[] | null> {
    log.debug(`formatting gpt message: ${message.id}`);

    switch (message.type) {
        case GPTMessageType.System:
            return [{
                role: "system",
                content: message.content
            }]
        case GPTMessageType.User:
            const userdata: ChatCompletionUserMessageParam = {
                role: "user",
                content: [] as ChatCompletionContentPart[],
            };

            if (message.content.length > 0) {
                let content = message.content;

                if (conversation.getPromptParameters().IOReplacements) {
                    content = await replaceContentIn(message.content);
                }

                (userdata.content as ChatCompletionContentPart[]).push({
                    type: "text",
                    text: content,
                });
            }

            if (message.attachments.length > 0) { // TODO: make this less shit because oml this sucks
                message.attachments.map((att) => {
                    switch (att.type) {
                        case GPTAttachmentType.Video:
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
                        case GPTAttachmentType.Image:
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
                        case GPTAttachmentType.Audio:
                            (userdata.content as ChatCompletionContentPart[]).push({
                                type: "text",
                                text: `[SYSTEM]: user attached an audio file (${att.filename}), but audio files are not currently supported.` // openai's audio stuff is for GENERATING them, it does not hear.
                            });
                            break;
                        case GPTAttachmentType.Text:
                        case GPTAttachmentType.Error:
                            (userdata.content as ChatCompletionContentPart[]).push({
                                type: "text",
                                text: att.formatText(),
                            });
                        break;
                    }
                });
            }

            return [userdata];
        case GPTMessageType.Assistant:
            const assistantdata: ChatCompletionAssistantMessageParam = {
                role: "assistant",
                content: message.content,
                tool_calls: undefined,
            };
            let toolResponseData: ChatCompletionToolMessageParam[] | undefined = undefined;
            if (conversation.model.capabilities.includes("functionCalling")) {
                message.fetchToolCalls(conversation).forEach(toolCall => {
                    const response = toolCall.fetchResponse(conversation);
                    if (response) { // if the response doesn't exist yet, we will simply omit it. openai throws errors if the responses don't exist. due to the mutex, this shouldn't ever happen, but just in case.
                        if (!assistantdata.tool_calls) assistantdata.tool_calls = [];
                        assistantdata.tool_calls.push({
                            type: "function",
                            id: toolCall.toolCallId,
                            function: {
                                arguments: JSON.stringify(toolCall.arguments),
                                name: toolCall.toolName,
                            },
                        });

                        if (!toolResponseData) toolResponseData = [];
                        toolResponseData.push({
                            role: "tool",
                            content: JSON.stringify(response.response),
                            tool_call_id: toolCall.toolCallId,
                        });
                    }
                });
            } else {
                delete assistantdata.tool_calls;
            }

            return [assistantdata, ...(toolResponseData ?? [])].filter(i => i !== undefined);
        case GPTMessageType.ToolCall: // for tool calls, do nothing. they are handled in the assistant message formatter.
            return null;
        case GPTMessageType.ToolResponse:
            return null;
        default:
            log.error(`wrongly typed gpt message was attempted to be formatted.`);
            return [{
                role: "system",
                content: "[SYSTEM MESSAGE]: this message was unable to be processed correctly. the error has been logged and it will be dealt with."
            }]
    }
}

function formatToolParameters(parameters: Record<string, ToolParameter | CustomToolParameter>): ChatCompletionTool['function']['parameters'] {
    const formatted: ChatCompletionTool['function']['parameters'] = {};
    for (const paramKey in parameters) {
        const param = parameters[(paramKey as keyof typeof parameters)];
        if ("schema" in param) {
            formatted[param.key] = {
                type: param.schema.type,
                description: param.description,
            }
            if (param.schema.type == "array") {
                (formatted[param.key] as any).items = { type: (param.schema as any).element?.type };
            }
        } else {
            formatted[param.key] = {
                type: param.type,
                description: param.description,
            }
        }
    }
    return formatted;
}

function getRequiredParameters(parameters: Record<string, ToolParameter | CustomToolParameter>): string[] {
    const required: string[] = [];
    for (const paramKey in parameters) {
        const param = parameters[paramKey];
        if ("schema" in param) {
            if (!param.schema.safeParse(undefined).success) required.push(param.key);
        } else {
            if (param.required) required.push(param.key);
        }
    }
    return required;
}

export function formatTool(tool: AnyTool | CustomTool): ChatCompletionTool {
    const formattedParameters = formatToolParameters(tool.parameters);
    const required = getRequiredParameters(tool.parameters);

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
            name: tool.name,
            description: tool.description,
            parameters: parametersObj,
        },
    };
}

async function formatMessages(conversation: Conversation): Promise<ChatCompletionMessageParam[]> {
    let systemPrompt: string = conversation.prompt?.content || '';

    if (conversation.getPromptParameters().enableTemplating) {
        systemPrompt = await applyPromptTemplating(systemPrompt, conversation);
    }

    const openaiMessages: ChatCompletionMessageParam[] = [{
        role: "system",
        content: systemPrompt,
    }];


    for (const msg of conversation.messages) {
        const formatted = await formatMessage(msg, conversation);
        if (formatted) {
            openaiMessages.push(...formatted);
        }
    }
    return openaiMessages;
}

function safeJSONParse(text: string) {
    try {
        return JSON.parse(text);
    } catch (err) {
        return {};
    }
}

export async function runOpenAI(conversation: Conversation, openai: OpenAI = openaiDefault): Promise<(GPTAssistantMessage | GPTToolCall)[]> {
    const model: ModelName = conversation.model.name as ModelName;
    const apiConversation: ChatCompletionMessageParam[] = await formatMessages(conversation);
    const tools: ChatCompletionTool[] = conversation.prompt.getTools().map((tool) => formatTool(tool));


    const params = conversation.getModelParameters();

    const response = await openai.chat.completions.create({
        model: model,
        messages: apiConversation,
        tools: tools,
        tool_choice: "auto",
        ...params,
    });

    let assistantContent = response.choices[0]?.message.content ?? "";
    if (conversation.getPromptParameters().IOReplacements) {
        assistantContent = replaceContentOut(assistantContent);
    }

    return [
        new GPTAssistantMessage({
            content: assistantContent,
            attachments: [],
            beenDeleted: false,
            toolCallIds: response.choices[0]?.message?.tool_calls?.map(tc => tc.id) ?? [],
        }),
        ...response.choices[0]?.message?.tool_calls?.map(tc => {
            return new GPTToolCall({
                toolCallId: tc.id,
                toolName: tc.function.name,
                arguments: safeJSONParse(tc.function.arguments),
            });
        }) ?? []
    ];
}