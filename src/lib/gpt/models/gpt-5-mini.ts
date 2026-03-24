import { Model } from "../modelTypes";
import { OpenAIParameters } from "./openai-common";

export default new Model<typeof OpenAIParameters>({
    name: "gpt-5-mini",
    provider: "openai",
    description: "another quick-ish model (well, for a reasoning model at least), this time with reasoning tokens.",
    capabilities: ["chat", "vision", "functionCalling", "reasoning"],
    parameters: OpenAIParameters,
});