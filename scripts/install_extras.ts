import { execSync } from 'child_process';
import { platform } from 'os';
import { chmodSync } from 'fs';

const isWindows = platform() === 'win32';

try {
    if (isWindows) {
        console.log('Detected Windows OS. Running PowerShell script...');
        execSync('powershell.exe -File scripts/install_extras.ps1', { stdio: 'inherit' });
    } else {
        console.log('Detected non-Windows OS. Running shell script...');
        chmodSync('scripts/install_extras.sh', 0o755); // Ensure the script is executable
        execSync('./scripts/install_extras.sh', { stdio: 'inherit' });
    }
} catch (error) {
    console.error('An error occurred while running the script:', error);
    process.exit(1);
}