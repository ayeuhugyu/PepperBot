import fs from "fs";
import { execFile } from 'child_process';
import path from 'path';
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
                reject('Script execution timed out');
            }, 5000);
            // clear the timeout if the script finishes in time
            child.on('exit', () => clearTimeout(timeout));
        } catch (err) {
            reject(`error writing file: ${err}`);
        }
    });
}
// example usage
const luauCode = `
print("Hello from Luau")
`;
console.log(await runLuauScript(luauCode));