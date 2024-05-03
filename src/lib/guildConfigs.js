import * as log from "./log.js";
import fs from "fs";
import fsextra from "fs-extra";

let guildConfigs = {};
async function getAllGuildConfigs() {
    const guildFiles = fs
        .readdirSync("resources/data/guildConfigs")
        .filter((file) => file.endsWith(".json"));
    for (const file of guildFiles) {
        const config = JSON.parse(
            fs.readFileSync(`resources/data/guildConfigs/${file}`)
        );
        guildConfigs[config.guildId] = config;
    }
}
getAllGuildConfigs();
log.debug("guild configurations cached");

const defaultGuildConfig = {
    guildId: "discord.guild.id",
    prefix: "p/",
    functions: {
        exploreVisible: true,
        gptEnabled: true,
        voiceEnabled: true,
        diabolicalEventsEnabled: true,
        imageCommandsEnabled: true,
        otherEnabled: true,
        chatCommandsEnabled: true,
    },
};

async function createGuildConfig(guildId) {
    const config = defaultGuildConfig;
    config.guildId = guildId;
    await fsextra.ensureFileSync(`resources/data/guildConfigs/${guildId}.json`);
    await fs.writeFileSync(
        `resources/data/guildConfigs/${guildId}.json`,
        JSON.stringify(config, null, 2)
    );
    guildConfigs[guildId] = config;
    return config;
}

async function getGuildConfigFromFile(guildId) {
    const files = fs
        .readdirSync("resources/data/guildConfigs")
        .filter((file) => file.endsWith(".json"));
    if (files.includes(`${guildId}.json`)) {
        return JSON.parse(fs.readFileSync(`.././${guildId}.json`));
    } else {
        log.warn(
            `guild config ${guildId} does not exist, so one will be created for it`
        );
        return await createGuildConfig(guildId);
    }
}

export default {
    guildConfigs: guildConfigs,
    defaultConfig: defaultGuildConfig,
    async addGuildConfig(guildId, config) {
        guildConfigs[guildId] = config;
        await fs.writeFileSync(
            `.././resources/data/guildConfigs/${guildId}.json`,
            JSON.stringify(config, null, 2)
        );
        return guildCOnfigs[guildId];
    },
    refresh: getAllGuildConfigs,
    async getGuildConfig(guildId) {
        if (!guildConfigs[guildId]) {
            log.warn(
                `guild config ${guildId} is not currently cached at this time, looking for it in directory`
            );
            const config = await getGuildConfigFromFile(guildId);
            if (config) {
                guildConfigs[guildId] = config;
            } else {
                log.error(`guild config ${guildId} not found`);
                return undefined;
            }
        }
        return guildConfigs[guildId];
    },
    createConfig: createGuildConfig,
};
