import { randomId } from "../id";
import { Prompt } from "../prompt_manager";
import { GPTMessage } from "./messageTypes";
import { getDefaultPrompt } from "./officialPrompts";

export class Conversation {
    id: string = randomId();
    messages: GPTMessage[] = [];
    prompt: Prompt = getDefaultPrompt();
}