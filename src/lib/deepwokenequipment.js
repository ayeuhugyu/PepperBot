import * as log from "./log.js"
import util from "util";


/* PIP CLASSES */

export class pipValue {
    constructor({ common, uncommon, rare, legendary }) {
        this.common = common || 0;
        this.uncommon = uncommon || 0;
        this.rare = rare || 0;
        this.legendary = legendary || 0;
    }
}
export class pipTypeData {
    constructor({ head, arms, legs, torso, face, ears, rings }) {
        this.head = head || new pipValue({ common: 0, uncommon: 0, rare: 0, legendary: 0 });
        this.arms = arms || new pipValue({ common: 0, uncommon: 0, rare: 0, legendary: 0 });
        this.legs = legs || new pipValue({ common: 0, uncommon: 0, rare: 0, legendary: 0 });
        this.torso = torso || new pipValue({ common: 0, uncommon: 0, rare: 0, legendary: 0 });
        this.face = face || new pipValue({ common: 0, uncommon: 0, rare: 0, legendary: 0 });
        this.ears = ears || new pipValue({ common: 0, uncommon: 0, rare: 0, legendary: 0 });
        this.rings = rings || new pipValue({ common: 0, uncommon: 0, rare: 0, legendary: 0 });
    }
}
export class pipData {
    constructor({ name, abbreviation, pipTypeData, displayAsPercentage }) {
        this.name = name;
        this.abbreviation = abbreviation || (name ? name.toUpperCase() : undefined);
        this.displayAsPercentage = displayAsPercentage
        this.data = pipTypeData || new pipTypeData({});
        return this;
    }
}

/* EQUIPMENT CLASSES */

export class equipmentData {
    constructor({ name, type, pips, innate, requirements, rarity }) {
        this.name = name;
        this.type = type;
        this.pips = pips || [];
        this.innate = innate || {};
        this.requirements = requirements || {};
        this.rarity = rarity || "rare";
        return this;
    }
}
export class processedEquipment extends equipmentData {
    constructor({ name, type, pips, innate, requirements, stars, flagInvalidStar, rarity }) {
        super({ name, type, pips, innate, requirements, rarity });
        this.stars = stars
        this.flagInvalidStar = flagInvalidStar
        return this;
    }
}

export const pips = {
    health: new pipData({ name: "health", abbreviation: "HP", pipTypeData: new pipTypeData({ 
        head: new pipValue({ common: 0, uncommon: 4, rare: 4, legendary: 5 }), // 0 4 4 5
        arms: new pipValue({ common: 0, uncommon: 4, rare: 4, legendary: 5 }), // 0 4 4 5
        legs: new pipValue({ common: 3, uncommon: 0, rare: 4, legendary: 5 }), // 3 4 5 0
        torso: new pipValue({ common: 0, uncommon: 3, rare: 4, legendary: 5 }), // 0 3 4 5
        rings: new pipValue({ common: 0, uncommon: 2, rare: 3, legendary: 4 }) // 0 2 3 4
    })}),
    ether: new pipData({ name: "ether", abbreviation: "ETH", pipTypeData: new pipTypeData({ 
        head: new pipValue({ common: 0, uncommon: 8, rare: 10, legendary: 12 }), // 0 8 10 12
        arms: new pipValue({ common: 0, uncommon: 8, rare: 10, legendary: 12 }), // 0 8 10 12
        legs: new pipValue({ common: 0, uncommon: 0, rare: 10, legendary: 12 }), // 0 0 10 12
        torso: new pipValue({ common: 0, uncommon: 8, rare: 10, legendary: 12 }), // 0 8 10 12
        face: new pipValue({ common: 4, uncommon: 6, rare: 8, legendary: 0 }), // 4 6 8 0
        ears: new pipValue({ common: 4, uncommon: 0, rare: 8, legendary: 0 }), // 4 0 8 0
        rings: new pipValue({ common: 4, uncommon: 6, rare: 8, legendary: 10 }) // 4 6 8 10
    })}),
    sanity: new pipData({ name: "sanity", abbreviation: "SAN", pipTypeData: new pipTypeData({ 
        face: new pipValue({ common: 0, uncommon: 4, rare: 6, legendary: 0 }), // 0 4 6 0
        ears: new pipValue({ common: 0, uncommon: 0, rare: 6, legendary: 0 }), // 0 0 6 0
        rings: new pipValue({ common: 0, uncommon: 4, rare: 6, legendary: 8 }) // 0 4 6 8
    })}),
    posture: new pipData({ name: "posture", abbreviation: "PST", pipTypeData: new pipTypeData({ 
        rings: new pipValue({ common: 0, uncommon: 0, rare: 1, legendary: 2 }) // 0 0 1 2
    })}),
    dvm: new pipData({ name: "damage vs monsters", abbreviation: "DVM", displayAsPercentage: true, pipTypeData: new pipTypeData({ 
        head: new pipValue({ common: 0, uncommon: 0, rare: 1, legendary: 3 }), // 0 0 1 3
        arms: new pipValue({ common: 0, uncommon: 0, rare: 1, legendary: 3 }), // 0 0 1 3
        legs: new pipValue({ common: 0, uncommon: 0, rare: 1, legendary: 3 }), // 0 0 1 3
        torso: new pipValue({ common: 0, uncommon: 0, rare: 1, legendary: 3 }), // 0 0 1 3
        face: new pipValue({ common: 0, uncommon: 0, rare: 1, legendary: 0 }), // 0 0 1 0
        ears: new pipValue({ common: 0, uncommon: 0, rare: 1, legendary: 0 }), // 0 0 1 0
        rings: new pipValue({ common: 0, uncommon: 0, rare: 1, legendary: 3 }) // 0 0 1 3
    })}),
    physical: new pipData({ name: "physical", abbreviation: "PHYS", displayAsPercentage: true, pipTypeData: new pipTypeData({ 
        head: new pipValue({ common: 0, uncommon: 0, rare: 2, legendary: 4 }), // 0 0 2 4
        arms: new pipValue({ common: 0, uncommon: 0, rare: 2, legendary: 4 }), // 0 0 2 4
    })}),
    elemental: new pipData({ name: "elemental", abbreviation: "ELM", displayAsPercentage: true, pipTypeData: new pipTypeData({ 
        head: new pipValue({ common: 0, uncommon: 0, rare: 3, legendary: 4 }), // 0 0 3 4
        arms: new pipValue({ common: 0, uncommon: 0, rare: 3, legendary: 4 }), // 0 0 3 4
    })}),
    monster: new pipData({ name: "monster armor", abbreviation: "MNST", displayAsPercentage: true, pipTypeData: new pipTypeData({ 
        head: new pipValue({ common: 0, uncommon: 0, rare: 4, legendary: 0 }), // 0 0 4 0
        arms: new pipValue({ common: 0, uncommon: 0, rare: 4, legendary: 0 }), // 0 0 4 0
    })}),
    stealth: new pipData({ name: "stealth", abbreviation: "STL", displayAsPercentage: true, pipTypeData: new pipTypeData({})}),
    shadow: new pipData({ name: "shadow armow", abbreviation: "SDW", displayAsPercentage: true, pipTypeData: new pipTypeData({})}),
    flame: new pipData({ name: "flame armor", abbreviation: "FLM", displayAsPercentage: true, pipTypeData: new pipTypeData({})}),
    gale: new pipData({ name: "gale armor", abbreviation: "WND", displayAsPercentage: true, pipTypeData: new pipTypeData({})}),
    frost: new pipData({ name: "frost armor", abbreviation: "FST", displayAsPercentage: true, pipTypeData: new pipTypeData({})}),
    thunder: new pipData({ name: "thunder armor", abbreviation: "THD", displayAsPercentage: true, pipTypeData: new pipTypeData({})}),
    ironsing: new pipData({ name: "ironsing armor", abbreviation: "IRN", displayAsPercentage: true, pipTypeData: new pipTypeData({})}),
    carry: new pipData({ name: "carry load", abbreviation: "CRY", pipTypeData: new pipTypeData({})}),
};

/*
rarity colors:
common: white
uncommon: yellow
rare: red
legendary: cyan
mythic: purple
relic: lime
hallowtide: orange
*/

export const equipment = { // TEMPLATE: "": new equipmentData({ name: "", type: "", pips: [], innate: {}, requirements: {} }),
    // #region HEAD EQUIPMENT
    "Alchemist's Hat": new equipmentData({ name: "Alchemist's Hat", type: "head", pips: ["uncommon"], innate: {"Apothecary": "Potions you prepare will have amplified positive effects when consumed, and amplified negative effects when thrown.", "Pitcher": "You can throw things further."}, requirements: {}, rarity: "uncommon" }),
    "Assassin's Hood": new equipmentData({ name: "Assasin's Hood", type: "head", pips: ["rare", "rare"], innate: {"Deep Wound": "Assasinating a target applies anti-heal for 20s and gives you a speed boost for 3s. Assasination damage now scales with level against mobs.", "stealth": 5}, requirements: {}, rarity: "rare" }),
    "Authority Helm": new equipmentData({ name: "Authority Helm", type: "head", pips: ["uncommon", "rare"], innate: {"Strong Hold": "When above half health and two-handing, posture damage taken is reduced by 20%.", "health": 8}, requirements: {"fortitude": 10}, rarity: "rare" }),
    "Barrel Helm": new equipmentData({ name: "Barrel Helm", type: "head", pips: ["uncommon"], innate: {"health": 5}, requirements: {"fortitude": 10}, rarity: "uncommon" }),
    "Big Alchemist's Hat": new equipmentData({ name: "Big Alchemist's Hat", type: "head", pips: ["rare"], innate: {"Apothecary": "Potions you prepare will have amplified positive effects when consumed, and amplified negative effects when thrown.", "Pitcher": "You can throw things further."}, requirements: {}, rarity: "rare" }),
    "Big Herbalist's Hat": new equipmentData({ name: "Big Herbalist's Hat", type: "head", pips: ["rare"], innate: {"Herbivore": "You gain more nutrition from eating plants.", "Iron Gut": "You have resistance against being poisoned by foods."}, requirements: {}, rarity: "rare" }),
    "Black Hood": new equipmentData({ name: "Black Hood", type: "head", pips: [], innate: {"posture": 1, "stealth": 4}, requirements: {}, rarity: "uncommon" }),
    "Blackleaf Helm": new equipmentData({ name: "Blackleaf Helm", type: "head", pips: ["rare", "rare"], innate: {"health": 5, "posture": 2, "Concussive Force": "Enemies you knocked remain downed longer than usual."}, requirements: {"fortitude": 20}, rarity: "rare" }),
    "Blacksteel Helm": new equipmentData({ name: "Blacksteel Helm", type: "head", pips: ["uncommon", "rare"], innate: {"health": 10}, requirements: {"fortitude": 15}, rarity: "rare" }),
    "Black Strapped Hat": new equipmentData({ name: "Black Strapped Hat", type: "head", pips: ["rare", "rare"], innate: {"health": 3, "The Exterminator": "Potions you prepare will have amplified negative effects when thrown."}, requirements: {}, rarity: "rare" }),
    "Bloodfeather Cowl": new equipmentData({ name: "Bloodfeather Cowl", type: "head", pips: ["rare", "rare"], innate: {"stealth": 6, "shadow": 5, "Bloodletter": "Hitting opponents on the ground lowers their blood."}, requirements: {}, rarity: "rare" }),
    "Bloodforged Crown": new equipmentData({ name: "Bloodforged Crown", type: "head", pips: ["rare", "legendary"], innate: {"health": 5, "Cauterized Wounds": "Blood loss from all sources is lowered."}, requirements: {"power": 15}, rarity: "mythic" }),
    "Brigand's Bicorn": new equipmentData({ name: "Brigand's Bicorn", type: "head", pips: ["rare", "rare"], innate: {"health": 3, "Emergency Repairs": "Your repairs are twice as efficient when the ship is on low health. Your repairs scale somewhat with the Max Health of the ship.", "Spare Nails": "You always keep a couple spare. Your repairs are more efficient and you no longer drop Wood on death."}, requirements: {}, rarity: "uncommon" }),
    "Brown Hood": new equipmentData({ name: "Brown Hood", type: "head", pips: [], innate: {"posture": 1, "stealth": 2}, requirements: {}, rarity: "uncommon" }),
    "Bulwark Helm": new equipmentData({ name: "Bulwark Helm", type: "head", pips: ["rare", "legendary"], innate: {"health": 3, "Strong Hold": "When above half health and two-handing, posture damage taken is reduced by 20%."}, requirements: {}, rarity: "rare" }),
    "Captain's Kabuto": new equipmentData({ name: "Captain's Kabuto", type: "head", pips: ["rare"], innate: {"health": 8}, requirements: {}, rarity: "rare" }),
    "Celtor Commander Helm": new equipmentData({ name: "Celtor Commander Helm", type: "head", pips: ["rare", "legendary"], innate: {"health": 5, "Grasp On Reality": "Damage taken from insanity is reduced."}, requirements: {"fortitude": 15}, rarity: "rare" }),
    "Dark Cowl": new equipmentData({ name: "Dark Cowl", type: "head", pips: [], innate: {"posture": 1, "stealth": 4}, requirements: {}, rarity: "rare" }),
    "Dark Owl Chapeau": new equipmentData({ name: "Dark Owl Chapeau", type: "head", pips: ["rare", "legendary"], innate: {"stealth": 10, "shadow": 5, "Giantslayer": "Deal more damage to larger foes."}, requirements: {}, rarity: "rare" }),
    "Deepwoken Hood": new equipmentData({ name: "Deepwoken Hood", type: "head", pips: ["rare", "rare", "legendary"], innate: {}, requirements: {}, rarity: "rare" }),
    "Double Strapped Hat": new equipmentData({ name: "Double Strapped Hat", type: "head", pips: ["rare", "rare"], innate: {"health": 3, "The Exterminator": "Potions you prepare will have amplified negative effects when thrown."}, requirements: {}, rarity: "rare" }),
    "Familiar Heretic's Helm": new equipmentData({ name: "Familiar Heretic's Helm", type: "head", pips: ["uncommon", "rare"], innate: {"health": 10}, requirements: {}, rarity: "hallowtide" }),
    "Familiar Knight's Helm": new equipmentData({ name: "Familiar Knight's Helm", type: "head", pips: ["uncommon", "rare"], innate: {"health": 10}, requirements: {}, rarity: "hallowtide" }),
    "Familiar Priest's Helm": new equipmentData({ name: "Familiar Priest's Helm", type: "head", pips: ["uncommon", "rare"], innate: {"health": 10}, requirements: {}, rarity: "hallowtide" }),
    "Feathertop Helm": new equipmentData({ name: "Feathertop Helm", type: "head", pips: ["uncommon"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Gladiator Helmet": new equipmentData({ name: "Gladiator Helmet", type: "head", pips: ["rare"], innate: {"health": 10, "posture": 2, "Concussive Force": "Enemies you knocked remain downed longer than usual."}, requirements: {"fortitude": 15}, rarity: "uncommon" }),
    "Goldleaf Helm": new equipmentData({ name: "Goldleaf Helm", type: "head", pips: ["rare"], innate: {"health": 5}, requirements: {"fortitude": 10}, rarity: "rare" }),
    "Grand Fisher Helm": new equipmentData({ name: "Grand Fisher Helm", type: "head", pips: ["rare", "legendary"], innate: {"health": 5, "frost": 5, "thunder": 5, "Coldseep Reactor": "By cultivating the localized chemosynthetic microorganisms within the Depths and utilizing them as a power source, your helm thrums with a protective field of static electricity and heat."}, requirements: {}, rarity: "unique" }),
    "Guard's Kabuto": new equipmentData({ name: "Guard's Kabuto", type: "head", pips: ["rare"], innate: {"health": 8}, requirements: {}, rarity: "rare" }),
    "Guardian Helmet": new equipmentData({ name: "Guardian Helmet", type: "head", pips: [], innate: {"health": 5, "posture": 1,}, requirements: {"fortitude": 10}, rarity: "uncommon" }),
    "Gumshoe Hat": new equipmentData({ name: "Gumshoe Hat", type: "head", pips: ["rare"], innate: {}, requirements: {}, rarity: "common" }),
    "Herbalist's Hat": new equipmentData({ name: "Herbalist's Hat", type: "head", pips: ["uncommon"], innate: {"Herbivore": "You gain more nutrition from eating plants.", "Iron Gut": "You have resistance against being poisoned by foods."}, requirements: {}, rarity: "uncommon" }),
    "Immortal Helm": new equipmentData({ name: "Immortal Helm", type: "head", pips: ["rare", "legendary"], innate: {"health": 5, "Immortality": "UNKNOWN"}, requirements: {"power": 15}, rarity: "legendary" }), // MISSING TALENT DESCRIPTION
    "Investigator's Hat": new equipmentData({ name: "Investigator's Hat", type: "head", pips: ["uncommon", "rare"], innate: {"health": 4, "Give and Take": "Deal less damage to comrades and receive less damage from comrades."}, requirements: {}, rarity: "rare" }),
    "Khan Helmet": new equipmentData({ name: "Khan Helmet", type: "head", pips: ["uncommon"], innate: {"health": 10, "posture": 2}, requirements: {"fortitude": 15}, rarity: "rare" }),
    "Knight's Helm": new equipmentData({ name: "Knight's Helm", type: "head", pips: ["uncommon", "rare"], innate: {"health": 10}, requirements: {"fortitude": 15}, rarity: "rare" }),
    "Legate Helm": new equipmentData({ name: "Legate Helm", type: "head", pips: [], innate: {"health": 5, "posture": 1}, requirements: {"fortitude": 5}, rarity: "uncommon" }),
    "Miner's Hardhat": new equipmentData({ name: "Miner's Hardhat", type: "head", pips: ["rare", "rare"], innate: {"posture": 1}, requirements: {}, rarity: "common" }),
    "Monastery Champion Cowl": new equipmentData({ name: "Monastery Champion Cowl", type: "head", pips: ["rare", "rare"], innate: {"stealth": 5, "Blade Dancer": "Landing an M1 removes your roll cooldown."}, requirements: {}, rarity: "legendary" }),
    "Mushroom Costume": new equipmentData({ name: "Mushroom Costume", type: "head", pips: [], innate: {}, requirements: {}, rarity: "hallowtide" }),
    "Phalanx Helmet": new equipmentData({ name: "Phalanx Helmet", type: "head", pips: ["rare", "legendary"], innate: {"health": 3, "Precise Swing": "After landing a critical your next light attack will gain 5% chip past your opponent's block."}, requirements: {}, rarity: "rare" }),
    "Pumpkin Head": new equipmentData({ name: "Pumpkin Head", type: "head", pips: [], innate: {}, requirements: {}, rarity: "hallowtide" }),
    "Royal Guard's Kabuto": new equipmentData({ name: "Royal Guard's Kabuto", type: "head", pips: ["rare"], innate: {"health": 8}, requirements: {}, rarity: "rare" }),
    "Smith's Bandana": new equipmentData({ name: "Smith's Bandana", type: "head", pips: ["uncommon"], innate: {"health": 4}, requirements: {}, rarity: "rare" }),
    "Ten Gallon Hat": new equipmentData({ name: "Ten Gallon Hat", type: "head", pips: ["rare"], innate: {"posture": 2, "Give and Take": "Deal less damage to comrades and receive less damage from comrades."}, requirements: {}, rarity: "rare" }),
    "Tophat": new equipmentData({ name: "Tophat", type: "head", pips: ["uncommon", "rare"], innate: {"health": 4, "Give and Take": "Deal less damage to comrades and receive less damage from comrades."}, requirements: {}, rarity: "rare" }),
    "Vagabond's Bicorn": new equipmentData({ name: "Vagabond's Bicorn", type: "head", pips: ["uncommon"], innate: {"health": 4}, requirements: {}, rarity: "rare" }),
    "Vigil Hood": new equipmentData({ name: "Vigil Hood", type: "head", pips: ["rare", "rare", "legendary"], innate: {}, requirements: {}, rarity: "rare" }),
    "Deepscorn Casque": new equipmentData({ name: "Deepscorn Casque", type: "head", pips: ["rare", "legendary"], innate: {"health": 5, "Already Dead": "You take reduced damage from abilities with a health cost."}, requirements: {}, rarity: "unique" }),
    // #endregion
    // #region ARMS EQUIPMENT
    "Adjudicator's Coat": new equipmentData({ name: "Adjudicator's Coat", type: "arms", pips: ["rare", "rare"], innate: {"Unwavering Resolve": "Getting parried punishes your posture 33% less."}, requirements: {}, rarity: "rare" }),
    "Adventurer Coat": new equipmentData({ name: "Adventurer Coat", type: "arms", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Aristocrat Coat": new equipmentData({ name: "Aristocrat Coat", type: "arms", pips: ["rare", "rare", "legendary"], innate: {"Art of the Deal": "Your rapport with merchants gives you lower prices!"}, requirements: {"power": 13}, rarity: "uncommon" }),
    "Assassin's Cloak": new equipmentData({ name: "Assassin's Cloak", type: "arms", pips: ["rare", "rare", "legendary"], innate: {"stealth": 3, "health": 6, "Now You See Me": "UNKNOWN"}, requirements: {"power": 10}, rarity: "rare" }), // MISSING TALENT DESCRIPTION
    "Authority Commander Coat": new equipmentData({ name: "Authority Commander Coat", type: "arms", pips: ["rare", "rare"], innate: {"health": 10}, requirements: {"power": 13}, rarity: "rare" }),
    "Autumn Pauldrons": new equipmentData({ name: "Autumn Pauldrons", type: "arms", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Azure Royal Guard": new equipmentData({ name: "Azure Royal Guard", type: "arms", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "common" }),
    "Black Overcoat": new equipmentData({ name: "Black Overcoat", type: "arms", pips: ["rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Black Parka": new equipmentData({ name: "Black Parka", type: "arms", pips: ["rare"], innate: {"health": 2, "posture": 1, "Steady Footing": "You're much more resistant to being pushed around."}, requirements: {}, rarity: "rare" }),
    "Blacksteel Pauldrons": new equipmentData({ name: "Blacksteel Pauldrons", type: "arms", pips: ["rare"], innate: {"health": 3, "posture": 1}, requirements: {}, rarity: "rare" }),
    "Bluesteel Pauldrons": new equipmentData({ name: "Bluesteel Pauldrons", type: "arms", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Brigand's Cloak": new equipmentData({ name: "Brigand's Cloak", type: "arms", pips: ["rare", "rare"], innate: {"health": 3}, rarity: "rare"}),
    "Brilliant Pauldrons": new equipmentData({ name: "Brilliant Pauldrons", type: "arms", pips: ["rare", "rare", "legendary"], innate: {"health": 5}, requirements: {}, rarity: "common" }),
    "Brown Overcoat": new equipmentData({ name: "Brown Overcoat", type: "arms", pips: [], innate: {"health": 2, "posture": 1}, requirements: {}, rarity: "rare" }),
    "Brown Parka": new equipmentData({ name: "Brown Parka", type: "arms", pips: ["rare"], innate: {"health": 2, "posture": 1, "Steady Footing": "You're much more resistant to being pushed around."}, requirements: {}, rarity: "rare" }),
    "Celtor Commander Plate": new equipmentData({ name: "Celtor Commander Plate", type: "arms", pips: ["rare", "rare", "legendary"], innate: {"health": 8, "Breathing Excercise": "Your sanity recovers more quickly once out of terrifying situations."}, requirements: {}, rarity: "rare" }),
    "Dark Owl Cloak": new equipmentData({ name: "Dark Owl Cloak", type: "arms", pips: ["rare", "legendary"], innate: {"stealth": 6, "shadow": 8, "Disbelief": "You're resistant to the effects of Illusion magic. You are resistant to charms and tricks."}, requirements: {}, rarity: "rare" }),
    "Deepwoken Cloak": new equipmentData({ name: "Deepwoken Cloak", type: "arms", pips: ["rare", "rare", "legendary"], innate: {"Blade Dancer": "Landing an M1 removes your roll cooldown."}, requirements: {}, rarity: "legendary" }),
    "Delver's Duster": new equipmentData({ name: "Delver's Duster", type: "arms", pips: ["legendary", "legendary", "legendary"], innate: {"health": 5, "Braced Collapse": "After being block broken, the next attack to hit you deals reduced damage.", "Kick Off": "You easily brush off shorter falls, taking no damage. Your first wall jump will always send you higher than normal. Gain a speed boost after wall jumping over a wall."}, requirements: {"power": 10}, rarity: "mythic" }),
    "Diver's Light Plate": new equipmentData({ name: "Diver's Light Plate", type: "arms", pips: ["legendary", "legendary", "legendary"], innate: {"health": 10, "posture": 1, "Conquer your Fears": "Killing the beings of the deep replenishes your sanity somewhat. When an Ally grips an enemy nearby to you, you regain Sanity."}, requirements: {"power": 10, "fortitude": 5}, rarity: "mythic" }),
    "Enforcer Plate": new equipmentData({ name: "Enforcer Plate", type: "arms", pips: ["rare", "rare"], innate: {"Berserker": "Knocking an enemy grants you 20% damage resistance for 15 seconds."}, requirements: {}, rarity: "uncommon" }),
    "Etrean Siege Curiass": new equipmentData({ name: "Etrean Siege Curiass", type: "arms", pips: ["uncommon", "rare", "legendary"], innate: {"health": 8, "Battle Tendency": "You can breathe more easily with +20% faster posture regen."}, requirements: {} }),
    "First Ranger Duster": new equipmentData({ name: "First Ranger Duster", type: "arms", pips: ["rare", "rare"], innate: {"health": 10, "posture": 2, }, requirements: {"power": 13}, rarity: "rare" }),
    "Flameguard Pauldrons": new equipmentData({ name: "Flameguard Pauldrons", type: "arms", pips: ["rare"], innate: {}, requirements: {}, rarity: "common" }),
    "Fur Pauldrons": new equipmentData({ name: "Fur Pauldrons", type: "arms", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Gladiator Pauldrons": new equipmentData({ name: "Gladiator Pauldrons", type: "arms", pips: [], innate: {"health": 2, "posture": 1}, requirements: {}, rarity: "rare" }),
    "Glassdancer Wraps": new equipmentData({ name: "Glassdancer Wraps", type: "arms", pips: ["rare"], innate: {"health": 7, "posture": 3, "Lightweight": "Move faster when your armor runs out of durability."}, requirements: {}, rarity: "rare" }),
    "Grand Authority Plate": new equipmentData({ name: "Grand Authority Plate", type: "arms", pips: ["uncommon", "rare", "legendary"], innate: {"health": 8, "Heavy Haul": "Enemies who carry you move significantly slower."}, requirements: {}, rarity: "rare" }),
    "Grand Fisher Plate": new equipmentData({ name: "Grand Fisher Plate", type: "arms", pips: ["legendary", "legendary", "legendary"], innate: {"health": 10, "posture": 1, "Diver's Resilience": "You can parry unparryable attacks from giant monsters, but due to the heft of your plate you have slightly reduced speed."}, requirements: {}, rarity: "unique" }),
    "Grand Pauldrons": new equipmentData({ name: "Grand Pauldrons", type: "arms", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "common" }),
    "Guardian Pauldrons": new equipmentData({ name: "Guardian Pauldrons", type: "arms", pips: [], innate: {"health": 2, "posture": 1}, requirements: {}, rarity: "uncommon" }),
    "Gumshoe Longcoat": new equipmentData({ name: "Gumshoe Longcoat", type: "arms", pips: ["rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Hive Scourge Curiass": new equipmentData({ name: "Hive Scourge Curiass", type: "arms", pips: ["uncommon", "rare", "legendary"], innate: {"health": 5, "posture": 2, "Lowstride": "Speed during crouching increased, unsheathing a weapon is silent and stealth increased."}, requirements: {}, rarity: "rare" }),
    "Imperial Pauldrons": new equipmentData({ name: "Imperial Pauldrons", type: "arms", pips: ["rare", "rare"], innate: {"health": 3, "posture": 1}, requirements: {}, rarity: "rare" }),
    "Iron Pauldrons": new equipmentData({ name: "Iron Pauldrons", type: "arms", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Ironsinger Heavy Plate": new equipmentData({ name: "Ironsinger Heavy Plate", type: "arms", pips: ["rare", "legendary", "legendary"], innate: {"health": 10, "ironsing": 5, "Defiant until the End": "Slow the enemy trying to execute you down with one last shout of your determination."}, requirements: {"power": 3, "fortitude": 15}, rarity: "legendary" }),
    "Justicar Defender": new equipmentData({ name: "Justicar Defender", type: "arms", pips: ["rare", "rare"], innate: {}, requirements: {"power": 13}, rarity: "uncommon" }),
    "Khan Pauldrons": new equipmentData({ name: "Khan Pauldrons", type: "arms", pips: ["rare", "rare"], innate: {"health": 3, "Polite Awakening": "Recover 15% of your max health after getting up from being downed."}, requirements: {}, rarity: "rare" }),
    "Leather Gloves": new equipmentData({ name: "Leather Gloves", type: "arms", pips: ["uncommon"], innate: {"health": 2, "posture": 1}, requirements: {}, rarity: "common" }),
    "Leather Pauldrons": new equipmentData({ name: "Leather Pauldrons", type: "arms", pips: [], innate: {"health": 2}, requirements: {}, rarity: "common" }),
    "Legion Phalanx Plate": new equipmentData({ name: "Legion Phalanx Plate", type: "arms", pips: ["rare", "rare", "legendary"], innate: {"health": 6, "posture": 2, "Hoplite": "Posture damage is reduced by 30% when wielding a spear and standing still."}, requirements: {}, rarity: "rare" }),
    "Megalodaunt Coat": new equipmentData({ name: "Megalodaunt Coat", type: "arms", pips: ["rare", "rare"], innate: {"dvm": 5}, requirements: {"power": 5}, rarity: "rare" }),
    "Mercenary's Garb": new equipmentData({ name: "Mercenary's Garb", type: "arms", pips: ["rare", "legendary"], innate: {"stealth": 6, "Kick Off": "You easily brush off shorter falls, taking no damage. Your first wall jump will always send you higher than normal. Gain a speed boost after wall jumping over a wall."}, requirements: {}, rarity: "rare" }),
    "Ministry Cloak": new equipmentData({ name: "Ministry Cloak", type: "arms", pips: ["rare", "legendary"], innate: {"health": 5, "ether": 10}, requirements: {"power": 13}, rarity: "rare" }),
    "Ministry Operative Cloak": new equipmentData({ name: "Ministry Operative Cloak", type: "arms", pips: ["rare", "rare", "legendary"], innate: {"stealth": 6, "Ether Conduit": "Your Ether Adept Talents that grant you ether on proc now give you stacks of Inspiration. At 3 stacks of Inspiration. your mantras will deal 10% more damage for 3s."}, requirements: {}, rarity: "rare" }),
    "Monastery Champion Robes": new equipmentData({ name: "Monastery Champion Robes", type: "arms", pips: ["rare", "legendary", "legendary"], innate: {"health": 8, "Temple Guard": "UNKNOWN"}, requirements: {}, rarity: "legendary" }), // MISSING TALENT DESCRIPTION
    "Moonseye Gauntlets": new equipmentData({ name: "Moonseye Gauntlets", type: "arms", pips: ["rare", "legendary"], innate: {"health": 7, "posture": 3}, requirements: {}, rarity: "legendary" }),
    "Novice Brace": new equipmentData({ name: "Novice Brace", type: "arms", pips: ["rare"], innate: {"health": 2, "posture": 1}, requirements: {}, rarity: "rare" }),
    "Pathfinder Elite": new equipmentData({ name: "Pathfinder Elite", type: "arms", pips: ["rare", "rare", "legendary"], innate: {"dvm": 5}, requirements: {"power": 13}, rarity: "rare" }),
    "Providence Coat": new equipmentData({ name: "Providence Coat", type: "arms", pips: ["rare", "rare"], innate: {"health": 5, "Braced Collapse": "After being block broken, the next attack to hit you deals reduced damage."}, requirements: {}, rarity: "legendary" }),
    "Ranger's Brace": new equipmentData({ name: "Ranger's Brace", type: "arms", pips: ["rare", "rare"], innate: {"health": 3, "posture": 1}, requirements: {}, rarity: "uncommon" }),
    "Redsteel Pauldrons": new equipmentData({ name: "Redsteel Pauldrons", type: "arms", pips: ["rare", "rare"], innate: {"health": 3, "posture": 1}, requirements: {}, rarity: "rare" }),
    "Royal Duelist": new equipmentData({ name: "Royal Duelist", type: "arms", pips: ["rare", "rare"], innate: {}, requirements: {"power": 13}, rarity: "uncommon" }),
    "Royal Pathfinder": new equipmentData({ name: "Royal Pathfinder", type: "arms", pips: ["rare", "rare", "legendary"], innate: {"health": 6, "Ready or Not": "The first attack to hit you while out of combat has its damage cut in half."}, requirements: {"power": 10}, rarity: "rare" }),
    "Sandrunner Wraps": new equipmentData({ name: "Sandrunner Wraps", type: "arms", pips: ["rare", "legendary"], innate: {"health": 6, "stealth": 4, "flame": 8, "Kick Off": "You easily brush off shorter falls, taking no damage. Your first wall jump will always send you higher than normal. Gain a speed boost after wall jumping over a wall."}, requirements: {"fortitude": 15}, rarity: "rare" }),
    "Silver Pauldrons": new equipmentData({ name: "Silver Pauldrons", type: "arms", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Simple Pauldrons": new equipmentData({ name: "Simple Pauldrons", type: "arms", pips: [], innate: {"health": 2}, requirements: {}, rarity: "common" }),
    "Smith's Gloves": new equipmentData({ name: "Smith's Gloves", type: "arms", pips: ["rare", "rare"], innate: {"health": 5}, requirements: {}, rarity: "rare" }),
    "Star Duster": new equipmentData({ name: "Star Duster", type: "arms", pips: ["rare", "rare", "legendary"], innate: {"health": 5, "posture": 1, "Star Duster": "You take 10% less damage from airborne enemies."}, requirements: {"power": 10}, rarity: "legendary" }),
    "Steel Pauldrons": new equipmentData({ name: "Steel Pauldrons", type: "arms", pips: ["uncommon"], innate: {"health": 2}, requirements: {}, rarity: "uncommon" }),
    "Tracker's Brace": new equipmentData({ name: "Tracker's Brace", type: "arms", pips: ["rare", "rare"], innate: {"health": 3, "posture": 1}, requirements: {}, rarity: "rare" }),
    "Vanguard Brace": new equipmentData({ name: "Vanguard Brace", type: "arms", pips: ["rare", "rare"], innate: {"health": 3, "posture": 1, "Replenishing Knockout": "You gain more health and posture from downing enemies."}, requirements: {}, rarity: "rare" }),
    "Warden Pauldrons": new equipmentData({ name: "Warden Pauldrons", type: "arms", pips: ["legendary"], innate: {"health": 10, "posture": 2}, requirements: {}, rarity: "legendary" }),
    "White Overcoat": new equipmentData({ name: "White Overcoat", type: "arms", pips: ["uncommon"], innate: {"health": 2}, requirements: {}, rarity: "rare" }),
    "White Parka": new equipmentData({ name: "White Parka", type: "arms", pips: ["uncommon", "rare"], innate: {"health": 2, "Steady Footing": "You're much more resistant to being pushed around."}, requirements: {}, rarity: "rare" }),
    "Winter Corps Parka": new equipmentData({ name: "Winter Corps Parka", type: "arms", pips: ["rare", "rare"], innate: {"health": 6, "posture": 2, "frost": 5, "gale": 5, "Winter's Protection": "Your tightly-bound winter gear negates elemental damage buffs from weather on damage against you."}, requirements: {}, rarity: "rare" }),
    "Woodland Pauldrons": new equipmentData({ name: "Woodland Pauldrons", type: "arms", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    // #endregion
    // #region LEGS EQUIPMENT
    "Autumn Boots": new equipmentData({ name: "Autumn Boots", type: "legs", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Azure Royal Guard Boots": new equipmentData({ name: "Azure Royal Guard Boots", type: "legs", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Bluesteel Boots": new equipmentData({ name: "Bluesteel Boots", type: "legs", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Brilliant Boots": new equipmentData({ name: "Brilliant Boots", type: "legs", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Celtorian Sabatons": new equipmentData({ name: "Celtorian Sabatons", type: "legs", pips: ["rare", "rare"], innate: {"health": 4}, requirements: {}, rarity: "rare" }),
    "Enforcer Boots": new equipmentData({ name: "Enforcer Boots", type: "legs", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "common" }),
    "Etrean Siege Sabatons": new equipmentData({ name: "Etrean Siege Sabatons", type: "legs", pips: ["uncommon", "rare", "rare"], innate: {"health": 4}, requirements: {}, rarity: "rare" }),
    "Flameguard Boots": new equipmentData({ name: "Flameguard Boots", type: "legs", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "common" }),
    "Fur Boots": new equipmentData({ name: "Fur Boots", type: "legs", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Grand Authority Sabatons": new equipmentData({ name: "Grand Authority Sabatons", type: "legs", pips: ["rare", "rare"], innate: {"health": 4}, requirements: {}, rarity: "rare" }),
    "Grand Boots": new equipmentData({ name: "Grand Boots", type: "legs", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Imperial Boots": new equipmentData({ name: "Imperial Boots", type: "legs", pips: ["rare", "rare", "legendary"], innate: {"health": 5}, requirements: {}, rarity: "uncommon" }),
    "Iron Boots": new equipmentData({ name: "Iron Boots", type: "legs", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "common" }),
    "Khan Boots": new equipmentData({ name: "Khan Boots", type: "legs", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Leather Boots": new equipmentData({ name: "Leather Boots", type: "legs", pips: ["common"], innate: {}, requirements: {}, rarity: "common" }),
    "Mercenary's Boots": new equipmentData({ name: "Mercenary's Boots", type: "legs", pips: ["rare", "rare", "legendary"], innate: {"health": 2, "Endurance Runner": "Even when things look dire, you still have it in you to keep your legs moving."}, requirements: {}, rarity: "rare" }),
    "Novice Boots": new equipmentData({ name: "Novice Boots", type: "legs", pips: ["rare", "rare"], innate: {"health": 2}, requirements: {}, rarity: "rare" }),
    "Phalanx Heavy Boots": new equipmentData({ name: "Phalanx Heavy Boots", type: "legs", pips: ["rare", "rare", "legendary"], innate: {}, requirements: {}, rarity: "rare" }),
    "Ranger's Boots": new equipmentData({ name: "Ranger's Boots", type: "legs", pips: ["rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Redsteel Boots": new equipmentData({ name: "Redsteel Boots", type: "legs", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Silver Sabatons": new equipmentData({ name: "Silver Sabatons", type: "legs", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Star Boots": new equipmentData({ name: "Star Boots", type: "legs", pips: ["rare", "rare", "legendary"], innate: {"health": 5}, requirements: {"power": 10}, rarity: "rare" }),
    "Tracker's Boots": new equipmentData({ name: "Tracker's Boots", type: "legs", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Vanguard Boots": new equipmentData({ name: "Vanguard Boots", type: "legs", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Winter Corps Boots": new equipmentData({ name: "Winter Corps Boots", type: "legs", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    "Woodland Boots": new equipmentData({ name: "Woodland Boots", type: "legs", pips: ["rare", "rare"], innate: {"health": 3}, requirements: {}, rarity: "rare" }),
    // #endregion
    // #region TORSO EQUIPMENT
    "Black Cape": new equipmentData({ name: "Black Cape", type: "torso", pips: ["legendary"], innate: {"physical": 3}, requirements: {}, rarity: "uncommon" }),
    "Brilliant Cape": new equipmentData({ name: "Brilliant Cape", type: "torso", pips: ["legendary"], innate: {"elemental": 3}, requirements: {}, rarity: "uncommon" }),
    "Canticlysm Pendant": new equipmentData({ name: "Canticlysm Pendant", type: "torso", pips: ["rare", "legendary"], innate: {"elemental": 3}, requirements: {}, rarity: "rare" }),
    "Confessor's Charm": new equipmentData({ name: "Confessor's Charm", type: "torso", pips: ["rare", "legendary"], innate: {"physical": 3}, requirements: {}, rarity: "rare" }),
    "Curseblood Pendant": new equipmentData({ name: "Curseblood Pendant", type: "torso", pips: ["legendary"], innate: {"elemental": 3}, requirements: {}, rarity: "rare" }),
    "Dark Owl Cape": new equipmentData({ name: "Dark Owl Cape", type: "torso", pips: ["legendary"], innate: {"stealth": 6, "shadow": 5}, requirements: {}, rarity: "rare" }),
    "Fleet Warden Cape": new equipmentData({ name: "Fleet Warden Cape", type: "torso", pips: ["legendary"], innate: {"elemental": 3}, requirements: {"power": 13}, rarity: "uncommon" }),
    "Golden Cape": new equipmentData({ name: "Golden Cape", type: "torso", pips: ["legendary"], innate: {"physical": 3}, requirements: {}, rarity: "uncommon" }),
    "Grand Pathfinder's Backpack": new equipmentData({ name: "Grand Pathfinder's Backpack", type: "torso", pips: ["rare", "rare"], innate: {"carry": 50, "Robber Baron": "You hold onto more items when defeated."}, requirements: {}, rarity: "rare" }),
    "Monastery Champion Beads": new equipmentData({ name: "Monastery Champion Beads", type: "torso", pips: ["legendary"], innate: {"elemental": 3}, requirements: {}, rarity: "legendary" }),
    "Nomad Pendant": new equipmentData({ name: "Nomad Pendant", type: "torso", pips: ["legendary"], innate: {"elemental": 3}, requirements: {}, rarity: "rare" }),
    "Old World Sun Pendant": new equipmentData({ name: "Old World Sun Pendant", type: "torso", pips: ["rare", "legendary"], innate: {}, requirements: {}, rarity: "rare" }),
    "Pathfinder Lantern": new equipmentData({ name: "Pathfinder Lantern", type: "torso", pips: ["uncommon"], innate: {"sanity": 10, "Breathing Excercise": "Your sanity recovers more quickly once out of terrifying situations."}, requirements: {}, rarity: "common" }),
    "Pathfinder's Backpack": new equipmentData({ name: "Pathfinder's Backpack", type: "torso", pips: ["uncommon"], innate: {"carry": 35, "Robber Baron": "You hold onto more items when defeated."}, requirements: {}, rarity: "uncommon" }),
    "Red Eye Pendant": new equipmentData({ name: "Red Eye Pendant", type: "torso", pips: ["legendary"], innate: {"elemental": 3}, requirements: {}, rarity: "rare" }),
    "Sandrunner Scarf": new equipmentData({ name: "Sandrunner Scarf", type: "torso", pips: ["rare", "legendary"], innate: {"flame": 3}, requirements: {}, rarity: "rare" }),
    "Scarf": new equipmentData({ name: "Scarf", type: "torso", pips: ["rare", "legendary"], innate: {"elemental": 3}, requirements: {}, rarity: "rare" }),
    "Seafarer Pendant": new equipmentData({ name: "Seafarer Pendant", type: "torso", pips: ["legendary"], innate: {}, requirements: {}, rarity: "rare" }),
    "Shrouded Cape": new equipmentData({ name: "Shrouded Cape", type: "torso", pips: ["rare", "legendary"], innate: {"stealth": 5}, requirements: {}, rarity: "rare" }),
    "Varicosa Medallion": new equipmentData({ name: "Varicosa Medallion", type: "torso", pips: ["rare", "legendary"], innate: {"shadow": 3}, requirements: {}, rarity: "rare" }),
    "Whaler Scarf": new equipmentData({ name: "Whaler Scarf", type: "torso", pips: ["legendary"], innate: {"elemental": 3}, requirements: {}, rarity: "rare" }),
    "Wormwarder Lantern": new equipmentData({ name: "Wormwarder Lantern", type: "torso", pips: [], innate: {"carry": 10}, requirements: {}, rarity: "rare" }),
    "Lightkeeper's Medallion": new equipmentData({ name: "Lightkeeper's Medallion", type: "torso", pips: [], innate: {"Elegy of Light": "UNKNOWN"}, requirements: {}, rarity: "relic" }), // MISSING TALENT DESCRIPTION
    "Tiran Pendant": new equipmentData({ name: "Tiran Pendant", type: "torso", pips: [], innate: {"Featherfall": "UNKNOWN"}, requirements: {}, rarity: "relic" }), // MISSING TALENT DESCRIPTION
    "Warmaster's Medallion": new equipmentData({ name: "Warmaster's Medallion", type: "torso", pips: [], innate: {"Actions Speak Louder": "Your Critical Attack cooldown is 20% shorter, but your Resonance cooldown is double as long. In areas where your Resonance is suppressed, reduces your cooldown by 5% instead."}, requirements: {}, rarity: "relic" }),
    // #endregion
    // #region FACE EQUIPMENT
    "Aristocrat Eyeglasses": new equipmentData({ name: "Aristocrat Eyeglasses", type: "face", pips: ["rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Black Blindfold": new equipmentData({ name: "Black Blindfold", type: "face", pips: ["common"], innate: {"Blinded": "Your vision is obscured by something. Somehow, you feel safer. You remember the warmth of your youth."}, requirements: {}, rarity: "rare" }),
    "Blindfold": new equipmentData({ name: "Blindfold", type: "face", pips: [], innate: {"Blinded": "Your vision is obscured by something. Somehow, you feel safer. You remember the warmth of your youth."}, requirements: {}, rarity: "rare" }),
    "Bloodfeather Mask": new equipmentData({ name: "Bloodfeather Mask", type: "face", pips: ["rare"], innate: {"shadow": 5}, requirements: {}, rarity: "rare" }),
    "Crimson Blindfold": new equipmentData({ name: "Crimson Blindfold", type: "face", pips: ["common"], innate: {"Blinded": "Your vision is obscured by something. Somehow, you feel safer. You remember the warmth of your youth."}, requirements: {}, rarity: "rare" }),
    "Demon Mask": new equipmentData({ name: "Demon Mask", type: "face", pips: ["rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Duelist's Mask": new equipmentData({ name: "Duelist's Mask", type: "face", pips: ["rare"], innate: {"stealth": 6}, requirements: {}, rarity: "rare" }),
    "Eyeglasses": new equipmentData({ name: "Eyeglasses", type: "face", pips: ["common"], innate: {}, requirements: {}, rarity: "rare" }),
    "Black Headband": new equipmentData({ name: "Black Headband", type: "face", pips: ["common"], innate: {}, requirements: {}, rarity: "rare" }),
    "Red Headband": new equipmentData({ name: "Red Headband", type: "face", pips: ["uncommon"], innate: {}, requirements: {}, rarity: "rare" }),
    "Blue Headband": new equipmentData({ name: "Blue Headband", type: "face", pips: ["rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Hivelord Mask": new equipmentData({ name: "Hivelord Mask", type: "face", pips: ["rare", "rare"], innate: {"shadow": 5}, requirements: {}, rarity: "rare" }),
    "Iron Mask": new equipmentData({ name: "Iron Mask", type: "face", pips: ["common"], innate: {}, requirements: {}, rarity: "rare" }),
    "Nauticals": new equipmentData({ name: "Nauticals", type: "face", pips: ["rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Polarized Eyeglasses": new equipmentData({ name: "Polarized Eyeglasses", type: "face", pips: ["common"], innate: {}, requirements: {}, rarity: "rare" }),
    "Rebel's Bandana": new equipmentData({ name: "Rebel's Bandana", type: "face", pips: ["uncommon"], innate: {}, requirements: {}, rarity: "rare" }),
    "Royal Guard": new equipmentData({ name: "Royal Guard", type: "face", pips: ["uncommon", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Smith's Goggles": new equipmentData({ name: "Smith's Goggles", type: "face", pips: ["common"], innate: {}, requirements: {}, rarity: "rare" }),
    "Ten Gallon Bandana": new equipmentData({ name: "Ten Gallon Bandana", type: "face", pips: ["uncommon"], innate: {}, requirements: {}, rarity: "rare" }),
    "The Guy's Eyeglasses": new equipmentData({ name: "The Guy's Eyeglasses", type: "face", pips: ["common"], innate: {}, requirements: {}, rarity: "rare" }),
    "Warrior's Eyepatch": new equipmentData({ name: "Warrior's Eyepatch", type: "face", pips: ["rare"], innate: {}, requirements: {}, rarity: "uncommon" }),
    // #endregion
    // #region EARS EQUIPMENT
    "Amethyst Pendant Earrings": new equipmentData({ name: "Amethyst Pendant Earrings", type: "ears", pips: ["common", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Crystal Pendant Earrings": new equipmentData({ name: "Crystal Pendant Earrings", type: "ears", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Dew Drop Earrings": new equipmentData({ name: "Dew Drop Earrings", type: "ears", pips: ["common", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Emerald Tusk Earrings": new equipmentData({ name: "Emerald Tusk Earrings", type: "ears", pips: ["common", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Master Thief Earrings": new equipmentData({ name: "Master Thief Earrings", type: "ears", pips: ["rare", "rare"], innate: {"stealth": 3}, requirements: {}, rarity: "rare" }),
    "Moonlit Earrings": new equipmentData({ name: "Moonlit Earrings", type: "ears", pips: ["rare", "rare"], innate: {"health": 2}, requirements: {}, rarity: "rare" }),
    "Old Blood Earrings": new equipmentData({ name: "Old Blood Earrings", type: "ears", pips: ["rare", "rare"], innate: {"ether": 5}, requirements: {}, rarity: "rare" }),
    "Pendant Earrings": new equipmentData({ name: "Pendant Earrings", type: "ears", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Practicioner's Earrings": new equipmentData({ name: "Practicioner Earrings", type: "ears", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Ruby Drop Earrings": new equipmentData({ name: "Ruby Drop Earrings", type: "ears", pips: ["common", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Ruby Pendant Earrings": new equipmentData({ name: "Ruby Pendant Earrings", type: "ears", pips: ["common", "rare"], innate: {}, requirements: {}, rarity: "rare" }),
    // #endregion
    // #region RING EQUIPMENT
    "Akira's Ring": new equipmentData({ name: "Akira's Ring", type: "rings", pips: ["legendary"], innate: {}, requirements: {"power": 6}, rarity: "legendary" }),
    "Bloodiron Ring": new equipmentData({ name: "Bloodiron Ring", type: "rings", pips: ["uncommon"], innate: {}, requirements: {}, rarity: "rare" }),
    "Armorer's Ring": new equipmentData({ name: "Armorer's Ring", type: "rings", pips: ["uncommon"], innate: {}, requirements: {}, rarity: "rare" }),
    "Dawnfist's Ring": new equipmentData({ name: "Dawnfist's Ring", type: "rings", pips: ["legendary"], innate: {}, requirements: {"power": 6}, rarity: "legendary" }),
    "Dazed Band": new equipmentData({ name: "Dazed Band", type: "rings", pips: ["uncommon"], innate: {}, requirements: {"power": 3}, rarity: "rare" }),
    "Deepfire Ring": new equipmentData({ name: "Deepfire Ring", type: "rings", pips: [], innate: {}, requirements: {"power": 5}, rarity: "legendary" }),
    "Finisher's Ring": new equipmentData({ name: "Finisher's Ring", type: "rings", pips: [], innate: {}, requirements: {"power": 13}, rarity: "legendary" }),
    "Freestyler's Band": new equipmentData({ name: "Freestyler's Band", type: "rings", pips: [], innate: {}, requirements: {"power": 3}, rarity: "rare" }),
    "Gold Ring": new equipmentData({ name: "Gold Ring", type: "rings", pips: ["uncommon"], innate: {}, requirements: {}, rarity: "uncommon" }),
    "Heavy Hands Ring": new equipmentData({ name: "Heavy Hands Ring", type: "rings", pips: ["uncommon"], innate: {}, requirements: {}, rarity: "rare" }),
    "Isshin's Ring": new equipmentData({ name: "Isshin's Ring", type: "rings", pips: [], innate: {}, requirements: {"power": 5}, rarity: "rare" }),
    "Konga's Clutch Ring": new equipmentData({ name: "Konga's Clutch Ring", type: "rings", pips: [], innate: {}, requirements: {"power": 3}, rarity: "uncommon" }),
    "Diver's Ring": new equipmentData({ name: "Diver's Ring", type: "rings", pips: ["uncommon"], innate: {}, requirements: {}, rarity: "rare" }),
    "Light Eater Ring": new equipmentData({ name: "Light Eater Ring", type: "rings", pips: ["uncommon"], innate: {"flame": 2, "thunder": 2}, requirements: {"power": 3}, rarity: "rare" }),
    "Maestro's Ring": new equipmentData({ name: "Maestro's Ring", type: "rings", pips: ["legendary"], innate: {}, requirements: {"power": 6}, rarity: "legendary" }),
    "Moon Ring": new equipmentData({ name: "Moon Ring", type: "rings", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "legendary" }),
    "Pariah's Keepsake": new equipmentData({ name: "Pariah's Keepsake", type: "rings", pips: [], innate: {}, requirements: {"power": 3}, rarity: "rare" }),
    "Poser's Ring": new equipmentData({ name: "Poser's Ring", type: "rings", pips: ["rare"], innate: {}, requirements: {}, rarity: "rare" }),
    "Prophet's Ring": new equipmentData({ name: "Prophet's Ring", type: "rings", pips: ["legendary"], innate: {}, requirements: {"power": 6}, rarity: "legendary" }),
    "Purifying Ring": new equipmentData({ name: "Purifying Ring", type: "rings", pips: ["uncommon"], innate: {}, requirements: {}, rarity: "rare" }),
    "Ring of Casters": new equipmentData({ name: "Ring of Casters", type: "rings", pips: [], innate: {}, requirements: {"power": 13}, rarity: "rare" }),
    "Ring of Curses": new equipmentData({ name: "Ring of Curses", type: "rings", pips: [], innate: {}, requirements: {"power": 10}, rarity: "rare" }),
    "Ring of Pestillence": new equipmentData({ name: "Ring of Pestillence", type: "rings", pips: [], innate: {}, requirements: {}, rarity: "rare" }),
    "Ring of Wisps": new equipmentData({ name: "Ring of Wisps", type: "rings", pips: ["uncommon"], innate: {}, requirements: {}, rarity: "rare" }),
    "Rosen's Ring": new equipmentData({ name: "Rosen's Ring", type: "rings", pips: ["legendary"], innate: {}, requirements: {"power": 6}, rarity: "legendary" }),
    "Silver Ring": new equipmentData({ name: "Silver Ring", type: "rings", pips: ["common"], innate: {}, requirements: {}, rarity: "common" }),
    "Waning Ring": new equipmentData({ name: "Waning Ring", type: "rings", pips: ["rare", "rare"], innate: {}, requirements: {}, rarity: "legendary" }),
    "Windmill Ring": new equipmentData({ name: "Windmill Ring", type: "rings", pips: ["uncommon"], innate: {"frost": 2, "gale": 2}, requirements: {"power": 3}, rarity: "rare" }),
    // #endregion
}

export function getPipValue(pip, type, rarity) {
    if (typeof pips[pip] === "undefined") {
        log.warn(`invalid pip: ${pip}`);
        return 0;
    }
    if (typeof pips[pip].data[type] === "undefined") {
        log.warn(`invalid type: ${type}`);
        return 0;
    }
    if (typeof pips[pip].data[type][rarity] === "undefined") {
        log.warn(`invalid rarity: ${rarity}`);
        return 0;
    }
    return pips[pip].data[type][rarity];
}

export function getRandomEquipmentName(category) {
    let pool = Object.keys(equipment)
    if (category) {
        pool = pool.filter(e => equipment[e].type === category)
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

export function getEquipment(name) {
    if (equipment[name]) {
        return equipment[name];
    }
    const matchingEquipment = Object.keys(equipment).filter(equipmentName => equipmentName.toLowerCase().replaceAll("'", "").startsWith(name.toLowerCase().replaceAll("'", "")));
    return matchingEquipment.length > 0 ? equipment[matchingEquipment[0]] : null;
}

export const minimumPipsForSameTypeCheck = {
    "torso": 2,
    "head": 3,
    "arms": 3,
    "legs": 3,
    "face": 2,
    "ears": 2,
    "rings": 2
}

export const starAdditions = {
    0: [],
    1: ["rare"],
    2: ["rare", "rare"],
    3: ["rare", "rare", "legendary"],
}
export const starHealthAdditions = {
    0: 0,
    1: 1,
    2: 2,
    3: 3
}
export const starHealthAdditionTypes = ["head", "arms", "legs"]

export function getRandomPipName() {
    return Object.keys(pips)[Math.floor(Math.random() * Object.keys(pips).length)];
}

const starChances = {
    0: 0.50,
    1: 0.30,
    2: 0.15,
    3: 0.05
}

export function getRandomStar() {
    const rand = Math.random();
    if (rand <= starChances[0]) {
        return 0;
    } else if (rand <= starChances[0] + starChances[1]) {
        return 1;
    } else if (rand <= starChances[0] + starChances[1] + starChances[2]) {
        return 2;
    } else {
        return 3;
    }
}

export function getRandomPip(type, pipRarity, blacklistedPip) {
    let pip = getRandomPipName();
    let pipValue = 0;
    let tries = 0;
    while (pipValue == 0 || pip === blacklistedPip) {
        pip = getRandomPipName();
        pipValue = getPipValue(pip, type, pipRarity);
        tries++;
        if (tries > 50) {
            break;
        }
    }
    if (tries > 50) {
        const allPossiblePips = Object.keys(pips);
        for (let j = 0; j < allPossiblePips.length; j++) {
            pip = allPossiblePips[j];
            pipValue = getPipValue(pip, type, pipRarity);
            if (pipValue !== 0 && pip !== blacklistedPip) {
                break;
            }
        }
    }
    if (pipValue == 0) {
        return undefined
    }
    return { pip: pip, value: pipValue, rarity: pipRarity, displayAsPercentage: pips[pip].displayAsPercentage };
}

export function rollPips(pips, type) {
    let rolledPips = [];
    pips.forEach(pipRarity => {
        rolledPips.push(getRandomPip(type, pipRarity));
    })
    return rolledPips;
}

const pipPriority = {
    "legendary": 3,
    "rare": 2,
    "uncommon": 1,
    "common": 0
}

export function getHighestPipValue(pips, type, pip, checkForSameType) {
    let rolledPips = [];
    pips.forEach(pipRarity => {
        let pipValue = getPipValue(pip, type, pipRarity);
        if (pipValue !== 0) {
            rolledPips.push({ pip: pip, value: pipValue, rarity: pipRarity });
        }
    })
    if (checkForSameType && rolledPips.length > 0) {
        let lowestPriorityPip = rolledPips.reduce((prev, current) => (pipPriority[prev.rarity] < pipPriority[current.rarity]) ? prev : current);
        const lowestPriorityPipIndex = rolledPips.findIndex(pip => pip.rarity === lowestPriorityPip.rarity);
        const pipRarity = lowestPriorityPip.rarity;
        const newPip = getRandomPip(type, pipRarity, lowestPriorityPip.pip)
        rolledPips[lowestPriorityPipIndex] = newPip;
    }
    return rolledPips
}

export const maxStarBlacklistTypes = ["face", "ears", "rings", "torso"]

export function calculateEquipmentStats(equipment, forceStar, highestPip) {
    const requestedEquipment = equipment.name || equipment;
    if (typeof equipment == "string") {
        equipment = getEquipment(equipment);
    }
    if (!equipment) {
        log.warn(`invalid equipment: ${requestedEquipment}`);
        return;
    }
    let pips = equipment.pips;
    const innate = equipment.innate;
    const type = equipment.type;
    let stars = getRandomStar()
    let checkForSameType = false
    if (typeof forceStar === "number") {
        stars = forceStar;
    } else if (maxStarBlacklistTypes.includes(type) && stars === 3) {
        stars = 2;
    }
    const flagInvalidStar = maxStarBlacklistTypes.includes(type) && stars === 3;
    const starPips = starAdditions[stars];
    const starHealth = starHealthAdditions[stars];
    const mergedPips = [...pips, ...starPips];
    if (mergedPips.length >= minimumPipsForSameTypeCheck[type]) {
        checkForSameType = true
    }
    let rolledPips
    if (typeof highestPip === "string") {
        rolledPips = getHighestPipValue(mergedPips, type, highestPip, checkForSameType);
    } else {
        rolledPips = rollPips(mergedPips, type);
        if (checkForSameType) {
            while ((rolledPips.length > 1 ) ? false : rolledPips.every(pip => pip.pip === rolledPips[0].pip)) {
                rolledPips = rollPips(mergedPips, type);
            }
        }
    }
    if (starHealth > 0) {
        if (starHealthAdditionTypes.includes(type)) {
            rolledPips.push({ pip: "health", value: starHealth, rarity: "star" });
        }
    }
    return new processedEquipment({ name: equipment.name, type: type, pips: rolledPips, innate: innate, requirements: equipment.requirements, stars: stars, flagInvalidStar: flagInvalidStar, rarity: equipment.rarity });
}