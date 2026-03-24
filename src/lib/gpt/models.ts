import grok from "./models/grok-3-mini-beta";
import mistral from "./models/mistral-small-latest";
import deepseek from "./models/deepseek-r1";
import neuraldaredevilAbliterated from "./models/closex-neuraldaredevil-8b-abliterated";
import gpt35Turbo from "./models/gpt-3.5-turbo";
import gpt4oMini from "./models/gpt-4o-mini";
import gpt41Nano from "./models/gpt-4.1-nano";
import gpt5Mini from "./models/gpt-5-mini";
import o3mini from "./models/o3-mini";

export const models = {
    "gpt-4.1-nano": gpt41Nano,
    "gpt-5-mini": gpt5Mini,
    "o3-mini": o3mini,
    "gpt-4o-mini": gpt4oMini,
    "gpt-3.5-turbo": gpt35Turbo,
    "deepseek-r1": deepseek,
    "closex/neuraldaredevil-8b-abliterated": neuraldaredevilAbliterated,
    "mistral-small-latest": mistral,
    "grok-3-mini-beta": grok,
};

export type ModelName = keyof typeof models;