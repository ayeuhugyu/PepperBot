import { inspect } from "util";
import { formatTool } from "../src/lib/gpt/runners/openaiRunner";
import { tools } from "../src/lib/gpt/tools";

console.log(inspect(formatTool(tools["request_url"]), { colors: true, depth: Infinity }));