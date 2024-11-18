import * as Enum from "./enumDefinitions.js"

function mergeObjects(target, source) {
    for (let key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] instanceof Object && !(source[key] instanceof Array)) {
                target[key] = target[key] || {};
                mergeObjects(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
}

export class Base {
    constructor(object) {
        if (!object) return;
        for (let key in object) {
            if (object.hasOwnProperty(key) && this.hasOwnProperty(key)) {
                if (object[key] instanceof Object && !(object[key] instanceof Array)) {
                    // If the property is an object, recursively merge its properties
                    this[key] = this[key] || {};
                    mergeObjects(this[key], object[key]);
                } else {
                    // If the property is not an object, set it directly
                    this[key] = object[key];
                }
            } else {
                console.error(`Key ${key} is not a valid key for ${this.constructor.name}; ignoring.`);
            }
        }
    }
}

// Data Structures

export class statDistribution extends Base {
    constructor(object) {
        super(object)
    }
    attunement = {
        flamecharm: 0,
        frostdraw: 0,
        thundercall: 0,
        galebreathe: 0,
        shadowcast: 0,
        ironsing: 0,
        bloodrend: 0,
        lifeweave: 0
    }
    weapon = {
        light: 0,
        medium: 0,
        heavy: 0
    }
    base = {
        strength: 0,
        fortitude: 0,
        agility: 0,
        intelligence: 0,
        willpower: 0,
        charisma: 0
    }
}

export class mantraSlots extends Base {
    constructor(object) {
        super(object)
    }
    "combat" = 0
    "mobility" = 0
    "support" = 0
    "wildcard" = 0
}

export class characterStats extends Base {
    constructor(object) {
        super(object)
    }
    "level" = 0
    "health" = 0
    "ether" = 0
    "sanity" = 0
    "posture" = 0
    "carry_load" = 0
    "dvm" = 0
    "stealth" = 0
    "weapon_type" = Enum.WeaponType.SWORD
    "murmur" = "murmur_name"
    "oath" = "oath_name"
    "resonance" = "resonance_name"
    "penetration" = {
        "melee": 0,
        "mantra": 0
    }
    "resistance" = {
        "physical": 0,
        "slash": 0,
        "blunt": 0,
        "elemental": 0,
        "fire": 0,
        "ice": 0,
        "lightning": 0,
        "wind": 0,
        "shadow": 0,
        "iron": 0,
        "blood": 0,
        "life": 0
    }
    "mantra_slots" = new mantraSlots()
    "reputation" = { // 0 = neutral, 1 to 149 = friendly, 150 to 299 = allied, 300 = hero. -1 to -149 = enemy, -150 to -299 = hunted, -300 = villan
        "faction_name": 0
    } // TODO: expand this to always include all factions, rather than doing it like this.
}

export class characterData extends Base { // previously named requirements, is used for requirements & passives & other things etc.
    constructor(object) {
        super(object)
    }
    "character" = new characterStats()
    "stats" = new statDistribution()
    "talents" = [
        "talent_name"
    ]
    "mantras" = [
        "mantra_name"
    ]
    "quests" = [
        "quest_name"
    ]
}

// Real Things

export class talentCategory extends Base {
    constructor(object) {
        super(object)
    }
    "name" = "talentCategory_name"
    "rich_name" = "Talent Category Rich Name"
    "mystic" = "mystic_dialogue"
    "talents" = [
        "talent_name"
    ]
}

export class talent extends Base {
    constructor(object) {
        super(object)
    }
    "name" = "talent_name"
    "rich_name" = "Talent Rich Name"
    "description" = "talent_description"
    "rarity" = Enum.TalentRarity.COMMON
    "requirements" = new characterData()
    "category" = "talentCategory_name"
    "quests" = [
        "##classes/quest"
    ]
    "echo" = false
    "passives" = new characterData()
}

export class weapon extends Base {
    constructor(object) {
        super(object)
    }
    "name" = "weapon_name"
    "rich_name" = "Weapon Rich Name"
    "description" = "weapon_description"
    "requirements" = new characterData()
    "stats" = {
        "damage": 0,
        "penetration": 0,
        "chip": 0,
        "scaling": new statDistribution(),
        "weight": 0,
        "range": 0,
        "speed": 0,
        "endlag": 0
    }
    "type" = Enum.WeaponType.SWORD
    "rarity" = Enum.ItemRarity.COMMON
}

export class stat extends Base {
    constructor(object) {
        super(object)
    }
    "name" = "stat_name"
    "rich_name" = "Stat Rich Name"
    "description" = "stat_description"
    "shortform" = "stat_shortform"
    "category" = Enum.StatCategory.BASE
}

export class resonance extends Base {
    constructor(object) {
        super(object)
    }
    "name" = "resonance_name"
    "rich_name" = "Resonance Rich Name"
    "description" = "resonance_description"
    "rarity" = Enum.ResonanceRarity.NORMAL
    "corrupted" = false
    "corruptionDownside" = Enum.CorruptionDownside.NONE
}

export class questReward extends Base {
    constructor(object) {
        super(object)
    }
    "type" = "##enums/questRewardType"
    "value" = {} // TODO: finish this
}

export class quest extends Base {
    constructor(object) {
        super(object)
    }
    "name" = "quest_name"
    "rich_name" = "Quest Rich Name"
    "description" = "quest_description"
    "questgiver" = "npc_name"
    "rewards" = [
        new questReward()
    ]
}

export class oathProgression extends Base {
    constructor(object) {
        super(object)
    }
    "level" = 0
    "talents" = [
        "talent_name"
    ]
    "mantras" = [
        "mantra_name"
    ]
}

export class oath extends Base {
    constructor(object) {
        super(object)
    }
    "name" = "oath_name"
    "rich_name" = "Oath Rich Name"
    "description" = "oath_description"
    "cumulative_stats" = false
    "requirements" = new characterData()
    "oathgiver" = "npc_name"
    "mantraSlots" = new mantraSlots()
    "talents" = [
        "talent_name"
    ]
    "mantras" = [
        "mantra_name"
    ]
    "progression" = [
        new oathProgression()
    ]
}

export class dialogue extends Base {
    constructor(object) {
        super(object)
    }
    "id" = 0
    "text" = "dialogue_text"
    "next" = 0
}

export class npc extends Base {
    constructor(object) {
        super(object)
    }
    "name" = "npc_name"
    "rich_name" = "NPC Rich Name"
    "dialogue" = [
        new dialogue()
    ]
    "quests" = [
        "quest_name"
    ]
    "oath" = "oath_name"
    "murmur" = "murmur_name"
}

export class murmur extends Base {
    constructor(object) {
        super(object)
    }
    "name" = "murmur_name"
    "rich_name" = "Murmur Rich Name"
    "description" = "murmur_description"
    "requirements" = new characterData()
    "murmurGiver" = "npc_name"
}

export class mantra extends Base {
    constructor(object) {
        super(object)
    }
    "name" = "mantra_name"
    "rich_name" = "Mantra Rich Name"
    "description" = "mantra_description"
    "requirements" = new characterData()
    "mantra_type" = Enum.MantraType.COMBAT
}

export class location extends Base {
    constructor(object) {
        super(object)
    }
    "name" = "location_name"
    "rich_name" = "Location Rich Name"
    "description" = "location_description"
    "majorPlace" = "island_name"
    "territoryOf" = "faction_name"
}

export class faction extends Base {
    constructor(object) {
        super(object)
    }
    "name" = "faction_name"
    "rich_name" = "Faction Rich Name"
    "territories" = [
        "location_name"
    ]
}

export class equipment extends Base {
    constructor(object) {
        super(object)
    }
    "name" = "equipment_name"
    "rich_name" = "Equipment Rich Name"
    "description" = "equipment_description"
    "requirements" = new characterData()
    "variants" = [
        "equipment_name"
    ]
    "selling_price" = 0
    "rarity" = Enum.ItemRarity.COMMON
    "pips" = [
        Enum.PipRarity.COMMON
    ]
    "obtained_from" = {
        "locations": [
            "location_name"
        ],
        "npcs": [
            "npc_name"
        ],
        "monsters": [
            "monster_name"
        ],
        "other": [
            "other_chest_name"
        ]
    }
    "innate" = new characterData()
}