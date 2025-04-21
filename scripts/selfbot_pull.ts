
import * as fs from "fs";
import * as path from "path";
import shell from "shelljs";

shell.exec("git reset --hard")
shell.exec("bun pull");
shell.exec("bun install discord.js-selfbot-v13");

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

const mainFileContent = `import { Client } from 'discord.js-selfbot-v13';
import { config } from 'dotenv';
import * as log from './lib/log';
import { Theme, getThemeEmoji } from './lib/theme';
import fs from "fs";
import { listen } from './web/index';
config();

export const client = new Client();

const eventFiles = fs
    .readdirSync("src/events")
for (const file of eventFiles) {
    (async () => {
        const event = await import(\`./events/\${file}\`);
        client.on(event.default.name, event.default.execute);
    })();
}

client.once('ready', async () => {
    log.info(\`logged in as \${client.user?.tag}\`);

    // web server starting has been moved to index.ts because in here it would start one for every single shard

    const channel = await client.channels.fetch("1312566483569741896").catch(() => {});
    if (channel) {
        if ('send' in channel) {
            channel.send(\`it's pepper time \${getThemeEmoji(Theme.CURRENT)}\`);
        }
    }
});

async function init() {
    log.info("logging into discord...");
    try {
        await client.login(process.env.DISCORD_TOKEN);
        client.user?.setActivity("pepper whisperers.", { type: "LISTENING" });
    } catch (err) {
        log.error("failed to login into discord. wifi down? token invalid?");
        log.error(err);
        process.exit(1);
    }
}
await init();
process.env.DISCORD_CLIENT_ID = client.user?.id || "0";
//await listen(client);

process.on("warning", log.warn);
["unhandledRejection", "uncaughtException"].forEach((event) => {
    process.on(event, (err) => {
        log.fatal(\`[PEPPERCRITICAL] bot.ts errored on \${event}: \`);
        log.fatal(err);
        console.error(err) // incase of the stupid fucking combined error bullshit discordjs returns for embed errors
        process.exit(1);
    });
})`

fs.writeFileSync("src/bot.ts", mainFileContent, "utf8");