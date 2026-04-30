import { Conversation } from "../src/lib/gpt/conversation";
import { GPTUserMessage } from "../src/lib/gpt/messageTypes";

const conversation = new Conversation();
conversation.messages.push(new GPTUserMessage({
    author: {
        id: "440163494529073152",
        username: "ayeuhugyu",
        avatar: "https://example.com/"
    },
    content: "hello!!!",
    attachments: [],
    beenDeleted: true,
    createdAt: new Date(),
    discordData: {
        channelId: "1312566483569741896",
        messageId: "1234567891234567891"
    }
}));
await conversation.run();

console.log(conversation.getLatestMessage());