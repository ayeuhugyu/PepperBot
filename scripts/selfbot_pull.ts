
import * as fs from "fs";
import * as path from "path";
import shell from "shelljs";

shell.exec("git stash")

shell.exec("bun pull");

const directory = "src"; // specify your directory here
function processFile(filePath: string) {
    const content = fs.readFileSync(filePath, "utf8");
    const importRegex = /^import\s+{([^}]+)}\s+from\s+["']discord\.js["'];/m;
    const match = content.match(importRegex);
    if (match) {
        const imports = match[1].split(",").map(s => s.trim());
        if (imports.includes("Message")) {
            const newImports = imports.filter(i => i !== "Message");
            const before = content.substring(0, match.index!);
            const after = content.substring(match.index! + match[0].length);
            let newContent = before;
            if (newImports.length > 0) {
                newContent += `import { ${newImports.join(", ")} } from "discord.js";\n`;
            } else {
                newContent += "\n";
            }
            newContent += `import { Message } from "discord.js-selfbot-v13";` + after.replace("\n", "");  
            fs.writeFileSync(filePath, newContent, "utf8");
        }
    }
}
function traverseDir(dir: string) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith(".ts")) {
            processFile(fullPath);
        }
    });
}
traverseDir(directory);

shell.exec("git stash pop")