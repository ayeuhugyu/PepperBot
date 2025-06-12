import fs from "fs";

const adjectives = JSON.parse(fs.readFileSync("constants/parts_of_speech/adjectives.json", "utf-8"));
const nouns = JSON.parse(fs.readFileSync("constants/parts_of_speech/nouns.json", "utf-8"));

export function randomId() { // there is an extremely small chance that this will generate the same id twice, but it is so small that im just gonna ignore it
    const randomAdjectiveIndex = Math.floor(Math.random() * adjectives.length);
    const randomNounIndex = Math.floor(Math.random() * nouns.length);

    const adjective = adjectives[randomAdjectiveIndex];
    const noun = nouns[randomNounIndex];

    const now = Date.now().toString(16);
    const id = `${adjective}-${noun}-${now.slice(now.length - 5)}`;

    return id;
}