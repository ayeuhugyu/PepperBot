import { Conversation } from "../src/lib/gpt/conversation";
import { GPTUserMessage } from "../src/lib/gpt/messageTypes";

const conversation = new Conversation();
conversation.addMessage(new GPTUserMessage({
    author: {
        id: "440163494529073152",
        username: "ayeuhugyu",
        avatar: "https://example.com/"
    },
    content: "hello!!! please try to use the request_url tool on https://pepperbot.online/. i am testing rewritten things.",
    attachments: [],
    beenDeleted: true,
    createdAt: new Date(),
    discordData: {
        channelId: "1312566483569741896",
        messageId: "1234567891234567891"
    }
}));
await conversation.run();

// console.log(conversation.getLatestMessage());
// await conversation.run();
console.log(conversation.messages);
process.exit(0);