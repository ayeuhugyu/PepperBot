import { Conversation, getConversation } from "../src/lib/gpt/conversation";
import readline from "readline"
import { AnyGPTMessage, GPTMessageType, GPTToolCall, GPTToolResponse, GPTUserMessage } from "../src/lib/gpt/messageTypes";
import { getDefaultPrompt } from "../src/lib/gpt/officialPrompts";
import { CustomTool } from "../src/lib/gpt/toolTypes";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "you> ",
});

// quick config

const username = "ayeuhugyu";
const userid = "440163494529073152";
const avatar = "https://example.com/";
const channelId = "1312566483569741896";

//

const conversation = await getConversation();
// if (!conversation) conversation = new Conversation("gpt-tester");
const prompt = await getDefaultPrompt();
prompt?.customTools.push(new CustomTool({
    name: "enrich_url",
    description: "enriches a url.",
    parameters: {
        "url": {
            key: "url",
            description: "the url to enrich",
            type: "string",
            required: true,
        }
    }
}));
// conversation.setPrompt(prompt!);
await conversation.write();

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

    const tcListener = (message: GPTToolCall) => {
        console.log(`-# processing [${message.toolName}] with args ${JSON.stringify(message.arguments, null, 2).replaceAll(/\s+/g, " ").replaceAll("\n", "")}`);
    };

    const responseListener = (message: GPTToolResponse) => {
        console.log(`-# finished [${message.toolName}]`);
    }

    const customListener = async (tc: GPTToolCall) => {
        console.log(`bot is attempting to execute a custom tool. please provide the output of this tool:\n\n**${tc.toolName}\nargs:\n${JSON.stringify(tc.arguments, null, 2)}`);
        const toolOutput = await new Promise<string>((resolve) => {
            rl.question("tool output> ", (answer) => {
                resolve(answer);
            });
        });
        const response = GPTToolResponse.newCustom(tc, toolOutput, false);
        conversation.addMessage(response);
    }

    conversation.emitter.on("toolCall", tcListener);
    conversation.emitter.on("toolCallResponse", responseListener);
    conversation.emitter.on("customToolCall", customListener);

    const response = await conversation.run();

    conversation.emitter.removeAllListeners();

    await conversation.write();
    console.log(`pepperbot> ${response?.content}`);

    rl.prompt();
});