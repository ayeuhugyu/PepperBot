import { Model } from "../modelTypes";
import { OpenAIParameters } from "./openai-common";

export default new Model<typeof OpenAIParameters>({
    name: "gpt-5.4-nano",
    provider: "openai",
    description: "another very fast model, but this time with reasoning. also has become corporatized slopbot 💔",
    capabilities: ["chat", "vision", "functionCalling", "reasoning"],
    parameters: OpenAIParameters,
});