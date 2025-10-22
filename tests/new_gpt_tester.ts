import readline from "readline";
import { Message } from "discord.js";
import { getConversation } from "../src/lib/gpt/main";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "You> ",
});

let conversation: any = null;
let initialized = false;

rl.prompt();

rl.on("line", async (line) => {
    const content = line.trim();
    if (!content) {
        rl.prompt();
        return;
    }
    if (content === "exit" || content === "quit") {
        rl.close();
        return;
    }

    const msg = {
        id: `msg-${Date.now()}`,
        author: { id: "1234567890" },
        content,
    } as Message;

    if (!initialized) {
        conversation = await getConversation(msg);
        conversation.bindOnToolCall((calls: any[]) => {
            calls.forEach((call) => {
                console.log(call.serialize());
            });
        });
        initialized = true;
    }

    await conversation.addDiscordMessage(msg);

    try {
        const response = await conversation.run();
        console.log("Response from model:", response.serialize());
        console.log(conversation.serialize());
    } catch (err) {
        console.error("Error running conversation:", err);
    }

    rl.prompt();
});

rl.on("close", () => {
    if (conversation) conversation.unbindOnToolCall();
    console.log("Exiting.");
    process.exit(0);
});