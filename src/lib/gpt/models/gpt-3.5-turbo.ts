import { Model } from "../modelTypes";
import { OpenAIParameters } from "./openai-common";

export default new Model<typeof OpenAIParameters>({
    name: "gpt-3.5-turbo",
    provider: "openai",
    description: "a significantly older model, not recommended for use. this is here for historical purposes.",
    capabilities: ["chat"],
    parameters: OpenAIParameters,
});