import { Message } from "discord.js";
import { Conversation, getConversationFromMessageId } from "./conversation";
import { GPTAssistantMessage, GPTAttachment, GPTAttachmentType, GPTMessageType, GPTToolCall, GPTToolResponse, GPTUserMessage } from "./messageTypes";
import * as action from "../discord_action";
import { CustomTool, ToolErrorResponse } from "./toolTypes";
import { OmitMethods } from "../omitMethods";
import { getDefaultPrompt } from "./officialPrompts";

let activeCustomToolPrompts: string[] = [];

export async function respond(message: Message<true>) {
    // if this is a reply to a active custom tool prompt, skip it.
    if (activeCustomToolPrompts.includes(message.reference?.messageId ?? "")) return;

    // first, if it includes a direct mention we start a new conversation.
    let conversation = new Conversation();
    await conversation.useOverrideData(message.author.id);
    const directMention = message.content.replaceAll("@!", "@").includes(`<@${message.client.user?.id}>`)

    // before we push this message, check for referenced messages.
    if (message.reference) {
        const referencedMessage = await message.channel.messages.fetch(message.reference.messageId!);
        if (directMention) {
            // if it was a direct mention, add the reference as context
            const formattedReference = await GPTUserMessage.fromMessage(referencedMessage);
            conversation.addMessage(formattedReference);
        } else {
            // if it wasn't, see if we can use it to find the correct conversation
            const resultingConversation = await getConversationFromMessageId(message.reference.messageId!)
            if (resultingConversation) conversation = resultingConversation;
        }
    }

    // add our message
    conversation.addMessage(await GPTUserMessage.fromMessage(message));
    await conversation.write();

    // if there is a processing message, send it now
    const params = conversation.getPromptParameters();
    let processingMessage: Message | undefined
    if (params.processingType == "default") {
        processingMessage = await action.reply(message, "processing...") ?? undefined;
        if (processingMessage) {
            let content = "processing...";
            const tcListener = async (message: GPTToolCall) => {
                content += `\n-# processing [${message.toolName}] with args ${JSON.stringify(message.arguments, null, 2).replaceAll(/\s+/g, " ").replaceAll("\n", "")}`
                action.edit(processingMessage!, content);
            };

            const responseListener = async (message: GPTToolResponse) => {
                content += `\n-# finished [${message.toolName}]`;
                action.edit(processingMessage!, content);
            }

            conversation.emitter.on("toolCall", tcListener);
            conversation.emitter.on("toolCallResponse", responseListener);
        }
    } else if (params.processingType === "typing") {
        message.channel.sendTyping();
    }

    // handle custom tools
    const customTCListener = async (tc: GPTToolCall) => {
        const duration = 5 * 60 // 5 minutes
        const toolResponseQuestion = await action.reply(message, `the bot is attempting to use a custom tool, please reply with that tool's output:\n-# your message's raw content will be used 1 to 1, do not place your output inside of a codeblock unless you want the ai to see that codeblock too.\n-# this will expire <t:${Math.floor(Date.now() / 1000) + duration}:R>`);
        if (toolResponseQuestion) {
            activeCustomToolPrompts.push(toolResponseQuestion.id);
            const messages = await message.channel.awaitMessages({
                filter: (m) => (m.author.id === message.author.id) && (m.reference?.messageId === toolResponseQuestion.id),
                time: duration * 1000,
                errors: ["time"],
                max: 1,
            }).catch(async () => {
                await action.edit(toolResponseQuestion, "custom tool response expired.")
            });

            if (!messages) {
                activeCustomToolPrompts = activeCustomToolPrompts.filter((p) => p !== toolResponseQuestion.id);
                return;
            };

            const responseMessage = messages.first();
            let content = responseMessage?.content ?? "";

            if ((responseMessage?.attachments.size ?? 0) > 0) {
                const attachments = await Promise.all(message.attachments.map(async (att) => {
                    const data: Omit<OmitMethods<GPTAttachment>, "id" | "type"> = {
                        filename: att.name,
                        size: att.size,
                        url: att.url,
                        expiresAt: new Date(Date.now() + (att.duration ?? (12 * 60 * 60) * 1000)) // 12 hours default
                    }

                    return await GPTAttachment.new(data);
                }));

                const textAttachment = attachments.find((a) => a.type == GPTAttachmentType.Text);
                if (textAttachment) {
                    content += textAttachment.content;
                }
            }

            if (content.length === 0) {
                await action.reply(responseMessage as Message<true>, "no content could be detected")
                conversation.addMessage(GPTToolResponse.newCustom(tc, content, true));
                activeCustomToolPrompts = activeCustomToolPrompts.filter((p) => p !== toolResponseQuestion.id)
            } else {
                await action.edit(toolResponseQuestion, "custom tool successfully responded to, execution will now continue.\nthis message and your response will be deleted in 3 seconds to clear up clutter.");
                conversation.addMessage(GPTToolResponse.newCustom(tc, content, false));
                await new Promise((r) => setTimeout(r, 3000));
                await action.deleteMessage(toolResponseQuestion);
                activeCustomToolPrompts = activeCustomToolPrompts.filter((p) => p !== toolResponseQuestion.id)
                if (responseMessage) await action.deleteMessage(responseMessage);
            }
        }
    }

    conversation.emitter.on("customToolCall", customTCListener);

    // and now finally, we can run the conversation
    const response = await conversation.run();
    // clean up first
    conversation.emitter.removeAllListeners();

    // and then send the response
    let usedFunction: typeof action.reply | typeof action.edit = action.reply;
    let firstArgument = message;
    if (processingMessage) {
        usedFunction = action.edit;
        firstArgument = processingMessage as Message<true>;
    }

    const sent = await usedFunction(firstArgument, {
        content: response?.content,
        // attachments: // eventually....
    });

    if (sent) {
        const latestAssistantMessage = conversation.getLatestMessage(GPTMessageType.Assistant);
        (conversation.messages.find(m => m.id === latestAssistantMessage?.id) as GPTAssistantMessage).discordData = {
            messageId: sent.id,
            channelId: sent.channelId,
            referenceMessageId: sent.reference?.messageId,
            guildId: sent.guildId ?? undefined,
        };
    }

    await conversation.write();

    return sent;
}