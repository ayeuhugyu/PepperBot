import fs, { stat } from "fs";
import default_embed from "./default_embed.js";
import * as log from "./log.js";

const start = performance.now();

let statistics = await JSON.parse(
    fs.readFileSync(`resources/data/statistics.json`, "utf-8")
);

export default {
    statistics: statistics,
    async writeStatistics() {
        return new Promise((resolve, reject) => {
            fs.writeFile(
                `resources/data/statistics.json`,
                JSON.stringify(statistics, null, 2),
                () => {}
            );
            resolve();
        });
    },
    async recacheStatistics() {
        return new Promise((resolve, reject) => {
            this.statistics = JSON.parse(
                fs.readFileSync(`resources/data/statistics.json`, "utf-8")
            );
            statistics = this.statistics;
            resolve();
        });
    },
    async logCommandUsage(commandName, executionTime) {
        return new Promise((resolve, reject) => {
            if (statistics.commandUsage) {
                if (statistics.commandUsage[commandName]) {
                    statistics.commandUsage[commandName]++;
                } else {
                    statistics.commandUsage[commandName] = 1;
                }
            } else {
                log.warn(`commandUsage missing from statistics; likely old version`);
            }
            if (statistics.hourlyUsage) {
                const date = new Date();
                const hour = date.getHours();
                if (statistics.hourlyUsage[hour]) {
                    statistics.hourlyUsage[hour]++;
                } else {
                    statistics.hourlyUsage[hour] = 1;
                }
            } else {
                log.warn(`hourlyUsage missing from statistics; likely old version`);
            }
            if (statistics.executionTime) {
                if (statistics.executionTime[commandName]) {
                    statistics.executionTime[commandName].push(executionTime);
                } else {
                    statistics.executionTime[commandName] = [executionTime];
                }
            } else {
                log.warn(`executionTime missing from statistics; likely old version`);
            }
            this.writeStatistics();
            resolve();
        });
    },
    async addGptStat(amount) {
        return new Promise((resolve, reject) => {
            if (!statistics.gpt) {
                statistics.gpt = 0;
            }
            statistics.gpt += amount;
            this.writeStatistics();
            resolve();
        });
    }
};

log.info(`cached statistics in ${(performance.now() - start).toFixed(3)}ms`);
