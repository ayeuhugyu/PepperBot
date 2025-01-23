import * as log from "./log.js";
import fs from "fs";
import fsextra from "fs-extra";



const defaultGuildConfig = JSON.parse(fs.readFileSync("resources/data/defaultGuildConfig.json"))
const guildConfigInformation = JSON.parse(fs.readFileSync("resources/data/guildConfigInformation.json"))

for (const key in defaultGuildConfig) {
    if (!guildConfigInformation[key]) {
        log.warn(`missing key in guildConfigInformation: ${key}`);
    }
}
for (const [key, value] of Object.entries(guildConfigInformation)) {
    if ((typeof value.type !== "undefined") && value.type == "array") {
        if (typeof value.arraytype === "undefined") {
            log.warn(`${key} in guildConfigInformation has type array, but is missing array values type specification.`)
        }
    }
    const requiredFields = ["type", "default", "cleanname", "description"];
    for (const field of requiredFields) {
        if (typeof value[field] === "undefined") {
            log.warn(`${key} in guildConfigInformation is missing ${field}`);
        }
    }
}

let guildConfigs = {};

async function createGuildConfig(guildId) {
    const path = `resources/data/guildConfigs/${guildId}.json`;
    guildConfigs[guildId] = JSON.parse(JSON.stringify(defaultGuildConfig)); // this just creates a clone so that guildConfigs[guildId] doesn't reference the default object
    await fsextra.outputFile(path, JSON.stringify(defaultGuildConfig, null, 4));
    log.info(`created guild config for ${guildId}`);
}

function getGuildConfig(guildId) {
    if (!guildConfigs[guildId]) {
        if (!fs.existsSync(`resources/data/guildConfigs/${guildId}.json`)) {
            return JSON.parse(JSON.stringify(defaultGuildConfig));
        }
        log.warn(`noncached guild config requested: ${guildId}`);
        const data = fs.readFileSync(`resources/data/guildConfigs/${guildId}.json`, "utf8");
        guildConfigs[guildId] = JSON.parse(data);
        return guildConfigs[guildId]
    }
    return guildConfigs[guildId];
}

function writeGuildConfig(guildId, config) {
    const usedConfig = config || guildConfigs[guildId];
    const path = `resources/data/guildConfigs/${guildId}.json`;
    fs.writeFileSync(
        path,
        JSON.stringify(usedConfig, null, 4),
    );
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
        log.info(`updating guild config for ${guildId}; ${missingKeys.length} missing keys, ${extraKeys.length} extra keys`);
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
    const start = performance.now();
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
            createGuildConfig(guild.id);
        }
    }
    log.info(`guild configurations cached in ${(performance.now() - start).toFixed(3)}ms`);
}
await getAllGuildConfigs();


export default {
    get: getGuildConfig,
    update: updateGuildConfig,
    checkOutdated: checkConfigIsOutdated,
    getAll: getAllGuildConfigs,
    write: writeGuildConfig,
    create: createGuildConfig,
    info: guildConfigInformation,
    default: defaultGuildConfig,
    configs: guildConfigs,
    // above are better names, but i kept below because i don't feel like changing the scripts that use it
    getGuildConfig,
    updateGuildConfig,
    checkConfigIsOutdated,
    getAllGuildConfigs,
    guildConfigs,
    defaultGuildConfig,
    writeGuildConfig,
    createGuildConfig,
    guildConfigInformation,
};
