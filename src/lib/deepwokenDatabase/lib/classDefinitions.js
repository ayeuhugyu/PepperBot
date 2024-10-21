import * as Enum from "./enumDefinitions.js"

// Data Structures

export class statDistribution {
    attunement = {
        flamecharm: 0,
        frostdraw: 0,
        thundercall: 0,
        galebreathe: 0,
        shadowcast: 0,
        ironsing: 0
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

export class mantraSlots {
    "combat" = 0
    "mobility" = 0
    "support" = 0
    "wildcard" = 0
}

export class characterStats {
    "level" = 0
    "health" = 0
    "ether" = 0
    "sanity" = 0
    "posture" = 0
    "carry_load" = 0
    "dvm" = 0
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
        "iron": 0
    }
    "mantra_slots" = new mantraSlots()
}

export class characterData { // previously named requirements, is used for requirements & passives & other things etc.
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

export class talentCategory {
    "name" = "talentCategory_name"
    "rich_name" = "Talent Category Rich Name"
    "mystic" = "mystic_dialogue"
    "talents" = [
        "talent_name"
    ]
}

export class talent {
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

export class weapon {
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

export class stat {
    "name" = "stat_name"
    "rich_name" = "Stat Rich Name"
    "description" = "stat_description"
    "shortform" = "stat_shortform"
    "category" = Enum.StatCategory.BASE
}

export class resonance {
    "name" = "resonance_name"
    "rich_name" = "Resonance Rich Name"
    "description" = "resonance_description"
    "rarity" = Enum.ResonanceRarity.NORMAL
    "corrupted" = false
    "corruptionDownside" = Enum.CorruptionDownside.NONE
}

export class questReward {
    "type" = "##enums/questRewardType"
    "value" = {} // TODO: finish this
}

export class quest {
    "name" = "quest_name"
    "rich_name" = "Quest Rich Name"
    "description" = "quest_description"
    "questgiver" = "npc_name"
    "rewards" = [
        new questReward()
    ]
}

export class oathProgression {
    "level" = 0
    "talents" = [
        "talent_name"
    ]
    "mantras" = [
        "mantra_name"
    ]
}

export class oath {
    "name" = "oath_name"
    "rich_name" = "Oath Rich Name"
    "description" = "oath_description"
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

export class dialogue {
    "id" = 0
    "text" = "dialogue_text"
    "next" = 0
}

export class npc {
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

export class murmur {
    "name" = "murmur_name"
    "rich_name" = "Murmur Rich Name"
    "description" = "murmur_description"
    "requirements" = new characterData()
    "murmurGiver" = "npc_name"
}

export class mantra {
    "name" = "mantra_name"
    "rich_name" = "Mantra Rich Name"
    "description" = "mantra_description"
    "requirements" = new characterData()
    "mantra_type" = Enum.MantraType.COMBAT
}

export class location {
    "name" = "location_name"
    "rich_name" = "Location Rich Name"
    "description" = "location_description"
    "majorPlace" = "island_name"
    "territoryOf" = "faction_name"
}

export class faction {
    "name" = "faction_name"
    "rich_name" = "Faction Rich Name"
    "territories" = [
        "location_name"
    ]
}