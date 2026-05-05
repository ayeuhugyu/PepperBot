import { Client } from "discord.js";
import { Conversation } from "./conversation";
import { AnyPrompt } from "./promptManager";

let client: Client | undefined = undefined;
export function initTemplatingClient(inputclient: Client) {
    client = inputclient;
}

export async function applyPromptTemplating(promptContent: string, conversation: Conversation): Promise<string> {
    const regex = /(?<!\\)\${([^}]+[^\\])}/g;

    const matches = promptContent.matchAll(regex);
    const replacements: Record<string, string> = {};
    matches.forEach((match) => {
        const fulltext = match[0];
        const templateName = match[1];

        switch (templateName) {
            default:
                replacements[fulltext] = `\${ERR: unknown template: ${templateName}}`;
                break;
        }
    });

    let text = promptContent;

    Object.entries(replacements).forEach(([v, k]) => {
        text.replace(k, v);
    });

    return text;
}