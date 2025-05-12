import { InteractionReplyOptions, Message, MessagePayload, MessageReplyOptions, InteractionResponse, TextChannel, EmbedBuilder, AttachmentBuilder, MessageActionRowComponentBuilder, Embed, Attachment, JSONEncodable, APIAttachment, BufferResolvable, AttachmentPayload, APIEmbed, APIActionRowComponent, ActionRowData, MessageActionRowComponentData, MessageEditOptions, MessageCreateOptions, CommandInteraction, MessageFlags, OmitPartialGroupDMChannel, DMChannel, PartialDMChannel, NewsChannel, StageChannel, PublicThreadChannel, PrivateThreadChannel, VoiceChannel, BitFieldResolvable } from "discord.js"; // this import is horrific
import { CommandInvoker, FormattedCommandInteraction } from "./classes/command";
import { config } from "dotenv";
config();
import process from "node:process";
import * as log from "./log";
import { Stream } from "node:stream";
import { textToAttachment } from "./attachment_manager";
import { ActionRow, Container, File, MediaGallery, Section, Separator, TextDisplay } from "./classes/components";

type ApiMessageComponents = JSONEncodable<APIActionRowComponent<any>> | ActionRowData<MessageActionRowComponentData | MessageActionRowComponentBuilder> | APIActionRowComponent<any>
export interface MessageInput {
    content?: string;
    embeds?: (JSONEncodable<APIEmbed> | APIEmbed | Embed | EmbedBuilder)[];
    allowPings?: boolean;
    files?: (BufferResolvable | Stream | JSONEncodable<APIAttachment> | Attachment | AttachmentBuilder | AttachmentPayload)[];
    components?: (ApiMessageComponents | Container | ActionRow | TextDisplay | Separator | File | Section | MediaGallery)[];
    attachments?: Attachment[] | AttachmentBuilder[];
    ephemeral: boolean;
    components_v2?: boolean;
    flags?: InteractionReplyOptions['flags'];
    fetchReply?: boolean;
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

const massPingReplacements = {
    "<@Mister Everyone>": /@everyone/g,
    "<@Mister Here>": /@here/g,
    "<@&Mister Role>": /<@&\d+>/g
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
            if (value !== undefined && value !== "") {
                message.content = message.content.toString().replaceAll(value, key); // tostring is necessary here because it can actually be a number somehow
            }
        }
        if (!allowPings) {
            for (const [key, value] of Object.entries(massPingReplacements)) {
                message.content = message.content.replaceAll(value, key);
            }
        }
    }

    if (isEmpty(message)) {
        log.warn("attempt to send an empty message")
        //message.content = "<empty>";
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

export function reply<T extends CommandInvoker>(invoker: T, content: Partial<MessageInput> | string): Promise<(T extends Message<true> ? Message<true> : InteractionResponse) | void> {
    if (typeof content === "object" && 'ephemeral' in content) {
        if (content.ephemeral === true) {
            (content as InteractionReplyOptions).flags = (Number((content as InteractionReplyOptions).flags) ?? 0) | MessageFlags.Ephemeral
        }
        delete content.ephemeral
    }
    if (typeof content === "object" && 'components_v2' in content) {
        if (content.components_v2) {
            (content as InteractionReplyOptions).flags = (Number((content as InteractionReplyOptions).flags) ?? 0) | MessageFlags.IsComponentsV2 // weird hack idfc that its not always interactionreplyoptions
            delete content.components_v2
        }
    }
    const reply = fixMessage(content) as InteractionReplyOptions & MessageReplyOptions
    log.debug(`replying to ${invoker.author.username} (cid: ${invoker.channel?.id}, mid: ${invoker.id}) with`, reply);
    return invoker.reply(reply).catch((err) => {
        log.error(`failed to reply to ${invoker.id}`, err);
    }) as never;
}

export type SendableChannel = TextChannel | DMChannel | PartialDMChannel | NewsChannel | StageChannel | PublicThreadChannel<boolean> | PrivateThreadChannel | VoiceChannel

export function send(channel: SendableChannel, content: Partial<MessageInput> | string): Promise<Message | void>  {
    const reply = fixMessage(content)  as InteractionReplyOptions & MessageReplyOptions
    log.debug(`sending message to ${channel.id} with`, reply);
    return channel.send(reply).catch((err) => {
        log.error(`failed to send message to ${channel.id}`, err);
    })
}

export function edit(message: Message | InteractionResponse, content: Partial<MessageInput> | string): Promise<Message | void> {
    const reply = fixMessage(content) as string | MessagePayload | MessageEditOptions
    log.debug(`editing message ${message.id} with`, reply);
    return message.edit(reply).catch((err) => {
        log.error(`failed to edit message ${message.id}`, err);
    });
}

export function deleteMessage(message: Message): Promise<OmitPartialGroupDMChannel<Message> | void> {
    log.debug(`deleting message ${message.id}`);
    return message.delete().catch((err) => {
        log.error(`failed to delete message ${message.id}`, err);
    });
}