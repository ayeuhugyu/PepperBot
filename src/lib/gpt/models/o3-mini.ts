import { Model } from "../modelTypes";
import { OpenAIParameters } from "./openai-common";

export default new Model<typeof OpenAIParameters>({
    name: "o3-mini",
    provider: "openai",
    description: "a small reasoning model, capable of handling more complex tasks than other models. this is MUCH slower than any other model, due to the reasoning requirements.",
    capabilities: ["chat", "vision", "functionCalling", "reasoning"],
    parameters: OpenAIParameters,
});