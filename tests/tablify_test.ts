import { tablify } from "../src/lib/string_helpers";

const table = [
    ["Alice", "30", "New York"],
    ["Bob", "25", "Los Angeles"],
    ["Charlie", "35", "Chicago"],
    ["David", "28"],
    ["Eve"],
    ["Frank", "40", "Houston"],
    ["Grace", "22", "Phoenix"],
]

const columns = ["Name", "Age", "City"];

console.log(tablify(columns, table));