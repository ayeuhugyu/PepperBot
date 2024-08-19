import fs from "fs";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

export default {
    name: "messageDelete",
    async execute(message) {
        // in the future, i may use this to remove messages from the p/markov log. thats the only reason why it still exists.
    },
};
