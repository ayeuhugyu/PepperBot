import { Model, ModelParameter } from "../modelTypes";
import z from "zod";

export default [
    new Model({
        name: "deepseek-r1",
        provider: "ollama",
        description: "an extremely powerful reasoning model. this model is also extremely slow due to the reasoning requirements.",
        capabilities: ["chat", "reasoning"],
        parameters: [
            {
                key: 'temperature',
                description: 'controls randomness in the output. lower values make output more deterministic.',
                schema: z.float32("value must be a float / decimal number").
                    min(0, "value must be >= 0").
                    max(2, "value must be <= 2").
                    default(0.6),
            },
            {
                key: 'top_p',
                description: 'controls diversity via nucleus sampling. lower values make output more focused.',
                schema: z.float32("value must be a float / decimal number").
                    min(0, "value must be >= 0").
                    max(1, "value must be <= 1").
                    default(0.95),
            },
        ],
    }),
    new Model({
        name: "'closex/neuraldaredevil-8b-abliterated",
        provider: "ollama",
        description: "a model designed for casual chat applications",
        capabilities: ["chat"],
        parameters: [
            {
                key: 'num_ctx',
                description: 'the number of context tokens to use for the model.',
                schema: z.int("value must be an integer").
                    min(1, "value must be >= 1").
                    max(16384, "value must be <= 16384").
                    default(8192),
            },
            {
                key: 'temperature',
                description: 'controls randomness in the output. lower values make output more deterministic.',
                schema: z.float32("value must be a float / decimal number").
                    min(0, "value must be >= 0").
                    max(2, "value must be <= 2").
                    default(0.7),
            },
            {
                key: 'num_keep',
                description: 'the number of tokens to keep in the context.',
                schema: z.int("value must be an integer").
                    min(1, "value must be >= 1").
                    max(2048, "value must be <= 2048").
                    default(24),
            },
        ],
    }),
] as Model[];