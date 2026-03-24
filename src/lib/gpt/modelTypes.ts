import { ZodAnySchema, ZodInferSchema } from "../zodhelpers";
import type { OmitMethods } from "../omitMethods"

export type ModelCapabilities = 'chat' | 'vision' | 'videoVision' | 'functionCalling' | 'reasoning';

export interface ModelParameter {
    key: string;
    description: string;
    schema: ZodAnySchema;
}

export type InferModelParameters<P extends Record<string, ModelParameter>> = {
    [K in keyof P]: ZodInferSchema<P[K]['schema']>
};

export class Model<P extends Record<string, ModelParameter>> {
    name: string;
    provider: string;
    description: string;
    capabilities: ModelCapabilities[];
    parameters: P;
    whitelist?: string[];

    constructor(data: OmitMethods<Model<Record<string, ModelParameter>>>) {
        this.name = data.name;
        this.provider = data.provider;
        this.description = data.description;
        this.capabilities = data.capabilities;
        this.parameters = data.parameters as P;
        this.whitelist = data.whitelist;
    }

    filterParameters(params: Record<string, any>) {
        const paramsOutput: Record<string, any> = {};
        Object.values(this.parameters).forEach(param => {
            paramsOutput[param.key] = param.schema.safeParse(params[param.key] ?? undefined);
        });

        return paramsOutput;
    }
}