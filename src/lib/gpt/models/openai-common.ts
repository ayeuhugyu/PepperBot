import z from "zod";
import { Model, ModelParameter } from "../modelTypes";

export const OpenAIParameters = {
    "temperature": {
        key: 'temperature',
        description: 'controls randomness in the output. lower values make output more deterministic.',
        schema: z.float32("value must be a float / decimal number").
            min(0, "value must be >= 0").
            max(2, "value must be <= 2").
            default(1),
    },
    "top_p": {
        key: 'top_p',
        description: 'controls diversity via nucleus sampling. lower values make output more focused.',
        schema: z.float32("value must be a float / decimal number").
            min(0, "value must be >= 0").
            max(1, "value must be <= 1").
            default(1),
    },
    "max_tokens": {
        key: 'max_tokens',
        description: 'maximum number of tokens in the output.',
        schema: z.int("value must be an integer").
            min(0, "value must be >= 0").
            default(4096),
    },
    "presence_penalty": {
        key: 'presence_penalty',
        description: 'penalizes new tokens based on whether they appear in the text so far.',
        schema: z.float32("value must be a float / decimal number").
            min(-2, "value must be >= -2").
            max(2, "value must be <= 2").
            default(0),
    },
    "frequency_penalty": {
        key: 'frequency_penalty',
        description: 'penalizes new tokens based on their existing frequency in the text so far.',
        schema: z.float32("value must be a float / decimal number").
            min(-2, "value must be >= -2").
            max(2, "value must be <= 2").
            default(0)
    }
};