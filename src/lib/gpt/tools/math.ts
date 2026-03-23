import z from "zod";
import { Tool, ToolErrorResponse, ToolSuccessResponse } from "../toolTypes";
import * as mathjs from 'mathjs';

const parameters = {
    "expression": {
        key: "expression",
        description: "mathematical expression to evaluate",
        schema: z.string(),
    },
}

export default new Tool<typeof parameters, any>({
    name: "math",
    description: "evaluates a mathematical expression. supports most math functions, it just gets plugged directly into mathjs.evaluate(). this should only be used when you must use math.",
    parameters,
    execute: function({ expression }) {
        try {
            return new ToolSuccessResponse<any>(mathjs.evaluate(expression));
        } catch (err: any) {
            return new ToolErrorResponse(`error evaluating expression: ${err.message}`);
        }
    }
});