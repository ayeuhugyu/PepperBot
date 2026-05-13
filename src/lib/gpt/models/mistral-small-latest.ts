import { Model, ModelParameter } from "../modelTypes";
import z from "zod";

const params = {
    "temperature": {
        key: 'temperature',
        description: 'controls randomness in the output. lower values make output more deterministic.',
        schema: z.coerce.number("value must be a float / decimal number").
            min(0, "value must be >= 0").
            max(2, "value must be <= 2").
            default(1),
    },
    "top_p": {
        key: 'top_p',
        description: 'controls diversity via nucleus sampling. lower values make output more focused.',
        schema: z.coerce.number("value must be a float / decimal number").
            min(0, "value must be >= 0").
            max(1, "value must be <= 1").
            default(1),
    },
    "max_tokens": {
        key: 'max_tokens',
        description: 'maximum number of tokens in the output.',
        schema: z.coerce.number("value must be an integer").
            int("value must be an integer").
            min(0, "value must be >= 0").
            default(4096),
    }
};

export default new Model({
    name: "mistral-small-latest",
    provider: "mistral",
    description: "a fast and efficient small model from mistral ai, capable of handling general chat tasks.",
    capabilities: ["chat", "vision", "functionCalling"],
    parameters: params
});