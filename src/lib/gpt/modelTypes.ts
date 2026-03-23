import { ZodAnySchema } from "../zodhelpers";
import type { OmitMethods } from "../omitMethods"

export type ModelCapabilities = 'chat' | 'vision' | 'videoVision' | 'functionCalling' | 'reasoning';

export interface ModelParameter {
    key: string;
    description: string;
    schema: ZodAnySchema;
}

export class Model {
    name: string;
    provider: string;
    description: string;
    capabilities: ModelCapabilities[];
    parameters: ModelParameter[];
    whitelist?: string[];

    constructor(data: OmitMethods<Model>) {
        this.name = data.name;
        this.provider = data.provider;
        this.description = data.description;
        this.capabilities = data.capabilities;
        this.parameters = data.parameters;
        this.whitelist = data.whitelist;
    }

    filterParameters(params: Record<string, any>) {
        const paramsOutput: Record<string, any> = {};
        this.parameters.forEach(param => {
            paramsOutput[param.key] = param.schema.safeParse(params[param.key] ?? undefined);
        });

        return paramsOutput;
    }
}