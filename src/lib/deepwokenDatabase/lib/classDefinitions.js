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

export class requirements {
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