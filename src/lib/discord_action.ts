import { InteractionReplyOptions, Message, MessagePayload, MessageReplyOptions, InteractionResponse, TextChannel, EmbedBuilder, AttachmentBuilder, MessageActionRowComponentBuilder, Embed, Attachment, JSONEncodable, APIAttachment, BufferResolvable, AttachmentPayload, APIEmbed, APIActionRowComponent, APIMessageActionRowComponent, ActionRowData, MessageActionRowComponentData, MessageEditOptions, MessageCreateOptions, CommandInteraction, MessageFlags } from "discord.js"; // this import is horrific
import { CommandInvoker, } from "./classes/command";
import { config } from "dotenv";
config();
import process from "node:process";
import * as log from "./log";
import { Stream } from "node:stream";
import { textToAttachment } from "./attachment_manager";

export interface MessageInput {
    content?: string;
    embeds?: (JSONEncodable<APIEmbed> | APIEmbed | Embed | EmbedBuilder)[];
    allowPings?: boolean;
    files?: (BufferResolvable | Stream | JSONEncodable<APIAttachment> | Attachment | AttachmentBuilder | AttachmentPayload)[];
    components?: (JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>> | ActionRowData<MessageActionRowComponentData | MessageActionRowComponentBuilder> | APIActionRowComponent<APIMessageActionRowComponent>)[];
    attachments?: Attachment[] | AttachmentBuilder[];
    ephemeral: boolean;
};

const replaceList = {
    "##DT_pepper##": process.env.DISCORD_TOKEN,
    "##DCS_carrot##": process.env.DISCORD_CLIENT_SECRET,
    "##WT_onion##": process.env.WEBHOOK_TOKEN,
    "##OAIAK_bellpepper##": process.env.OPENAI_API_KEY,
    "##GAK_cucumber##": process.env.GOOGLE_API_KEY,
    "##AAK_kiwi##": process.env.ADOBE_API_KEY,
    "##LFMAK_coconut##": process.env.LASTFM_API_KEY
};

const pingReplacements = {
    "Mister Everyone": /@everyone/g,
    "Mister Here": /@here/g,
    "Mister Role": /<@&\d+>/g
}

function isEmpty(message: Partial<MessageInput>): boolean {
    return ![
        (message.content?.length || 0) > 0,
        (message.embeds?.length || 0) > 0,
        (message.files?.length || 0) > 0,
        (message.components?.length || 0) > 0,
    ].some((value) => value)
}

export function fixMessage(message: Partial<MessageInput> | string): Partial<MessageInput> {
    if (typeof message === "string") {
        message = { content: message } as MessageInput;
    }
    const allowPings = message.allowPings ?? false;
    if ('content' in message && message.content) {
        for (const [key, value] of Object.entries(replaceList)) {
            if (value !== undefined) {
                message.content = message.content.replaceAll(value, key);
            }
        }
        if (!allowPings) {
            for (const [key, value] of Object.entries(pingReplacements)) {
                message.content = message.content.replaceAll(value, key);
            }
        }
    }

    if (isEmpty(message)) {
        log.warn("attempt to send an empty message")
        message.content = "<empty>";
    }

    if (message.content && message.content.length > 2000) {
        log.warn("attempt to send a message longer than 2000 characters")
        const attachment = textToAttachment(message.content, "overflow.txt", "the contents of the message as a file");
        message.content = "message content exceeded 2000 characters, here's a file with the text instead"
        message.files ??= [];
        message.files.push(attachment);
    } // todo: check embeds
    return message;
}

export function reply<T extends CommandInvoker>(invoker: T, content: Partial<MessageInput> | string): Promise<T extends Message<true> ? Message<true> : InteractionResponse> {
    if (invoker instanceof CommandInteraction && typeof content === "object" && content.ephemeral) {
        (content as InteractionReplyOptions).flags = MessageFlags.Ephemeral;
        delete content.ephemeral
    }
    return invoker.reply(fixMessage(content)) as never
}

export function send(channel: TextChannel, content: Partial<MessageInput> | string): Promise<Message>  {
    return channel.send(fixMessage(content))
}

export function edit(message: Message | InteractionResponse, content: Partial<MessageInput> | string): Promise<Message> {
    return message.edit(fixMessage(content) as string | MessagePayload | MessageEditOptions);
}