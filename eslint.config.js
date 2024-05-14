import globals from "globals";
import pluginJs from "@eslint/js";

export default [
    {
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            'no-unused-vars': 'off',
        } // idk why but for some reason this doesn't work, i'd use eslint but i have to disable it cuz of this otherwise theres 400000000 errors (and me personally, i like unused vars. makes it easier for me to read. so idc what yall think.)
    },
    pluginJs.configs.recommended,
];
