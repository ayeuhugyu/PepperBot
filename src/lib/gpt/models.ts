import grok from "./models/grok";
import mistral from "./models/mistral";
import ollama from "./models/ollama";
import openai from "./models/openai";
import { Model } from "./modelTypes";

export const models: Record<string, Model> = {};

openai.forEach((model) => models[model.name] = model);
ollama.forEach((model) => models[model.name] = model);
mistral.forEach((model) => models[model.name] = model);
grok.forEach((model) => models[model.name] = model);