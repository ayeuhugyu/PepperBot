import { Model } from "../modelTypes";
import { OpenAIParameters } from "./openai-common";

export default new Model<typeof OpenAIParameters>({
    name: "gpt-4.1-nano",
    provider: "openai",
    description: "an insanely fast and efficient model, though intelligence can be lacking at times. this is the default model.",
    capabilities: ["chat", "vision", "functionCalling"],
    parameters: OpenAIParameters,
});