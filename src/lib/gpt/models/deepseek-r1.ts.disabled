import z from "zod";
import { Model } from "../modelTypes";

const params = {
    "temperature": {
        key: 'temperature',
        description: 'controls randomness in the output. lower values make output more deterministic.',
        schema: z.float32("value must be a float / decimal number").
            min(0, "value must be >= 0").
            max(2, "value must be <= 2").
            default(0.6),
    },
    "top_p": {
        key: 'top_p',
        description: 'controls diversity via nucleus sampling. lower values make output more focused.',
        schema: z.float32("value must be a float / decimal number").
            min(0, "value must be >= 0").
            max(1, "value must be <= 1").
            default(0.95),
    },
};

export default new Model<typeof params>({
    name: "deepseek-r1",
    provider: "ollama",
    description: "an extremely powerful reasoning model. this model is also extremely slow due to the reasoning requirements.",
    capabilities: ["chat", "reasoning"],
    parameters: params
});