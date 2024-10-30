export const weapons = [
    "Flareblood Kamas",
    "Cerulean Thread",
    "Dagger",
    "Jus Karita",
    "Drakemaw Gauntlets",
    "Coral Cestus",
    "Light's Final Toll",
    "Way of Navae",
    "Legion Kata",
    "1 handed gun",
    "Rapier",
    "Forgotten Gladius",
    "Purple Cloud",
    "Shattered Katana",
    "Wyrmtooth",
    "Serpent's Edge",
    "Imperial Staff",
    "Bloodtide Trident",
    "Rifle Spear",
    "True Seraph's Spear",
    "Pernach",
    "Rosen's Peacemaker",
    "Iron Blunderbuss",
    "Skyreap Blade",
    "Pale Briar",
    "Relic Axe",
    "Enforcer's Axe",
    "Alloyed Inheritor",
    "Kyrsieger",
    "First Light",
    "Railblade",
    "Darkalloy Greatsword",
    "Kyrscleave",
    "Alloyed Crescent Cleaver",
    "Putrid Edenstaff",
    "Stoneheart",
    "Hivelord's Hubris",
    "Petra's Anchor",
    "Hero Blade of Flame",
    "Hero Blade of Lightning",
    "Hero Blade of Frost",
    "Hero Blade of Wind",
    "Hero Blade of Shadow",
    "Stormseye",
    "Gran Sudaruska",
    "Curved Blade of the Winds",
    "Crypt Blade",
    "Ignition Deepcrusher",
    "Ysley's Pyre Keeper",
    "Deepspindle",
];
export const oaths = [
    "Arcwarder",
    "Blindseer",
    "Contractor",
    "Dawnwalker",
    "Fadetrimmer",
    "Jetstriker",
    "Linkstrider",
    "Oathless",
    "Saltchemist",
    "Silentheart",
    "Starkindred",
    "Visionshaper",
];
export const focuses = [
    "Damage",
    "PVE damage",
    "Penetration",
    "Support",
    "Combos",
    "Mobility",
    "Tank",
];
export const armors = [
    "Authority Commander",
    "Black Diver",
    "Celtorian Tideknight",
    "Ignition Deepdelver",
    "Justicar's Armor",
    "Legion Centurion",
    "Navaen War Chief",
    "Prophet's Cloak",
    "Royal Etrean Guard",
    "Summer Dragoon",
    "Windrunner Robes",
    "Ferryman's Coat",
    "Darkened Bastion",
];
export const attunements = [
    "Attunement-less",
    "Flamecharm",
    "Frostdraw",
    "Galebreathe",
    "Thundercall",
    "Ironsing",
    "Shadowcast",
];
export const attunedWeapons = {
    Flamecharm: ["Hero Blade of Flame", "Ysley's Pyre Keeper"],
    Thundercall: ["Hero Blade of Lightning", "Stormseye"],
    Frostdraw: ["Hero Blade of Frost", "Gran Sudaruska"],
    Galebreathe: ["Hero Blade of Wind", "Curved Blade of the Winds"],
    Shadowcast: ["Hero Blade of Shadow", "Crypt Blade", "Deepspindle"],
    Ironsing: ["Ignition Deepcrusher"],
};

export class Idea {
    weapon = "";
    attunements = [];
    armor = "";
    oath = "";
    focus = "";
    constructor({ weapon, attunements, armor, oath, focus }) {
        this.weapon = weapon;
        this.attunements = attunements;
        this.armor = armor;
        this.oath = oath;
        this.focus = focus;
    }
}

export function getRandomWeapon() {
    const randomIndex = Math.floor(Math.random() * weapons.length);
    return weapons[randomIndex];
}

export function getRandomAttunement() {
    let amount = Math.floor(Math.random() * 3) + 1;
    if (amount == 0) {
        amount = 1;
    }
    let attunementsArr = [];
    for (let i = 0; i < amount; i++) {
        let randomIndex = Math.floor(Math.random() * attunements.length);
        let random = attunements[randomIndex];
        while (attunementsArr.includes(random)) {
            randomIndex = Math.floor(Math.random() * attunements.length);
            random = attunements[randomIndex];
        }
        attunementsArr.push(random);
    }
    return attunementsArr;
}
export function getRandomArmor() {
    const randomIndex = Math.floor(Math.random() * armors.length);
    return armors[randomIndex];
}
export function getRandomOath() {
    const randomIndex = Math.floor(Math.random() * oaths.length);
    return oaths[randomIndex];
}
export function getRandomFocus() {
    const randomIndex = Math.floor(Math.random() * focuses.length);
    return focuses[randomIndex];
}

export function fixImpossibleIdea(idea) {
    let weaponIsAttuned = false;
    let weaponAttunement = "";
    for (let attunement of Object.keys(attunedWeapons)) {
        if (attunedWeapons[attunement].includes(idea.weapon)) {
            weaponIsAttuned = true;
            weaponAttunement = attunement;
        }
    }
    if (idea.attunements.includes("Attunement-less")) {
        if (weaponIsAttuned) {
            idea.attunements = idea.attunements.filter(
                (attunement) => attunement !== "Attunement-less"
            );
        } else {
            idea.attunements = ["Attunement-less"];
        }
    }
    if (weaponIsAttuned) {
        if (!idea.attunements.includes(weaponAttunement)) {
            idea.attunements.push(weaponAttunement);
        }
    }
    if (idea.oath == "Arcwarder") {
        if (!idea.attunements.includes("Thundercall")) {
            idea.attunements.push("Thundercall");
        }
        if (!idea.attunements.includes("Flamecharm")) {
            idea.attunements.push("Flamecharm");
        }
    }
    return idea;
}

export function randomBuildIdea(avoidImpossible = false) {
    let idea = new Idea({
        weapon: getRandomWeapon(avoidImpossible),
        attunements: getRandomAttunement(avoidImpossible),
        armor: getRandomArmor(avoidImpossible),
        oath: getRandomOath(avoidImpossible),
        focus: getRandomFocus(avoidImpossible),
    });
    if (avoidImpossible) {
        idea = fixImpossibleIdea(idea);
    }
    return idea;
}
