import { Model, ModelParameter } from "../modelTypes";
import z from "zod";

const OpenAIParameters: ModelParameter[] = [
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
    },
    {
        key: 'presence_penalty',
        description: 'penalizes new tokens based on whether they appear in the text so far.',
        schema: z.float32("value must be a float / decimal number").
            min(-2, "value must be >= -2").
            max(2, "value must be <= 2").
            default(0),
    },
    {
        key: 'frequency_penalty',
        description: 'penalizes new tokens based on their existing frequency in the text so far.',
        schema: z.float32("value must be a float / decimal number").
            min(-2, "value must be >= -2").
            max(2, "value must be <= 2").
            default(0)
    }
];

export default [
    new Model({
        name: "gpt-3.5-turbo",
        provider: "openai",
        description: "a significantly older model, not recommended for use. this is here for historical purposes.",
        capabilities: ["chat"],
        parameters: OpenAIParameters,
    }),
    new Model({
        name: "gpt-4o-mini",
        provider: "openai",
        description: "slightly more intelligant than 4.1-nano, but much, much slower. this was the model used before the first rewrite of all AI stuff.",
        capabilities: ["chat", "vision"],
        parameters: OpenAIParameters,
    }),
    new Model({
        name: "gpt-4.1-nano",
        provider: "openai",
        description: "an insanely fast and efficient model, though intelligence can be lacking at times. this is the default model.",
        capabilities: ["chat", "vision", "functionCalling"],
        parameters: OpenAIParameters,
    }),
    new Model({
        name: "gpt-5-mini",
        provider: "openai",
        description: "another quick-ish model (well, for a reasoning model at least), this time with reasoning tokens.",
        capabilities: ["chat", "vision", "functionCalling", "reasoning"],
        parameters: OpenAIParameters,
    }),
    new Model({
        name: "o3-mini",
        provider: "openai",
        description: "a small reasoning model, capable of handling more complex tasks than other models. this is MUCH slower than any other model, due to the reasoning requirements.",
        capabilities: ["chat", "vision", "functionCalling", "reasoning"],
        parameters: OpenAIParameters,
    }),
] as Model[];