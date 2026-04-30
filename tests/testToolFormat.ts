import { inspect } from "util";
import { formatTool } from "../src/lib/gpt/runners/openaiRunner";
import { tools } from "../src/lib/gpt/tools";
import { CustomTool } from "../src/lib/gpt/toolTypes";

console.log(inspect(formatTool(tools["request_url"]), { colors: true, depth: Infinity }));
console.log(inspect(formatTool(tools["pick_random"]), { colors: true, depth: Infinity }));
console.log(inspect(formatTool(new CustomTool({
    name: "my tool",
    description: "that does some stuff",
    parameters: {
        input: {
            key: "input",
            description: "the input",
            type: "string",
            default: "something",
            required: true,
        }
    }
})), { colors: true, depth: Infinity }))