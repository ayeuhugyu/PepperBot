import globals from "globals";
import pluginJs from "@eslint/js";

export default [
    pluginJs.configs.recommended,
    {
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                ecmaVersion: "latest",
            },
        },
        rules: {
            "no-unused-vars": "off",
            "no-async-promise-executor": "off",
        },
    },
];
