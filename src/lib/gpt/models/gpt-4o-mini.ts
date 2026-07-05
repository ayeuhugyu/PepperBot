import { Model } from "../modelTypes";
import { OpenAIParameters } from "./openai-common";

export default new Model<typeof OpenAIParameters>({
    name: "gpt-4o-mini",
    provider: "openai",
    description: "slightly more intelligant than 4.1-nano, but much, much slower. this was the model used before the first rewrite of all AI stuff.",
    capabilities: ["chat", "vision"],
    parameters: OpenAIParameters,
});