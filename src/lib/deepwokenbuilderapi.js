import * as util from "util"
import fs from "fs"
import { version } from "os";

//const response = await fetch("https://api.deepwoken.co/build?id=Ptg9FroR", { method: "GET" });
//const JSONresponse = await response.json();

export async function fetchBuild(buildID) {
    const response = await fetch(`https://api.deepwoken.co/build?id=${buildID}`, { method: "GET" });
    return await response.json();
}

export function buildReformatter(build) {
    let data = {
        meta: {
            title: build.stats.buildName,
            description: build.stats.buildDescription,
            author: build.stats.buildAuthor,
            origin: build.stats.meta.Origin,
            oath: build.stats.meta.Oath,
            outfit: build.stats.meta.Outfit,
            race: build.stats.meta.Race,
            murmur: build.stats.meta.Murmur,
            resonance: build.stats.meta.Bell,
        },
        traits: {
            available: build.stats.traitsPoints,
            spent: {
                proficiency: build.stats.traits.Proficiency,
                erudition: build.stats.traits.Erudition,
                songchant: build.stats.traits.Songchant,
                vitality: build.stats.traits.Vitality
            }
        },
        boons: [],
        flaws: [],
        mantras: {},
        stats: {
            preshrine: build.preShrine,
            postshrine: build.postShrine || build.attributes,
        },
        mantras: build.mantraModifications,
        notes: build.notes,
        talents: build.talents,
        favoritedTalents: build.favoritedTalents,
        weapon: build.weapons,
        version: build.version
    }
    data.boons = [build.stats.boon1, build.stats.boon2].filter(item => item !== "None");
    data.flaws = [build.stats.flaw1, build.stats.flaw2].filter(item => item !== "None");
    return data;
}

export function cleanBuildToHumanReadable(build) {
    if (!build) return;
    if (!build.preshrine) {
        build.preshrine = build.postshrine;
    }
    let pages = [
        {
            title: "Meta, Traits & Mantras",
            description: `Name: ${build.meta.title}\nDescription: ${build.meta.description}\nAuthor: ${build.meta.author}\nOrigin: ${build.meta.origin}\nOath: ${build.meta.oath}\nOutfit: ${build.meta.outfit}\nRace: ${build.meta.race}\nMurmur: ${build.meta.murmur}\nResonance: ${build.meta.resonance}\nWeapon: ${build.weapon}`,
            fields: [
                {
                    name: "Traits",
                    value: `Available Points: ${build.traits.available}\nProficiency: ${build.traits.spent.proficiency}\nErudition: ${build.traits.spent.erudition}\nSongchant: ${build.traits.spent.songchant}\nVitality: ${build.traits.spent.vitality}`,
                    inline: true
                },
                {
                    name: "Mantras",
                    value: Object.entries(build.mantras).map(([key, value]) => `${key}`).join("\n") || "None",
                    inline: true
                },
            ]
        },
        {
            title: "Boons & Flaws",
            fields: [
                {
                    name: "Boons",
                    value: build.boons.join("\n") || "None"
                },
                {
                    name: "Flaws",
                    value: build.flaws.join("\n") || "None"
                }
            ]
        },
        {
            title: "Pre-Shrine Stats",
            fields: [
                {
                    name: "Base",
                    value: Object.entries(build.stats.preshrine.base).map(([key, value]) => `${key}: ${value}`).join("\n"),
                    inline: true
                },
                {
                    name: "Attunement",
                    value: Object.entries(build.stats.preshrine.attunement).map(([key, value]) => `${key}: ${value}`).join("\n"),
                    inline: true
                },
                {
                    name: "Weapon",
                    value: Object.entries(build.stats.preshrine.weapon).map(([key, value]) => `${key}: ${value}`).join("\n"),
                    inline: true
                }
            ]
        },
        {
            title: "Post-Shrine Stats",
            fields: [
                {
                    name: "Base",
                    value: Object.entries(build.stats.postshrine.base).map(([key, value]) => `${key}: ${value}`).join("\n"),
                    inline: true
                },
                {
                    name: "Attunement",
                    value: Object.entries(build.stats.postshrine.attunement).map(([key, value]) => `${key}: ${value}`).join("\n"),
                    inline: true
                },
                {
                    name: "Weapon",
                    value: Object.entries(build.stats.postshrine.weapon).map(([key, value]) => `${key}: ${value}`).join("\n"),
                    inline: true
                }
            ]
        },
    ];
    return pages;
}

//console.log(util.inspect(cleanBuildToHumanReadable(buildReformatter(JSONresponse.content)), { depth: Infinity, colors: true }));

//fs.writeFileSync("./testUtils/apiresult.json", JSON.stringify(JSONresponse, null, 2));

//console.log(await fetchBuild("3PHUgBai"))