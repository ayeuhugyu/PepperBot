import { randomUUIDv7 } from "bun";
import { Message, User } from "discord.js";
import { Prompt } from "../prompt_manager";
import { defaultPrompt } from "./officialPrompts";

// #region Message Classes
export enum GPTMessageAttachmentType {
    Content = 'content',
    Url = 'url',
}

export class GPTMessage {
    public type: string = 'Tool';
    public content: string;

    constructor(content: string) {
        this.content = content;
    }
}

// #endregion
// #region Conversation Classes

export class Conversation {
    public id: string = randomUUIDv7();
    public messages: (Message | GPTMessage)[] = [];
    public users: User[] = [];
    public prompt: Prompt = defaultPrompt;
}