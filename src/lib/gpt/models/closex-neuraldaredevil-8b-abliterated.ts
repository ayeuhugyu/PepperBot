import { Model, ModelParameter } from "../modelTypes";
import z from "zod";

const params = {
    "num_ctx": {
        key: 'num_ctx',
        description: 'the number of context tokens to use for the model.',
        schema: z.int("value must be an integer").
            min(1, "value must be >= 1").
            max(16384, "value must be <= 16384").
            default(8192),
    },
    "temperature": {
        key: 'temperature',
        description: 'controls randomness in the output. lower values make output more deterministic.',
        schema: z.float32("value must be a float / decimal number").
            min(0, "value must be >= 0").
            max(2, "value must be <= 2").
            default(0.7),
    },
    "num_keep": {
        key: 'num_keep',
        description: 'the number of tokens to keep in the context.',
        schema: z.int("value must be an integer").
            min(1, "value must be >= 1").
            max(2048, "value must be <= 2048").
            default(24),
    },
};

export default new Model<typeof params>({
    name: "closex/neuraldaredevil-8b-abliterated",
    provider: "ollama",
    description: "a model designed for casual chat applications",
    capabilities: ["chat"],
    parameters: params
});