import { Message } from "discord.js";
import { getConversation } from "../src/lib/gpt/main";

const msg = {
    id: "messageTest",
    author: {
        id: "1234567890",
    },
    content: "hey real quick just test some tool, ex. request_url on https://example.com",
} as Message

const conversation = await getConversation(msg)
await conversation.addDiscordMessage(msg);

conversation.bindOnToolCall((calls) => {
    calls.forEach((call) => {
        console.log(call.serialize());
    });
})

await conversation.run().then(response => {
    console.log("Response from model:", response.serialize());
});

console.log(conversation.serialize());

conversation.unbindOnToolCall();