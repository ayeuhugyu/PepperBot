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
    await Promise.all(matches.map(async (match) => {
        const fulltext = match[0];
        const templateName = match[1];

        switch (templateName) {
            case "guildemojis":
                const guild = await conversation.fetchGuild();
                let emojitext = `here is a list of guild emojis available to you:\n`;
                if (guild) {
                    (await guild.emojis.fetch()).forEach(emoji => {
                        emojitext += `:${emoji.name}:\n`
                    });
                } else {
                    emojitext += `no guild emojis available`;
                }

                replacements[fulltext] = emojitext;
            break;
            default:
                replacements[fulltext] = `\${ERR: unknown template: ${templateName}}`;
                break;
        }
    }));

    let text = promptContent;

    Object.entries(replacements).forEach(([v, k]) => {
        text.replace(k, v);
    });

    return text;
}