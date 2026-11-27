import OpenAI from "openai";
import {
    AnyGPTMessage,
    GPTAssistantMessage,
    GPTAttachmentType,
    GPTMessageType,
    GPTToolCall,
} from "../messageTypes";
import {
    ChatCompletionAssistantMessageParam,
    ChatCompletionContentPart,
    ChatCompletionCreateParamsNonStreaming,
    ChatCompletionMessageParam,
    ChatCompletionTool,
    ChatCompletionToolMessageParam,
    ChatCompletionUserMessageParam,
} from "openai/resources/chat";
import { Conversation } from "../conversation";
import * as log from "../../log";
import {
    AnyTool,
    CustomTool,
    CustomToolParameter,
    ToolParameter,
} from "../toolTypes";
import { ModelName } from "../models";
import {
    omitSelfMentions,
    replaceContentIn,
    replaceContentOut,
} from "../contentReplace";
import { applyPromptTemplating } from "../promptTemplating";

export const openaiDefault = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const supportedImageFileTypes = ["png", "jpg", "jpeg", "webp", "gif"];

type FunctionTool = Extract<ChatCompletionTool, { type: "function" }>;
type ParameterProperties = Record<string, Record<string, unknown>>;

async function formatMessage(
    message: AnyGPTMessage,
    conversation: Conversation,
): Promise<ChatCompletionMessageParam[] | null> {
    switch (message.type) {
        case GPTMessageType.System:
            return [{
                role: "system",
                content: message.content,
            }];

        case GPTMessageType.User: {
            const parts: ChatCompletionContentPart[] = [];
            const userdata: ChatCompletionUserMessageParam = {
                role: "user",
                content: parts,
            };

            if (message.content.length > 0) {
                let content = message.content;

                if (conversation.getPromptParameters().omitSelfMentions) {
                    content = await omitSelfMentions(content);
                }

                if (conversation.getPromptParameters().IOReplacements) {
                    content = await replaceContentIn(content);
                }

                parts.push({
                    type: "text",
                    text: content,
                });
            }

            for (const att of message.attachments) {
                switch (att.type) {
                    case GPTAttachmentType.Video:
                        parts.push({
                            type: "text",
                            text: `[SYSTEM]: user attached a video (${att.filename}), but video attachments are not currently supported by this runner.`,
                        });
                        break;

                    case GPTAttachmentType.Image: {
                        if (conversation.model.capabilities.includes("vision")) {
                            const extension = att.filename
                                .split(".")
                                .pop()
                                ?.toLowerCase();

                            if (
                                extension &&
                                supportedImageFileTypes.includes(extension)
                            ) {
                                parts.push({
                                    type: "image_url",
                                    image_url: {
                                        url: att.url,
                                    },
                                });
                            } else {
                                parts.push({
                                    type: "text",
                                    text: `[SYSTEM]: user attached an image (${att.filename}), but its file type is not supported.`,
                                });
                            }
                        } else {
                            parts.push({
                                type: "text",
                                text: `[SYSTEM]: user attached an image (${att.filename}) but this model is not capable of viewing images.`,
                            });
                        }
                        break;
                    }

                    case GPTAttachmentType.Audio:
                        parts.push({
                            type: "text",
                            text: `[SYSTEM]: user attached an audio file (${att.filename}), but audio attachments are not currently supported by this runner.`,
                        });
                        break;

                    case GPTAttachmentType.Text:
                    case GPTAttachmentType.Error:
                        parts.push({
                            type: "text",
                            text: att.formatText(),
                        });
                        break;
                }
            }

            if (parts.length === 0) {
                userdata.content = "";
            }

            return [userdata];
        }

        case GPTMessageType.Assistant: {
            let content = message.content;

            if (conversation.getPromptParameters().IOReplacements) {
                content = await replaceContentIn(content);
            }

            const assistantdata: ChatCompletionAssistantMessageParam = {
                role: "assistant",
                content,
            };

            const toolResponseData: ChatCompletionToolMessageParam[] = [];

            if (conversation.model.capabilities.includes("functionCalling")) {
                for (const toolCall of message.fetchToolCalls(conversation)) {
                    const response = toolCall.fetchResponse(conversation);

                    // Only include calls with matching responses. Chat
                    // Completions rejects unresolved calls in message history.
                    if (!response) continue;

                    if (!assistantdata.tool_calls) {
                        assistantdata.tool_calls = [];
                    }

                    assistantdata.tool_calls.push({
                        type: "function",
                        id: toolCall.toolCallId,
                        function: {
                            arguments: JSON.stringify(toolCall.arguments),
                            name: toolCall.toolName,
                        },
                    });

                    toolResponseData.push({
                        role: "tool",
                        content: JSON.stringify(response.response) ?? "null",
                        tool_call_id: toolCall.toolCallId,
                    });
                }
            }

            return [assistantdata, ...toolResponseData];
        }

        case GPTMessageType.ToolCall:
        case GPTMessageType.ToolResponse:
            // Included alongside their originating assistant message.
            return null;

        default:
            log.error("wrongly typed gpt message was attempted to be formatted.");

            return [{
                role: "system",
                content: "[SYSTEM MESSAGE]: this message was unable to be processed correctly. the error has been logged and it will be dealt with.",
            }];
    }
}

function formatToolParameters(
    parameters: Record<string, ToolParameter | CustomToolParameter>,
): ParameterProperties {
    const formatted: ParameterProperties = {};

    for (const paramKey in parameters) {
        const param = parameters[paramKey];

        if ("schema" in param) {
            formatted[param.key] = {
                type: param.schema.type,
                description: param.description,
            };

            if (param.schema.type === "array") {
                formatted[param.key].items = {
                    type: (param.schema as any).element?.type,
                };
            } else if (param.schema.type === "default") {
                const inner = (param.schema as any).innerType;
                formatted[param.key] = {
                    type: inner.type === "record" ? "object" : inner.type,
                    ...(inner.type === "record"
                        ? { additionalProperties: { type: inner.valueType?.type ?? inner.value?.type ?? "string" } }
                        : {}),
                    description: param.description,
                };
            }
        } else if (param.type === "string[]") {
            formatted[param.key] = {
                type: "array",
                items: {
                    type: "string",
                },
                description: param.description,
            };
        } else {
            formatted[param.key] = {
                type: param.type,
                description: param.description,
            };
        }
    }

    return formatted;
}

function getRequiredParameters(
    parameters: Record<string, ToolParameter | CustomToolParameter>,
): string[] {
    const required: string[] = [];

    for (const paramKey in parameters) {
        const param = parameters[paramKey];

        if ("schema" in param) {
            if (!param.schema.safeParse(undefined).success) {
                required.push(param.key);
            }
        } else if (param.required) {
            required.push(param.key);
        }
    }

    return required;
}

export function formatTool(tool: AnyTool | CustomTool): FunctionTool {
    const formattedParameters = formatToolParameters(tool.parameters);
    const required = getRequiredParameters(tool.parameters);

    const parametersObj: {
        type: "object";
        properties: ParameterProperties;
        required?: string[];
    } = {
        type: "object",
        properties: formattedParameters,
    };

    if (required.length > 0) {
        parametersObj.required = required;
    }

    return {
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: parametersObj,
        },
    };
}

async function formatMessages(
    conversation: Conversation,
): Promise<ChatCompletionMessageParam[]> {
    let systemPrompt = conversation.prompt?.content || "";

    if (conversation.getPromptParameters().enableTemplating) {
        systemPrompt = await applyPromptTemplating(systemPrompt, conversation);
    }

    const openaiMessages: ChatCompletionMessageParam[] = [{
        role: "system",
        content: systemPrompt,
    }];

    log.debug(`formatting messages for ${conversation.id}`);

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
    } catch {
        return {};
    }
}

export async function runOpenAI(
    conversation: Conversation,
    openai: OpenAI = openaiDefault,
): Promise<(GPTAssistantMessage | GPTToolCall)[]> {
    const model = conversation.model.name as ModelName;
    const apiConversation = await formatMessages(conversation);

    const supportsTools =
        conversation.model.capabilities.includes("functionCalling");

    const tools: FunctionTool[] = supportsTools
        ? conversation.prompt.getTools().map(formatTool)
        : [];

    const params = conversation.getModelParameters();

    const request: ChatCompletionCreateParamsNonStreaming = {
        ...params,
        model,
        messages: apiConversation,
        stream: false,
    };

    if (tools.length > 0) {
        request.tools = tools;
        request.tool_choice = "auto";
    } else {
        // Do not send tool-specific options without any tools.
        delete request.tools;
        delete request.tool_choice;
        delete request.parallel_tool_calls;
    }

    if (String(model) === "gpt-6-luna" && tools.length > 0) {
        // This model requires reasoning_effort: "none" when using function
        // tools through Chat Completions. Apply AFTER model parameters so
        // a configured reasoning effort cannot override the fix.
        //
        // The assertion also accommodates SDK versions whose type
        // definitions do not yet include "none".
        request.reasoning_effort =
            "none" as ChatCompletionCreateParamsNonStreaming["reasoning_effort"];
    }

    const response = await openai.chat.completions.create(request);
    const message = response.choices[0]?.message;

    if (!message) {
        throw new Error("OpenAI returned no assistant message.");
    }

    let assistantContent = message.content ?? "";

    if (conversation.getPromptParameters().IOReplacements) {
        assistantContent = await replaceContentOut(
            assistantContent,
            conversation,
        );
    }

    const toolCalls = (message.tool_calls ?? []).filter(
        (tc): tc is Extract<typeof tc, { type: "function" }> =>
            tc.type === "function",
    );

    return [
        new GPTAssistantMessage({
            content: assistantContent,
            attachments: [],
            beenDeleted: false,
            toolCallIds: toolCalls.map(tc => tc.id),
        }),
        ...toolCalls.map(tc => new GPTToolCall({
            toolCallId: tc.id,
            toolName: tc.function.name,
            arguments: safeJSONParse(tc.function.arguments),
        })),
    ];
}