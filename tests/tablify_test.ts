import { tablify } from "../src/lib/string_helpers";

const table = [
    ["Alice", "30", "New York"],
    ["Bob", "25", "Los Angeles"],
    ["Charlie", "35", "Chicago"]
]

const columns = ["Name", "Age", "City"];

console.log(tablify(columns, table));