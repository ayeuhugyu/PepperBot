// import evaluate_luau from "./tools/evaluate_luau";
import math from "./tools/math";
import pick_random from "./tools/pick_random";
import request_raw_url from "./tools/request_raw_url";
import request_url from "./tools/request_url";
import search from "./tools/search";

export const tools = {
    // "evaluate_luau": evaluate_luau,
    "math": math,
    "pick_random": pick_random,
    "request_raw_url": request_raw_url,
    "request_url": request_url,
    "search": search,
}

export type ToolName = keyof typeof tools
