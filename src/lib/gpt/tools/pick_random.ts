import z from "zod";
import { Tool, ToolErrorResponse, ToolSuccessResponse } from "../toolTypes";

const parameters = {
    "items": {
        key: "items",
        description: "list of items to choose from",
        schema: z.array(z.string()).min(2, "must contain at least 2 items"),
    },
}

export default new Tool<typeof parameters, string>({
    name: "pick_random",
    description: "evaluates a mathematical expression. supports most math functions, it just gets plugged directly into mathjs.evaluate(). this should only be used when you must use math.",
    parameters,
    execute: function({ items }) {
        return new ToolSuccessResponse<string>(items[Math.floor(Math.random() * items.length)]);
    }
});