import * as log from "./log.js";
import fs, { write } from "fs";
import fsextra from "fs-extra";

const start = performance.now();

const defaultGuildConfig = {
    disabledCommands: [],
    exploreVisible: true,
};

let guildConfigs = {};

function getGuildConfig(guildId) {
    if (!guildConfigs[guildId]) {
        log.warn(`nonexistent guild config requested: ${guildId}`);
        return;
    }
    return guildConfigs[guildId];
}

function writeGuildConfig(guildId) {
    const path = `resources/data/guildConfigs/${guildId}.json`;
    fs.writeFileSync(path, JSON.stringify(guildConfigs[guildId], null, 4));
    return guildConfigs[guildId];
}

function updateGuildConfig(guildId) {
    const gconfig = getGuildConfig(guildId);
    if (!gconfig) {
        log.warn("attempted to update nonexistent guild config");
        return;
    }
    const defaultKeys = Object.keys(defaultGuildConfig);
    const configKeys = Object.keys(gconfig);

    const missingKeys = defaultKeys.filter((key) => !configKeys.includes(key));
    const extraKeys = configKeys.filter((key) => !defaultKeys.includes(key));

    if (missingKeys.length > 0) {
        for (const key of missingKeys) {
            gconfig[key] = defaultGuildConfig[key];
        }
    }
    if (extraKeys.length > 0) {
        for (const key of extraKeys) {
            delete gconfig[key];
        }
    }
    const path = `resources/data/guildConfigs/${guildId}.json`;
    fs.writeFileSync(path, JSON.stringify(gconfig, null, 4));
    if (missingKeys.length > 0 || extraKeys.length > 0) {
        log.info(
            `updated guild config for ${guildId}; ${missingKeys.length} missing keys, ${extraKeys.length} extra keys`
        );
    }
}

function checkConfigIsOutdated(guildId) {
    const gconfig = getGuildConfig(guildId);
    if (!gconfig) {
        log.warn("attempted to check outdatedness of nonexistent guild config");
        return true;
    }
    const defaultKeys = Object.keys(defaultGuildConfig);
    const configKeys = Object.keys(gconfig);

    const missingKeys = defaultKeys.filter((key) => !configKeys.includes(key));
    const extraKeys = configKeys.filter((key) => !defaultKeys.includes(key));

    if (missingKeys.length > 0 || extraKeys.length > 0) {
        return true;
    } else {
        return false;
    }
}

async function getAllGuildConfigs() {
    const index = await import("../bot.js");
    const client = index.client;
    const guilds = client.guilds.cache;
    for (const [guildId, guild] of guilds) {
        const path = `resources/data/guildConfigs/${guildId}.json`;
        if (fs.existsSync(path)) {
            const data = fs.readFileSync(path, "utf8");
            guildConfigs[guildId] = JSON.parse(data);
            if (checkConfigIsOutdated(guildId)) {
                updateGuildConfig(guildId);
            }
        } else {
            guildConfigs[guildId] = JSON.parse(
                JSON.stringify(defaultGuildConfig)
            ); // this just creates a clone so that guildConfigs[guildId] doesn't reference the default object
            await fsextra.outputFile(
                path,
                JSON.stringify(defaultGuildConfig, null, 4)
            );
            log.info(`created missing guild config for ${guild.id}`);
        }
    }
}
await getAllGuildConfigs();
log.info(
    `guild configurations cached in ${(performance.now() - start).toFixed(3)}ms`
);

export default {
    getGuildConfig,
    updateGuildConfig,
    checkConfigIsOutdated,
    getAllGuildConfigs,
    guildConfigs,
    defaultGuildConfig,
    writeGuildConfig,
};
