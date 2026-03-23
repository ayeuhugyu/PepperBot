import z from "zod";
import { Tool, ToolErrorResponse, ToolSuccessResponse } from "../toolTypes";
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';

/*
"evaluate_luau": new Tool(
        new ToolData(
            'evaluate_luau',
            'evaluates a luau expression. this should only be used to automate complex tasks. MAKE ABSOLUTELY CERTAIN THAT YOU USE A PRINT STATEMENT! this just returns stdout, so if you don\'t print something, it won\'t be shown to you. If you are returned an error, fix it and try again (if possible). You do not have access to ROBLOX\'s \'task\' library, do not attempt to use it.',
            ToolType.Official,
            {
                "expression": { key: 'expression', description: 'luau expression to evaluate', type: 'string', required: true }
            },
            true // disabled by default
        ),
        async ({ expression }: { expression: string }) => {
            if (!expression.includes("print")) {
                return "ERROR: the expression must contain a print statement. please remember to print your output.";
            }
            try {
                const result = await runLuauScript(expression);
                return result.stdout || result.stderr || "No output returned.";
            } catch (err: any) {
                return `an error occurred while attempting to evaluate the expression: ${err.message || err}`;
            }
        }
    ),
*/

function runLuauScript(luauCode: string): Promise<{ stdout: string; stderr: string }> {
    const filePath = "cache/luau/" + Date.now() + ".luau";
    return new Promise((resolve, reject) => {
        try {
            // write to the file synchronously
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, luauCode);
            // create a promise that runs the luau script
            const child = execFile('lune', ['run', filePath], (error, stdout, stderr) => {
                if (error) {
                    reject(`error executing luau script: ${error}`);
                    return;
                }
                resolve({ stdout, stderr });
            });
            // set a timeout for 5 seconds
            const timeout = setTimeout(() => {
                child.kill();
                reject('script execution timed out; 5 second limit exceeded. this is likely due to an infinite loop somewhere in your code.');
            }, 5000);
            // clear the timeout if the script finishes in time
            child.on('exit', () => clearTimeout(timeout));
        } catch (err) {
            reject(`error writing file: ${err}`);
        }
    });
}

const parameters = {
    "expression": {
        key: "expression",
        description: "mathematical expression to evaluate",
        schema: z.string(),
    },
}

export default new Tool<typeof parameters, string>({
    name: "evaluate_luau",
    description: "evaluates a luau expression. this should only be used to automate complex tasks. MAKE ABSOLUTELY CERTAIN THAT YOU USE A PRINT STATEMENT! this just returns stdout, so if you don\'t print something, it won\'t be shown to you. If you are returned an error, fix it and try again (if possible). You do not have access to ROBLOX\'s \'task\' library, do not attempt to use it.",
    parameters,
    execute: async function({ expression }) {
        if (!expression.includes("print")) {
            return new ToolErrorResponse("the expression must contain a print statement. please remember to print your output.");
        }
        try {
            const result = await runLuauScript(expression);
            return new ToolSuccessResponse<string>(result.stdout || result.stderr || "[no output returned]");
        } catch (err: any) {
            return new ToolErrorResponse(`an error occurred while attempting to evaluate the expression: ${err.message || err}`);
        }
    }
});