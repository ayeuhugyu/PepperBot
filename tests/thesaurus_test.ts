import { config } from "dotenv";
config();
import * as thesaurus from "../src/lib/dictionary";

const word = "kill"
let data = await thesaurus.getThesaurusData(word);
if (!data) {
    console.log("No data found for the word");
    process.exit(1);
}
console.log(data);
const formattedData = new thesaurus.ThesaurusData(word, data);

console.log(formattedData);