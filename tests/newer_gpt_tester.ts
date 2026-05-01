import { Conversation } from "../src/lib/gpt/conversation";
import readline from "readline"
import { AnyGPTMessage, GPTMessageType, GPTUserMessage } from "../src/lib/gpt/messageTypes";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "you> ",
});

const toolRL = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "tool> ",
});

// quick config

const username = "ayeuhugyu";
const userid = "440163494529073152";
const avatar = "https://example.com/";
const channelId = "1312566483569741896";

//

const conversation = new Conversation()

rl.prompt();

function randomId(length: number) {
    let response = "";
    for (let i = 0; i++; i < length) {
        const ran = Math.floor(Math.random() * 9);
        response += ran;
    }
    return response;
}

rl.on("line", async (line) => {
    const content = line.trim();

    conversation.addMessage(new GPTUserMessage({
        author: {
            id: userid,
            username: username,
            avatar: avatar
        },
        content: content,
        attachments: [],
        beenDeleted: true,
        createdAt: new Date(),
        discordData: {
            channelId: channelId,
            messageId: randomId(channelId.length)
        }
    }));

    const listener = (message: AnyGPTMessage) => {
        switch (message.type) {
            case GPTMessageType.ToolCall:
                console.log(`-# processing [${message.toolName}] with args ${JSON.stringify(message.arguments, null, 2).replaceAll(/\s+/g, " ").replaceAll("\n", "")}`);
                break;
            case GPTMessageType.ToolResponse:
                console.log(`-# finished [${message.toolName}]`);
                break;
        }
    };

    conversation.on("message", listener);

    const response = await conversation.run();

    conversation.emitter.removeListener("message", listener)

    console.log(`pepperbot> ${response?.content}`);

    rl.prompt();
});