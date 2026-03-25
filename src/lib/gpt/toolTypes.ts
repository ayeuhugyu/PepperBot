import { ZodType } from "zod";
import { ZodAnySchema, ZodInferSchema } from "../zodhelpers";

export enum ToolType {
    Official = 'official',
    User = 'user'
}

export class BaseTool {
    name: string;
    description: string;

    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }
}

export interface CustomToolParameter { // all are strings; user can input whatever they want and the AI should simply be able to parse it.
    key: string;
    description: string;
    type: string;
    required?: boolean;
    default?: string;
}

export class CustomTool extends BaseTool {
    readonly type = ToolType.User
    parameters: Record<string, CustomToolParameter> = {};

    constructor(data: { name: string, description: string, parameters: Record<string, CustomToolParameter> }) {
        super(data.name, data.description);
        this.parameters = data.parameters;
    }
}

export type ToolFunction<A, R> = (args: A) => Promise<ToolResponse<R>> | ToolResponse<R>;

export interface ToolParameter {
    key: string,
    description: string,
    schema: ZodAnySchema
}

type InferParameters<A extends Record<string, ToolParameter>> = {
    [K in keyof A]: ZodInferSchema<A[K]['schema']>
};

export class Tool<A extends Record<string, ToolParameter>, R> extends BaseTool {
    readonly type = ToolType.Official
    parameters: A;
    execute: ToolFunction<InferParameters<A>, R>;

    constructor(data: { name: string, description: string, parameters: A, execute: ToolFunction<InferParameters<A>, R> }) {
        super(data.name, data.description);
        this.parameters = data.parameters;
        this.execute = data.execute;
    }
}

export type AnyTool = Tool<Record<string, ToolParameter>, any>;

export class ToolSuccessResponse<T> {
    success = true;
    data: T;
    error = undefined;

    constructor(data: T) {
        this.data = data;
    }
}

export class ToolErrorResponse {
    success = false;
    data = undefined;
    error: string;

    constructor(error: string) {
        this.error = error;
    }
}

export type ToolResponse<T> = ToolSuccessResponse<T> | ToolErrorResponse;