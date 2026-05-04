import { Client } from "discord.js";
import { Conversation } from "./conversation";
import { AnyPrompt } from "./promptManager";

let client: Client | undefined = undefined;
export function initTemplatingClient(inputclient: Client) {
    client = inputclient;
}

export async function applyPromptTemplating(promptContent: string, conversation: Conversation): Promise<string> {
    // /(?<!\\)\${([^}]+[^\\])}/g
}