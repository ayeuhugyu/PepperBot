import fs, { stat } from "fs";
import default_embed from "./default_embed.js";

const statistics = JSON.parse(
    fs.readFileSync(`resources/data/statistics.json`, "utf-8")
);

export default {
    statistics: statistics,
    async addCommandStat(stat, amount) {
        return new Promise((resolve, reject) => {
            if (!statistics["Command Usage"]) {
                statistics["Command Usage"] = {};
            }
            if (!statistics["Command Usage"][stat]) {
                statistics["Command Usage"][stat] = 0;
            }
            statistics["Command Usage"][stat] += amount;
            fs.writeFileSync(
                `resources/data/statistics.json`,
                JSON.stringify(statistics, null, 2)
            );
            resolve();
        });
    },
    async addGptStat(amount) {
        return new Promise((resolve, reject) => {
            if (!statistics["GPT Messages"]) {
                statistics["GPT Messages"] = 0;
            }
            statistics["GPT Messages"] += amount;
            fs.writeFileSync(
                `resources/data/statistics.json`,
                JSON.stringify(statistics, null, 2)
            );
            resolve();
        });
    },
    async toEmbed() {
        const embed = await default_embed().setTitle("Statistics");
        let text = `GPT messages: ${statistics["GPT Messages"]}\ncommand usage:\n\n`;
        for (const stat in statistics["Command Usage"]) {
            text += `p/${stat}: ${statistics["Command Usage"][stat]}\n`;
        }
        embed.setDescription(text);
        return embed;
    },
};
