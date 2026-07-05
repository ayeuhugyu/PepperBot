import { Models } from "../src/lib/gpt/models";

Object.values(Models).forEach(m => {
    console.log(m.serialize());
});