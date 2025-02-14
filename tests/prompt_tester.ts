import { writePrompt, Prompt } from "../src/lib/prompt_manager";

console.log(await writePrompt(new Prompt({
    name: "test2",
    description: "Torvald Tabletop Prompter",
    content: "jorrybottle",
    author_id: "test",
    author_username: "Linus Torvalds",
})));