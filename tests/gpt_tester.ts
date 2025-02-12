import { Collection, Message, User } from "discord.js";
import { GPTProcessor, respond } from "../src/lib/gpt";

const fakeMessage = {
    content: "call the test function im testin shit",
    id: "123456789012345678",
    attachments: new Collection(),
    author: {
        id: "123456789012345678",
        username: "ayeuhugyu",
        discriminator: "0001",
        avatarURL: () => "https://example.com/avatar.png",
    } as User,
} as Message;

await respond(fakeMessage, console as any) // this is the reason for the "log" function, i can just plug in a logger here and itll work
