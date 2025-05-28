// #region Class Definitions

export type ModelProvider = 'openai' | 'xai'
export type ModelName = 'gpt-3.5-turbo' | 'gpt-4o-mini' | 'gpt-4.1-nano' | 'o3-mini' | 'grok-3-mini-beta'
export type ModelCapabilities = 'chat' | 'vision' | 'videoVision' | 'functionCalling'

export interface ModelParameter {
    key: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    restrictions?: {
        min?: number;
        max?: number;
        enum?: string[];
        pattern?: RegExp;
        required?: boolean;
    }
    default?: string | number | boolean | object | any[];
}

export class Model {
    public name: ModelName;
    public provider: ModelProvider;
    public description: string;
    public capabilities: ModelCapabilities[];
    public parameters?: ModelParameter[];
    public whitelist?: string[];

    constructor(name: ModelName, provider: ModelProvider, description: string, capabilities: ModelCapabilities[], parameters?: ModelParameter[], whitelist?: string[]) {
        this.name = name;
        this.provider = provider;
        this.description = description;
        this.capabilities = capabilities;
        this.whitelist = whitelist;

        if (parameters) {
            for (const param of parameters) {
                if (param.restrictions) {
                    // min/max only valid for number
                    if ((param.restrictions.min !== undefined || param.restrictions.max !== undefined) && param.type !== 'number') {
                        throw new Error(`Parameter "${param.key}": min/max restrictions can only be applied to type "number".`);
                    }
                    // pattern only valid for string
                    if (param.restrictions.pattern !== undefined && param.type !== 'string') {
                        throw new Error(`Parameter "${param.key}": pattern restriction can only be applied to type "string".`);
                    }
                    // enum only valid for string or number
                    if (param.restrictions.enum !== undefined && !(param.type === 'string' || param.type === 'number')) {
                        throw new Error(`Parameter "${param.key}": enum restriction can only be applied to type "string" or "number".`);
                    }
                }
            }
        }

        this.parameters = parameters;
    }
}

// #endregion
// #region Common Parameters

const OpenAIParameters: ModelParameter[] = [
    {
        key: 'temperature',
        description: 'Controls randomness in the output. Lower values make output more deterministic.',
        type: 'number',
        restrictions: {
            min: 0,
            max: 2,
        },
        default: 1,
    },
    {
        key: 'top_p',
        description: 'Controls diversity via nucleus sampling. Lower values make output more focused.',
        type: 'number',
        restrictions: {
            min: 0,
            max: 1,
        },
        default: 1,
    },
    {
        key: 'max_tokens',
        description: 'Maximum number of tokens in the output.',
        type: 'number',
        restrictions: {
            min: 1,
            max: 4096,
        },
        default: 4096,
    },
    {
        key: 'presence_penalty',
        description: 'Penalizes new tokens based on whether they appear in the text so far.',
        type: 'number',
        restrictions: {
            min: -2,
            max: 2,
        },
        default: 0,
    },
    {
        key: 'frequency_penalty',
        description: 'Penalizes new tokens based on their existing frequency in the text so far.',
        type: 'number',
        restrictions: {
            min: -2,
            max: 2,
        },
        default: 0,
    }
];

// #endregion
// #region Model Definitions

export const Models: Record<ModelName, Model> = {
    'gpt-3.5-turbo': new Model(
        'gpt-3.5-turbo',
        'openai',
        'a significantly older model, not recommended for use. this is here for historical purposes.',
        ['chat'],
        OpenAIParameters
    ),
    'gpt-4o-mini': new Model(
        'gpt-4o-mini',
        'openai',
        'slightly more intelligant than 4.1-nano, but much, much slower. this is the model used before rewriting.',
        ['chat', 'vision'],
        OpenAIParameters
    ),
    'gpt-4.1-nano': new Model(
        'gpt-4.1-nano',
        'openai',
        'an insanely fast and efficient model, though intelligence can be lacking at times. this is the default model.',
        ['chat', 'vision', 'functionCalling'],
        OpenAIParameters
    ),
    'o3-mini': new Model(
        'o3-mini',
        'xai',
        'a small reasoning model, capable of handling more complex tasks than other models. this is MUCH slower than any other model, due to the reasoning requirements.',
        ['chat', 'vision', 'functionCalling'],
        OpenAIParameters
    ),
    'grok-3-mini-beta': new Model(
        'grok-3-mini-beta',
        'xai',
        'a model with comparable intelligence to gpt-4o-mini, but with no censorship. this model is also EXTREMELY slow, and due to the lack of internal censorship training it is not available to all users.',
        ['chat', 'vision', 'functionCalling'],
        OpenAIParameters.filter((param) => !(['presence_penalty', 'frequency_penalty'].includes(param.key))),
        ["440163494529073152", "406246384409378816", "726861364848492596", "436321340304392222", "1141928464946049065", "1162874217935675392"]
    ),
};