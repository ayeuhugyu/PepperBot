import { Collection, Message } from "discord.js";
import { client } from "../src/bot";
import { GPTProcessorLogType, respond } from "../src/lib/gpt";
import * as readline from 'readline';

class FakeMessage {
    content: string = "";
    id: string = "1120938102380";
    attachments: Collection<string, any> = new Collection();
    client = client;
    author: {
        id: string;
        username: string;
        discriminator: string;
        avatarURL: () => string;
    } = {
        id: "123456789012345678",
        username: "ayeuhugyu",
        discriminator: "0001",
        avatarURL: () => "https://example.com/avatar.png",
    }
    constructor(content: string) {
        this.content = content;
    }
}

const logger = {
    log: ({ t, content }: { t: GPTProcessorLogType, content: string }) => {
        console.log(`[${t}] ${content}`);
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = () => {
    rl.question('Enter your message: ', async (input) => {
        const message = new FakeMessage(input);
        await respond(message as Message, logger as any);
        askQuestion(); // Call the function again to wait for the next input
    });
};

askQuestion(); // Initial call to start the loop