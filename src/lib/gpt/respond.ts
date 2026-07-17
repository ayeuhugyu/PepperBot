import { Message } from "discord.js";
import { Conversation, getConversationFromMessageId, getUsersLatestConversation, shouldForceNextNew } from "./conversation";
import { GPTAssistantMessage, GPTAttachment, GPTAttachmentType, GPTMessageType, GPTToolCall, GPTToolResponse, GPTUserMessage } from "./messageTypes";
import * as action from "../discord_action";
import { CustomTool, ToolErrorResponse } from "./toolTypes";
import { OmitMethods } from "../omitMethods";
import * as log from "../log";
import { Mutex } from "async-mutex";

let activeCustomToolPrompts: string[] = [];

class BatchUpdater {
    private pendingUpdates: { sent: Message; content: string }[] = [];
    private isProcessing = false;

    constructor(private maxBatchSize: number = 5, private delayMs: number = 1000) {}

    public enqueue(sent: Message, content: string) {
        this.pendingUpdates.push({ sent, content });
        if (!this.isProcessing) {
            this.processBatch();
        }
    }
    private async processBatch() {
        this.isProcessing = true;
        while (this.pendingUpdates.length) {
            const batch = this.pendingUpdates;
            await Promise.all(
                batch.map(update => {
                    return action.edit(update.sent, update.content);
                })
            );

            await new Promise((resolve) => setTimeout(resolve, this.delayMs));
        }
        this.isProcessing = false;
    }
}

export async function respond(message: Message<true>, forceTypingType?: "default" | "typing" | "none", useLatestConversation?: boolean) {
    // if this is a reply to a active custom tool prompt, skip it.
    if (activeCustomToolPrompts.includes(message.reference?.messageId ?? "")) return;

    log.debug(`gpt handler invoked for ${message.author.username} in ${message.channel?.name} (${message.channel?.id}) with content "${message.content}"`);

    // first, if it includes a direct mention we start a new conversation.
    let isNewConversation = true;
    let conversation = new Conversation();
    const directMention = message.content.replaceAll("@!", "@").includes(`<@${message.client.user?.id}>`)

    // before we push this message, check for referenced messages.
    if (message.reference) {
        const referencedMessage = await message.channel.messages.fetch(message.reference.messageId!);
        const referencedConversation = await getConversationFromMessageId(message.reference.messageId!);
        if (!directMention) {
            // if it wasn't a direct mention, use the referenced conversation
            log.debug(`found conversation ${referencedConversation?.id} based on reference id ${message.reference.messageId}`);
            if (referencedConversation) {
                conversation = referencedConversation;
                isNewConversation = false;
            }
        }

        // if there was no referenced conversation OR it WAS a direct mention, add the referenced message to the conversation
        if (!referencedConversation || directMention) {
            log.debug(`adding referenced message to conversation`);
            const formattedReference = await GPTUserMessage.fromMessage(referencedMessage);
            conversation.addMessage(formattedReference);
            conversation.sortMessages();
        }
    }

    if (useLatestConversation) {
        conversation = await getUsersLatestConversation(message.author.id);
        isNewConversation = false;
    }

    if (await shouldForceNextNew(message.author.id)) {
        log.debug(`forcing new conversation for ${message.author.id}`);
        conversation = new Conversation();
        isNewConversation = true;
    }

    // now that we're done making sure our conversation is right, use the overides
    await conversation.useOverrideData(message.author.id, isNewConversation);

    // add our message
    conversation.addMessage(await GPTUserMessage.fromMessage(message));
    await conversation.write();

    // if there is a processing message, send it now
    const params = conversation.getPromptParameters();
    let processingMessage: Message | undefined
    const processingType = forceTypingType ?? params.processingType;
    if (processingType == "default") {
        processingMessage = await action.reply(message, "processing...") ?? undefined;
        if (processingMessage) {
            let content = "processing...";
            let updateScheduled = false;
            const scheduleUpdate = () => {
                if (!updateScheduled) {
                    updateScheduled = true;
                    setTimeout(async () => {
                        await action.edit(processingMessage!, content);
                        updateScheduled = false;
                    }, 50);
                }
            };

            let indexTable: Record<string, number> = {};
            let index = 0;

            const tcListener = async (message: GPTToolCall) => {
                indexTable[message.toolCallId] = index;
                index++;
                const argumentsCopy = JSON.parse(JSON.stringify(message.arguments));
                if (argumentsCopy.url) {
                    argumentsCopy.url = `<${message.arguments.url}>`;
                }
                content += `\n-# processing [${message.toolName}${indexTable[message.toolCallId]}] with args ${JSON.stringify(argumentsCopy, null, 2).replaceAll(/\s+/g, " ").replaceAll("\n", "")}`
                scheduleUpdate();
            };

            const responseListener = async (message: GPTToolResponse) => {
                content += `\n-# finished [${message.toolName}${indexTable[message.toolCallId]}]`;
                scheduleUpdate();
            }

            conversation.emitter.on("toolCall", tcListener);
            conversation.emitter.on("toolCallResponse", responseListener);
        }
    } else if (processingType === "typing") {
        message.channel.sendTyping();
    }

    // handle custom tools
    const isHandlingCustomTool = new Mutex();

    const customTCListener = async (tc: GPTToolCall) => {
        const release = await isHandlingCustomTool.acquire();
        try {
            const duration = 5 * 60 // 5 minutes
            const toolResponseQuestion = await action.reply(message, `> the bot is attempting to use a custom tool, please reply with that tool's output:\n> -# your message's raw content will be used 1 to 1, do not place your output inside of a codeblock unless you want the ai to see that codeblock too.\n> -# if you attach a text file, its content will be appeneded.\n> -# this will expire <t:${Math.floor(Date.now() / 1000) + duration}:R>\n\n**tool:** \`${tc.toolName}\`\n**parameters:**\n\`\`\`json\n${JSON.stringify(tc.arguments, null, 4)}\n\`\`\``);
            if (toolResponseQuestion) {
                activeCustomToolPrompts.push(toolResponseQuestion.id);
                const messages = await message.channel.awaitMessages({
                    filter: (m) => (m.author.id === message.author.id) && (m.reference?.messageId === toolResponseQuestion.id),
                    time: duration * 1000,
                    errors: ["time"],
                    max: 1,
                }).catch(async () => {
                    await action.edit(toolResponseQuestion, "custom tool response expired.");
                    setTimeout(async () => {
                        await action.deleteMessage(toolResponseQuestion).catch(log.debug);
                    }, 10000);
                    conversation.addMessage(GPTToolResponse.newCustom(tc, "[SYSTEM]: user failed to provide a response before collector timeout", true));
                    release();
                });

                if (!messages) {
                    activeCustomToolPrompts = activeCustomToolPrompts.filter((p) => p !== toolResponseQuestion.id);
                    return;
                };

                const responseMessage = messages.first();
                let content = responseMessage?.content ?? "";

                if ((responseMessage?.attachments.size ?? 0) > 0) {
                    const attachment = responseMessage?.attachments.first();
                    if (attachment) {
                        const attachmentContent = await fetch(attachment.url).then(res => res.text());
                        if (attachmentContent) {
                            content += attachmentContent;
                        }
                    }
                }

                if (content.length === 0) {
                    const noContentResponse = await action.reply(responseMessage as Message<true>, "no content could be detected.")
                    conversation.addMessage(GPTToolResponse.newCustom(tc, "[SYSTEM]: bot failed to detect this tool's response from the user", true));
                    activeCustomToolPrompts = activeCustomToolPrompts.filter((p) => p !== toolResponseQuestion.id);
                    await new Promise((r) => setTimeout(r, 10000));
                    await action.deleteMessage(toolResponseQuestion);
                    if (responseMessage) await action.deleteMessage(responseMessage);
                    if (noContentResponse) await action.deleteMessage(noContentResponse);
                } else {
                    await action.edit(toolResponseQuestion, `> custom tool successfully responded to, execution will now continue.\nthis message and your response will be deleted <t:${Math.floor(Date.now()/1000) + 3}:R> to clear up clutter.`);
                    conversation.addMessage(GPTToolResponse.newCustom(tc, content, false));
                    await new Promise((r) => setTimeout(r, 3000));
                    await action.deleteMessage(toolResponseQuestion);
                    activeCustomToolPrompts = activeCustomToolPrompts.filter((p) => p !== toolResponseQuestion.id)
                    if (responseMessage) await action.deleteMessage(responseMessage);
                }
            }
        } finally {
            release();
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
        if (latestAssistantMessage && conversation.messages.find(m => m.id === latestAssistantMessage.id)) {
            (conversation.messages.find(m => m.id === latestAssistantMessage.id) as GPTAssistantMessage).discordData = {
                messageId: sent.id,
                channelId: sent.channelId,
                referenceMessageId: sent.reference?.messageId,
                guildId: sent.guildId ?? undefined,
            };
        }
    }

    await conversation.write();

    log.info(`gpt handler finished for ${conversation.id}`);

    return sent;
}