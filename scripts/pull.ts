import * as shell from 'shelljs';
import * as os from 'os';

const isWindows = os.platform() === 'win32';

const script = isWindows ? 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe scripts\\pull.ps1' : 'chmod +x ./scripts/pull.sh && ./scripts/pull.sh';

const result = shell.exec(script)

if (result.code !== 0 && result.code !== 1) {
    console.error(`Failed to execute ${script}`);
    process.exit(result.code);
} else {
    console.log(`${script} executed successfully.`);
}