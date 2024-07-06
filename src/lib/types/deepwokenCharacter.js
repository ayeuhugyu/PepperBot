import * as log from "../log.js";
import fs from "node:fs";
import * as globals from "../globals.js";

export const races = {
    Capra: "Capra",
    Ganymede: "Ganymede",
    Tiran: "Tiran",
    Chrysid: "Chrysid",
    Vesperian: "Vesperian",
    Felinor: "Felinor",
    Khan: "Khan",
    Gremor: "Gremor",
    Canor: "Canor",
    Adret: "Adret",
    Celtor: "Celtor",
    Etrean: "Etrean",
};
export const raceRollWeight = {
    Capra: 0.022,
    Ganymede: 0.022,
    Tiran: 0.022,
    Chrysid: 0.044,
    Vesperian: 0.067,
    Felinor: 0.089,
    Khan: 0.089,
    Gremor: 0.133,
    Canor: 0.156,
    Adret: 0.178,
    Celtor: 0.178,
    Etrean: 0.178,
};
export const raceVariants = {
    Capra: {
        Jurik: "Jurik",
        Nemit: "Nemit",
        Ku: "Ku",
        Hallowtide: "Hallowtide",
    },
    Ganymede: {
        Enceladus: "Enceladus",
        Hyperion: "Hyperion",
        Tethys: "Tethys",
        Titan: "Titan",
        Hallowtide: "Hallowtide",
    },
    Tiran: {
        Canary: "Canary",
        Crow: "Crow",
        Jay: "Jay",
        Cardinal: "Cardinal",
        Hallowtide: "Hallowtide",
    },
    Chrysid: {
        Hierophant: "Hierophant",
        Devout: "Devout",
        Seer: "Seer",
        Adept: "Adept",
        Hallowtide: "Hallowtide",
    },
    Vesperian: {
        Plackbart: "Plackbart",
        Sabaton: "Sabaton",
        Besague: "Besague",
        Hallowtide: "Hallowtide",
    },
    Felinor: {
        Leopard: "Leopard",
        Lynx: "Lynx",
        Panther: "Panther",
        Sphynx: "Sphynx",
        Hallowtide: "Hallowtide",
    },
    Khan: {
        Tamarin: "Tamarin",
        Capuchin: "Capuchin",
        Albino: "Albino",
        Silverback: "Silverback",
        Hallowtide: "Hallowtide",
    },
    Gremor: {
        Birch: "Birch",
        Cedar: "Cedar",
        Redwood: "Redwood",
        Aspen: "Aspen",
        Teak: "Teak",
        Hallowtide: "Hallowtide",
    },
    Canor: {
        River: "River",
        Red: "Red",
        Lion: "Lion",
        Interior: "Interior",
        Steppe: "Steppe",
        Hallowtide: "Hallowtide",
    },
    Adret: {
        Alder: "Alder",
        Greymarch: "Greymarch",
        Salt: "Salt",
        Seeker: "Seeker",
        Boulder: "Boulder",
        Hallowtide: "Hallowtide",
    },
    Celtor: {
        Marten: "Marten",
        Otter: "Otter",
        Badger: "Badger",
        Weasel: "Weasel",
        Hallowtide: "Hallowtide",
    },
    Etrean: {
        File: "File",
        Viper: "Viper",
        Coral: "Coral",
        Mamba: "Mamba",
        Hallowtide: "Hallowtide",
    },
};
export const racialStats = {
    Capra: ["Intelligence", "Willpower"],
    Ganymede: ["Intelligence", "Willpower"],
    Tiran: ["Willpower", "Agility"],
    Chrysid: ["Agility", "Charisma"],
    Vesperian: ["Fortitude", "Willpower"],
    Felinor: ["Charisma", "Agility"],
    Khan: ["Strength", "Agility"],
    Gremor: ["Strength", "Fortitude"],
    Canor: ["Strength", "Charisma"],
    Adret: ["Willpower", "Charisma"],
    Celtor: ["Intelligence", "Charisma"],
    Etrean: ["Agility", "Intelligence"],
};
export const origins = [
    "Diluvian Mechanism",
    "Castle Light",
    "Isle of Vigils",
    "Trial of One",
    "Etris",
    "Voidheart",
];
export const attunements = {
    None: "None",
    Flamecharm: "Flamecharm",
    Frostdraw: "Frostdraw",
    Galebreathe: "Galebreathe",
    Thundercall: "Thundercall",
    Ironsing: "Ironsing",
    Shadowcast: "Shadowcast",
};
export const presentations = {
    Masculine: "Masculine",
    Feminine: "Feminine",
};
export const boons = {
    Gourmet: "Gourmet",
    Autodidact: "Autodidact",
    Maverick: "Maverick",
    Survivalist: "Survivalist",
    Steadfast: "Steadfast",
    Scrapper: "Scrapper",
    Packmule: "Packmule",
    Sly: "Sly",
};
export const flaws = {
    Vegetarian: "Vegetarian",
    Squeamish: "Squeamish",
    Obvious: "Obvious",
    Haemophilia: "Haemophilia",
    Deficient: "Deficient",
    Blind: "Blind",
    Fugitive: "Fugitive",
    Manic: "Manic",
    Glutton: "Glutton",
    Simple: "Simple",
};

export class BasicAttributes {
    Strength = 0;
    Fortitude = 0;
    Agility = 0;
    Intelligence = 0;
    Willpower = 0;
    Charisma = 0;
    constructor({
        Strength,
        Fortitude,
        Agility,
        Intelligence,
        Willpower,
        Charisma,
    }) {
        this.Strength = Strength;
        this.Fortitude = Fortitude;
        this.Agility = Agility;
        this.Intelligence = Intelligence;
        this.Willpower = Willpower;
        this.Charisma = Charisma;
    }
}

export class AttunementAttributes {
    Flamecharm = 0;
    Frostdraw = 0;
    Galebreathe = 0;
    Thundercall = 0;
    Shadowcast = 0;
    Ironsing = 0;
    constructor({
        Flamecharm,
        Frostdraw,
        Galebreathe,
        Thundercall,
        Shadowcast,
        Ironsing,
    }) {
        this.Flamecharm = Flamecharm;
        this.Frostdraw = Frostdraw;
        this.Galebreathe = Galebreathe;
        this.Thundercall = Thundercall;
        this.Shadowcast = Shadowcast;
        this.Ironsing = Ironsing;
    }
}

export class WeaponAttributes {
    LightWeapon = 0;
    MediumWeapon = 0;
    HeavyWeapon = 0;
    constructor({ LightWeapon, MediumWeapon, HeavyWeapon }) {
        this.LightWeapon = LightWeapon;
        this.MediumWeapon = MediumWeapon;
        this.HeavyWeapon = HeavyWeapon;
    }
}

export class CharacterAttributes {
    basic = undefined;
    attunements = undefined;
    weapon = undefined;
    constructor({ basic, attunements, weapon }) {
        this.basic = basic;
        this.attunements = attunements;
        this.weapon = weapon;
    }
}

export class BoonsAndFlaws {
    boons = [];
    flaws = [];
    constructor({ boons, flaws }) {
        this.boons = boons;
        this.flaws = flaws;
    }
}

export class Character {
    name = "";
    level = 1;
    race = "";
    racialVariant = "";
    origin = "";
    charImage = {};
    presentation = "";
    attributes = undefined;
    boonsAndFlaws = undefined;
    pointsLeft = 0;
    constructor({
        name,
        level,
        race,
        racialVariant,
        origin,
        charImage,
        presentation,
        attributes,
        boonsAndFlaws,
        pointsLeft,
    }) {
        this.name = name;
        this.level = level;
        this.race = race;
        this.racialVariant = racialVariant;
        this.origin = origin;
        this.charImage = charImage;
        this.presentation = presentation;
        this.attributes = attributes;
        this.boonsAndFlaws = boonsAndFlaws;
        this.pointsLeft = pointsLeft;
    }
}

const deepwoken_names = globals.deepwoken_names;

export function randomName(race) {
    const randomFirstName =
        deepwoken_names.firstNames[
            Math.floor(Math.random() * deepwoken_names.firstNames.length)
        ];
    const lastNames = deepwoken_names.lastNamesForRace[race];
    const randomLastName =
        lastNames[Math.floor(Math.random() * lastNames.length)];
    return randomFirstName + " " + randomLastName;
}
export function randomPresentation() {
    return Math.random() < 0.5
        ? presentations.Masculine
        : presentations.Feminine;
}
export function randomRace(raceRollWeight) {
    // Calculate the total weight
    let totalWeight = 0;
    for (let race in raceRollWeight) {
        totalWeight += raceRollWeight[race];
    }

    // Generate a random number between 0 and totalWeight
    let randomNum = Math.random() * totalWeight;

    // Find the race that this random number falls into
    let accumulatedWeight = 0;
    for (let race in raceRollWeight) {
        accumulatedWeight += raceRollWeight[race];
        if (randomNum < accumulatedWeight) {
            return race;
        }
    }
}
export function randomFlaws(boonPoints) {
    let flawsArr = [];
    if (boonPoints == 2) {
        let flaw1 =
            flaws[
                Object.keys(flaws)[
                    Math.floor(Math.random() * Object.keys(flaws).length)
                ]
            ];
        let flaw2 =
            flaws[
                Object.keys(flaws)[
                    Math.floor(Math.random() * Object.keys(flaws).length)
                ]
            ];
        if (flaw2 === flaw1) {
            while (flaw2 === flaw1) {
                flaw2 =
                    flaws[
                        Object.keys(flaws)[
                            Math.floor(
                                Math.random() * Object.keys(flaws).length
                            )
                        ]
                    ];
            }
        }
        if ((flaw1 || flaw2) === flaws.Simple) {
            flawsArr.push(flaws.Simple);
        } else {
            flawsArr.push(flaw1, flaw2);
        }
    } else {
        let randomFlaw =
            flaws[
                Object.keys(flaws)[
                    Math.floor(Math.random() * Object.keys(flaws).length)
                ]
            ];
        while (randomFlaw === flaws.Simple) {
            randomFlaw =
                flaws[
                    Object.keys(flaws)[
                        Math.floor(Math.random() * Object.keys(flaws).length)
                    ]
                ];
        }
        flawsArr.push(randomFlaw);
    }
    return flawsArr;
}
export function randomBoons(boonPoints) {
    let boonsArr = [];
    for (let i = 0; i < boonPoints; i++) {
        let randomBoon =
            boons[
                Object.keys(boons)[
                    Math.floor(Math.random() * Object.keys(boons).length)
                ]
            ];
        if (boonsArr.includes(randomBoon)) {
            while (boonsArr.includes(randomBoon)) {
                randomBoon =
                    boons[
                        Object.keys(boons)[
                            Math.floor(
                                Math.random() * Object.keys(boons).length
                            )
                        ]
                    ];
            }
        }
        boonsArr.push(randomBoon);
    }
    return boonsArr;
}
export function getRandomAttunement(character) {
    // Choose either 1 or 2 attunements
    let chosenAttunements = Math.floor(Math.random() * 2) + 1;

    // Create an array of attunement keys, excluding 'None'
    let attunementKeys;
    if (chosenAttunements === 2) {
        attunementKeys = Object.keys(attunements).filter(
            (key) => key !== "None"
        );
    } else {
        attunementKeys = Object.keys(attunements);
    }

    // Choose the attunements
    let attunementsArr = [];
    for (let i = 0; i < chosenAttunements; i++) {
        let randomIndex = Math.floor(Math.random() * attunementKeys.length);
        let randomAttunement = attunements[attunementKeys[randomIndex]];

        // If we already have this attunement, choose another one
        while (attunementsArr.includes(randomAttunement)) {
            randomIndex = Math.floor(Math.random() * attunementKeys.length);
            randomAttunement = attunements[attunementKeys[randomIndex]];
        }

        attunementsArr.push(randomAttunement);
    }

    // Add the attunements to the character's attributes
    if (attunementsArr.length === 1 && attunementsArr[0] !== attunements.None) {
        character.attributes.attunements[attunementsArr[0]] = 10;
    } else if (attunementsArr.length === 2) {
        character.attributes.attunements[attunementsArr[0]] = 6;
        character.attributes.attunements[attunementsArr[1]] = 4;
    }
}
export function getPointsLeft(character) {
    let pointsLeft = 13 + 15; // character creation points + leveling up points
    if (
        Object.values(character.attributes.attunements).every(
            (value) => value === 0
        )
    ) {
        pointsLeft += 10; // no attunement gives 10 points
    }
    return pointsLeft;
}
export function randomRacialVariant(race) {
    let variant = raceVariants[race];
    let variantKeys = Object.keys(variant);
    let randomIndex = Math.floor(Math.random() * variantKeys.length);
    return variant[variantKeys[randomIndex]];
}
const racesDir = fs.readdirSync("resources/images/deepwokenRaces");
export function getCharacterImage(race, variant) {
    if (racesDir.includes(race)) {
        const variantDir = fs.readdirSync(
            `resources/images/deepwokenRaces/${race}`
        );
        if (variantDir.includes(variant + ".png")) {
            return `resources/images/deepwokenRaces/${race}/${variant}.png`;
        } else {
            log.warn("invalid variant for race " + race);
        }
    } else {
        log.warn("invalid race");
    }
}
export function calculateRacialStats(character) {
    const raceBonuses = racialStats[character.race];
    if (!raceBonuses) {
        log.warn("invalid race");
        return;
    }
    raceBonuses.forEach((stat) => {
        if (
            character.attributes.basic[stat] !== 0 &&
            !character.attributes.basic[stat]
        ) {
            log.warn("invalid stat");
            return;
        }

        character.attributes.basic[stat] += 2;
    });
}
export function randomOrigin() {
    const origin = origins[Math.floor(Math.random() * origins.length)];
    return origin;
}

export function createRandomFreshie() {
    let boonPoints = Math.floor(Math.random() * 2) + 1;
    if (boonPoints > 2) {
        boonPoints = 2;
    }
    const race = randomRace(raceRollWeight);
    const racialVariant = randomRacialVariant(race);
    let freshie = new Character({
        name: randomName(race),
        level: 1,
        race: race,
        racialVariant: racialVariant,
        origin: randomOrigin(),
        charImage: getCharacterImage(race, racialVariant),
        presentation: randomPresentation(),
        attributes: new CharacterAttributes({
            basic: new BasicAttributes({
                Strength: 0,
                Fortitude: 0,
                Agility: 0,
                Intelligence: 0,
                Willpower: 0,
                Charisma: 0,
            }),
            attunements: new AttunementAttributes({
                Flamecharm: 0,
                Frostdraw: 0,
                Galebreathe: 0,
                Thundercall: 0,
                Shadowcast: 0,
                Ironsing: 0,
            }),
            weapon: new WeaponAttributes({
                LightWeapon: 0,
                MediumWeapon: 0,
                HeavyWeapon: 0,
            }),
        }),
        boonsAndFlaws: new BoonsAndFlaws({
            flaws: randomFlaws(boonPoints),
            boons: randomBoons(boonPoints),
        }),
        pointsLeft: 0,
    });
    getRandomAttunement(freshie);
    calculateRacialStats(freshie);
    freshie.pointsLeft = getPointsLeft(freshie);

    return freshie;
}
