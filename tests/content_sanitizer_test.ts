import { sanitizeIncomingMessageContent, sanitizeOutgoingMessageContent } from "../src/lib/gpt";
import { client } from "../src/bot"; // SHOCK!!! HORROR!!!!!!!!! (but its a test so its fine it works)
import * as log from "../src/lib/log"
import { Client, Message } from "discord.js";

const content = "<@440163494529073152> tibbling my tob in <#1312566483569741896>!";
const sanitizedContent = await sanitizeIncomingMessageContent({ content: content, client: client as Client<true> } as Message<true>);
log.debug(sanitizedContent);
const desanitizedContent = await sanitizeOutgoingMessageContent(sanitizedContent);
log.debug(desanitizedContent);

