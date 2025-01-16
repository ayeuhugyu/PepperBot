import fs, { stat } from "fs";
import * as log from "./log.js";

const start = performance.now();

let statistics
try {
    statistics = await JSON.parse(
        fs.readFileSync(`resources/data/statistics.json`, "utf-8")
    );
} catch (err) {
    statistics = {}
    log.warn(`Failed to read statistics.json: ${err}`)
}

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
            if (!statistics.timedGpt) {
                statistics.timedGpt = {};
            }
            statistics.gpt += amount;
            const currentHour = new Date().getHours();
            if (!statistics.timedGpt[currentHour]) {
                statistics.timedGpt[currentHour] = 0;
            }
            statistics.timedGpt[currentHour] += amount;
            this.writeStatistics();
            resolve();
        });
    },
    async addCommandTypeStat(type) {
        return new Promise((resolve, reject) => {
            if (!statistics.commandTypeUsage) {
                statistics.commandTypeUsage = {};
            }
            if (statistics.commandTypeUsage[type]) {
                statistics.commandTypeUsage[type]++;
            } else {
                statistics.commandTypeUsage[type] = 1;
            }
            this.writeStatistics();
            resolve();
        });
    },
    async addRequestCountStat() {
        return new Promise((resolve, reject) => {
            if (!statistics.requestCount) {
                statistics.requestCount = 12777; // last recorded request count, its been writing NaN this whole time.
            }
            statistics.requestCount++;
            this.writeStatistics();
            resolve();
        });
    }
};

log.info(`cached statistics in ${(performance.now() - start).toFixed(3)}ms`);
