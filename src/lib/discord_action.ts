import { InteractionReplyOptions, Message, MessagePayload, MessageReplyOptions, InteractionResponse, TextChannel, EmbedBuilder, AttachmentBuilder, MessageActionRowComponentBuilder, Embed, Attachment, JSONEncodable, APIAttachment, BufferResolvable, AttachmentPayload, APIEmbed, APIActionRowComponent, APIMessageActionRowComponent, ActionRowData, MessageActionRowComponentData, MessageEditOptions, MessageCreateOptions } from "discord.js"; // this import is horrific
import { FormattedCommandInteraction } from "./classes/command";
import { config } from "dotenv";
config();
import process from "node:process";
import * as log from "./log";
import { Stream } from "node:stream";
import { textToFile } from "./filify";

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
    let isEmpty = true;
    const emptyChecks = [
        (message.content?.length || 0) > 0,
        (message.embeds?.length || 0) > 0,
        (message.files?.length || 0) > 0,
        (message.components?.length || 0) > 0,
    ]
    if (emptyChecks.some((value) => value)) {
        isEmpty = false;
    }
    if (isEmpty) {
        log.warn("attempt to send an empty message")
        message.content = "<empty>";
    }
    if (message.content && message.content.length > 2000) {
        log.warn("attempt to send a message longer than 2000 characters")
        const path = textToFile(message.content, "overflowtext");
        message.content = "message content exceeded 2000 characters, here's a file with the text instead"
        if (!message.files) message.files = [];
        message.files.push(path);
    } // todo: check embeds
    return message;
}

export function reply(message: Message | FormattedCommandInteraction, content: Partial<MessageInput> | string): Promise<Message> | Promise<InteractionResponse> | undefined {
    content = fixMessage(content);
    if (message instanceof Message) {
        return message.reply(content as string | MessagePayload | MessageReplyOptions);
    }
    if (message as FormattedCommandInteraction) {
        return message.reply(content as InteractionReplyOptions);
    }
    return undefined;
}

export function send(channel: TextChannel, content: Partial<MessageInput> | string): Promise<Message> | undefined {
    content = fixMessage(content);
    if (channel) {
        return channel.send(content as string | MessagePayload | MessageCreateOptions);
    }
    return undefined;
}

export function edit(message: Message | InteractionResponse, content: Partial<MessageInput> | string): Promise<Message> | undefined {
    content = fixMessage(content);
    if (message) {
        return message.edit(content as string | MessagePayload | MessageEditOptions);
    }
    return undefined;
}