import { Collection, Message } from "discord.js";
import { respond } from "../src/lib/gpt";

const fakeMessage = {
    content: `put some sentances separated by "$SPLIT_MESSAGE$"`,
    id: "123456789012345678",
    attachments: new Collection(),
    author: {
        id: "123456789012345678",
        username: "ayeuhugyu",
        discriminator: "0001",
        avatarURL: () => "https://example.com/avatar.png",
    }
} as Message;

await respond(fakeMessage, console as any) // this is the reason for the "log" function, i can just plug in a logger here and itll work
