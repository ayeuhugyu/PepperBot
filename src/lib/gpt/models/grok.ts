import { Model, ModelParameter } from "../modelTypes";
import z from "zod";

export default [
    new Model({
        name: "grok-3-mini-beta",
        provider: "xai",
        description: "a model with comparable intelligence to gpt-4o-mini, but with no censorship. this model is also EXTREMELY slow, and due to the lack of internal censorship training it is not available to all users.",
        capabilities: ["chat", "vision", "functionCalling"],
        parameters: [
            {
                key: 'temperature',
                description: 'controls randomness in the output. lower values make output more deterministic.',
                schema: z.float32("value must be a float / decimal number").
                    min(0, "value must be >= 0").
                    max(2, "value must be <= 2").
                    default(1),
            },
            {
                key: 'top_p',
                description: 'controls diversity via nucleus sampling. lower values make output more focused.',
                schema: z.float32("value must be a float / decimal number").
                    min(0, "value must be >= 0").
                    max(1, "value must be <= 1").
                    default(1),
            },
            {
                key: 'max_tokens',
                description: 'maximum number of tokens in the output.',
                schema: z.int("value must be an integer").
                    min(0, "value must be >= 0").
                    default(4096),
            }
        ],
        whitelist: ["440163494529073152", "406246384409378816", "726861364848492596", "436321340304392222", "1141928464946049065", "1162874217935675392"]
    }),
] as Model[];