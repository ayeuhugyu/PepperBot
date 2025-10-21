import { config } from "dotenv";
config();
import * as thesaurus from "../src/lib/dictionary";

const word = "THIS WORD WILL NOT EXIST"
const data = await thesaurus.getThesaurusData(word);
if (!data) {
    console.log("No data found for the word");
    process.exit(1);
}
console.log(data);
const theData = typeof data[0] === "string" ? {
    id: word,
    stems: [],
    syns: [data],
    ants: [],
    offensive: false,
} as thesaurus.APIThesaurusData : data[0]?.meta;
const formattedData = new thesaurus.ThesaurusData(word, theData);

console.log(formattedData);