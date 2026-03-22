// #region Class Definitions

import { Conversation } from "./main";
import { GPTMessage } from "./messageTypes";
import { runOpenAI } from "./openai_runner";
import { runOllama } from "./ollama_runner";
import * as chalk from "chalk";
import { DiscordAnsi } from "../discord_ansi";
import { runGrok } from "./grok_runner";
import { runMistral } from "./mistral_runner";
import z, { ZodAny } from "zod";

export type ModelProvider = 'openai' | 'xai' | 'mistral' | 'ollama'
export type ModelName =
  | 'gpt-3.5-turbo'
  | 'gpt-4o-mini'
  | 'gpt-4.1-nano'
  | 'gpt-5-mini'
  | 'o3-mini'
  | 'grok-3-mini-beta'
  | 'mistral-small-latest'
  | 'deepseek-r1'
  | 'closex/neuraldaredevil-8b-abliterated'
export type ModelCapabilities = 'chat' | 'vision' | 'videoVision' | 'functionCalling' | 'reasoning';

export interface ModelParameter {
    key: string;
    description: string;
    // type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    // restrictions?: {
    //     min?: number;
    //     max?: number;
    //     enum?: string[];
    //     pattern?: RegExp;
    //     required?: boolean;
    // }
    // default?: string | number | boolean | object | any[];
    schema: z.ZodType<any, unknown, z.core.$ZodTypeInternals<any, unknown>>;
}

export class Model {
    public name: ModelName;
    public provider: ModelProvider;
    public description: string;
    public capabilities: ModelCapabilities[];
    public parameters: ModelParameter[];
    public whitelist?: string[];
    public runner: (conversation: Conversation) => Promise<GPTMessage>;

    constructor(name: ModelName, provider: ModelProvider, description: string, capabilities: ModelCapabilities[], parameters: ModelParameter[], whitelist?: string[], runner?: (conversation: Conversation) => Promise<GPTMessage>) {
        this.name = name;
        this.provider = provider;
        this.description = description;
        this.capabilities = capabilities;
        this.whitelist = whitelist;
        this.runner = runner || (() => {
            throw new Error(`No runner defined for model ${name}.`);
        });

        this.parameters = parameters;
    }

    filterParameters(params: Record<string, any>) {
        const paramsOutput: Record<string, any> = {};
        this.parameters.forEach(param => {
            paramsOutput[param.key] = param.schema.safeParse(params[param.key] ?? undefined);
        });

        return paramsOutput;
    }

    serialize(discordCompatible = false) {
        const c = discordCompatible ? DiscordAnsi : chalk;
        const lines = [];
        lines.push(
            (discordCompatible
                ? c.bgGreen(c.bold(" Model ")) + c.gray(`  [${this.name}]  `) + c.gray(`[${this.provider}]`)
                : chalk.bgGreenBright(chalk.bold(" Model ")) + chalk.gray(`  [${this.name}]  `) + chalk.gray(`[${this.provider}]`)
            )
        );
        lines.push(c.bold("Description:") + " " + c.white(this.description));
        lines.push(c.bold("Capabilities:") + " " + this.capabilities.map((cap) => c.cyan(cap)).join(", "));
        if (this.parameters && this.parameters.length > 0) {
            // lines.push(c.bold("Parameters:") +
            //     "\n" + this.parameters.map(param =>
            //         c.cyan("  • ") + (discordCompatible ? DiscordAnsi.gold(param.key) : chalk.yellow(param.key)) + c.gray(` (${param.type})`) +
            //         (param.description ? c.gray(": ") + c.white(param.description) : "") +
            //         (param.default !== undefined ? c.gray(" [default: ") + c.white(JSON.stringify(param.default)) + c.gray("]") : "") +
            //         (param.restrictions ? c.gray(" [restrictions: ") + c.white(JSON.stringify(param.restrictions)) + c.gray("]") : "")
            //     ).join("\n")
            // );
            lines.push(c.bold("Parameters: \n"));
            this.parameters.forEach(param => {
                let text = `${c.cyan("  • ")} ${c.yellow(param.key)}  ${c.gray(`(${param.schema.type})`)}`;
                if (param.description) text += `${c.gray(": ")} ${c.white(param.description)}`;
                const jsonSchema = param.schema.toJSONSchema();
                if (jsonSchema.default !== undefined) text += `${c.gray(" [default:")} ${c.white(JSON.stringify(jsonSchema.default))}${c.gray("]")}`;

                const restrictions = [];
                if (jsonSchema.minimum !== undefined) restrictions.push(`min: ${jsonSchema.minimum}`);
                if (jsonSchema.maximum !== undefined) restrictions.push(`max: ${jsonSchema.maximum}`);
                if (jsonSchema.enum) restrictions.push(`enum: ${jsonSchema.enum.join(', ')}`);
                if (jsonSchema.minLength !== undefined) restrictions.push(`minLength: ${jsonSchema.minLength}`);
                if (jsonSchema.maxLength !== undefined) restrictions.push(`maxLength: ${jsonSchema.maxLength}`);

                if (restrictions.length > 0) text += ` ${c.gray("[restrictions:")} ${c.white(restrictions.join(", "))}${c.gray("]")}`;

                lines.push(text);
            });
        } else {
            lines.push(c.bold("Parameters:") + " " + c.gray("[none]"));
        }
        if (this.whitelist && this.whitelist.length > 0) {
            lines.push(c.bold("Whitelist:") + " " + this.whitelist.map(id => c.magenta(id)).join(", "));
        }
        lines.push("");
        return lines.join("\n");
    }
}

// #endregion
// #region Common Parameters

const OpenAIParameters: ModelParameter[] = [
    {
        key: 'temperature',
        description: 'Controls randomness in the output. Lower values make output more deterministic.',
        schema: z.float32("value must be a float / decimal number").
            min(0, "value must be >= 0").
            max(2, "value must be <= 2").
            default(1),
    },
    {
        key: 'top_p',
        description: 'Controls diversity via nucleus sampling. Lower values make output more focused.',
        schema: z.float32("value must be a float / decimal number").
            min(0, "value must be >= 0").
            max(1, "value must be <= 1").
            default(1),
    },
    {
        key: 'max_tokens',
        description: 'Maximum number of tokens in the output.',
        schema: z.int("value must be an integer").
            min(0, "value must be >= 0").
            default(4096),
    },
    {
        key: 'presence_penalty',
        description: 'Penalizes new tokens based on whether they appear in the text so far.',
        schema: z.float32("value must be a float / decimal number").
            min(-2, "value must be >= -2").
            max(2, "value must be <= 2").
            default(0),
    },
    {
        key: 'frequency_penalty',
        description: 'Penalizes new tokens based on their existing frequency in the text so far.',
        schema: z.float32("value must be a float / decimal number").
            min(-2, "value must be >= -2").
            max(2, "value must be <= 2").
            default(0)
    }
];

// #endregion
// #region Model Definitions

export const Models: Record<ModelName, Model> = {
    // OPENAI MODELS
    'gpt-3.5-turbo': new Model(
        'gpt-3.5-turbo',
        'openai',
        'a significantly older model, not recommended for use. this is here for historical purposes.',
        ['chat'],
        OpenAIParameters,
        [],
        runOpenAI
    ),
    'gpt-4o-mini': new Model(
        'gpt-4o-mini',
        'openai',
        'slightly more intelligant than 4.1-nano, but much, much slower. this is the model used before rewriting.',
        ['chat', 'vision'],
        OpenAIParameters,
        [],
        runOpenAI
    ),
    'gpt-4.1-nano': new Model(
        'gpt-4.1-nano',
        'openai',
        'an insanely fast and efficient model, though intelligence can be lacking at times. this is the default model.',
        ['chat', 'vision', 'functionCalling'],
        OpenAIParameters,
        [],
        runOpenAI
    ),
    'gpt-5-mini': new Model(
        'gpt-5-mini',
        'openai',
        'another quick-ish model (well, for a reasoning model at least), this time with reasoning tokens.',
        ['chat', 'vision', 'functionCalling', 'reasoning'],
        OpenAIParameters,
        [],
        runOpenAI
    ),
    'o3-mini': new Model(
        'o3-mini',
        'openai',
        'a small reasoning model, capable of handling more complex tasks than other models. this is MUCH slower than any other model, due to the reasoning requirements.',
        ['chat', 'vision', 'functionCalling'],
        OpenAIParameters,
        [],
        runOpenAI
    ),
    // grok
    'grok-3-mini-beta': new Model(
        'grok-3-mini-beta',
        'xai',
        'a model with comparable intelligence to gpt-4o-mini, but with no censorship. this model is also EXTREMELY slow, and due to the lack of internal censorship training it is not available to all users.',
        ['chat', 'vision', 'functionCalling'],
        OpenAIParameters.filter((param) => !(['presence_penalty', 'frequency_penalty'].includes(param.key))),
        ["440163494529073152", "406246384409378816", "726861364848492596", "436321340304392222", "1141928464946049065", "1162874217935675392"],
        runGrok
    ),
    // MISTRAL MODELS
    'mistral-small-latest': new Model(
        'mistral-small-latest',
        'mistral',
        'a fast and efficient small model from Mistral AI, capable of handling general chat tasks.',
        ['chat', 'vision', 'functionCalling'],
        OpenAIParameters.filter((param) => !(['presence_penalty', 'frequency_penalty'].includes(param.key))),
        [],
        runMistral
    ),
    'deepseek-r1': new Model(
        'deepseek-r1',
        'ollama',
        'An extremely powerful reasoning model. This model is also extremely slow due to the reasoning requirements.',
        ['chat', "reasoning"],
        [
            {
                key: 'temperature',
                description: 'Controls randomness in the output. Lower values make output more deterministic.',
                schema: z.float32("value must be a float / decimal number").
                    min(0, "value must be >= 0").
                    max(2, "value must be <= 2").
                    default(0.6),
            },
            {
                key: 'top_p',
                description: 'Controls diversity via nucleus sampling. Lower values make output more focused.',
                schema: z.float32("value must be a float / decimal number").
                    min(0, "value must be >= 0").
                    max(1, "value must be <= 1").
                    default(0.95),
            },
        ],
        [],
        runOllama
    ),
    'closex/neuraldaredevil-8b-abliterated': new Model(
        'closex/neuraldaredevil-8b-abliterated',
        'ollama',
        'a model designed for casual chat applications',
        ['chat'],
        [
            {
                key: 'num_ctx',
                description: 'The number of context tokens to use for the model.',
                schema: z.int("value must be an integer").
                    min(1, "value must be >= 1").
                    max(16384, "value must be <= 16384").
                    default(8192),
            },
            {
                key: 'temperature',
                description: 'Controls randomness in the output. Lower values make output more deterministic.',
                schema: z.float32("value must be a float / decimal number").
                    min(0, "value must be >= 0").
                    max(2, "value must be <= 2").
                    default(0.7),
            },
            {
                key: 'num_keep',
                description: 'The number of tokens to keep in the context.',
                schema: z.int("value must be an integer").
                    min(1, "value must be >= 1").
                    max(2048, "value must be <= 2048").
                    default(24),
            },
        ],
        [],
        runOllama
    ),
};
// #endregion