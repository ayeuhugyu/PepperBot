import { Model } from "../modelTypes";
import { OpenAIParameters } from "./openai-common";

export default new Model<typeof OpenAIParameters>({
    name: "gpt-6-luna",
    provider: "openai",
    description: "a small reasoning model idfk something i dont wanna write a description for this rn",
    capabilities: ["chat", "vision", "functionCalling", "reasoning"],
    parameters: OpenAIParameters,
});