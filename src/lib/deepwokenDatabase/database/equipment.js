import * as Enum from '../lib/enumDefinitions.js'
import * as classes from '../lib/classDefinitions.js'

export default {
    // #region HEAD EQUIPMENT
    alchemists_hat: new classes.equipment({
        "name": "alchemists_hat",
        "rich_name": "Alchemist's Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "big_alchemists_hat"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipRarity.UNCOMMON,
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
                "the_depths",
            ],
            "enemies": [],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": [
                "bounty_chest"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [
                "apothecary",
                "pitcher"
            ],
            "mantras": []
        })
    }),
    big_alchemists_hat: new classes.equipment({
        "name": "big_alchemists_hat",
        "rich_name": "Big Alchemist's Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "alchemists_hat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
                "the_depths",
            ],
            "enemies": [],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [
                "apothecary",
                "pitcher"
            ],
            "mantras": []
        })
    }),
    herbalists_hat: new classes.equipment({
        "name": "herbalists_hat",
        "rich_name": "Herbalist's Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "big_herbalists_hat"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipRarity.UNCOMMON,
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
                "the_depths",
            ],
            "enemies": [],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": [
                "bounty_chest"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [
                "iron_gut",
                "herbivore"
            ],
            "mantras": []
        })
    }),
    big_herbalists_hat: new classes.equipment({
        "name": "big_herbalists_hat",
        "rich_name": "Big Herbalist's Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "herbalists_hat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
            ],
            "enemies": [],
            "bosses": [
                "maestro_evengarde_rest",
                "duke_erisia"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [
                "iron_gut",
                "herbivore"
            ],
            "mantras": []
        })
    }),
    pale_assassins_hood: new classes.equipment({
        "name": "pale_assassins_hood",
        "rich_name": "Pale Assassin's hood",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 6
            }),
            "stats": new classes.statDistribution({
                "agility": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "gold_assassins_hood",
            "crimson_assassins_hood",
            "mist_assassins_hood"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
            ],
            "enemies": [],
            "bosses": [
                "primadon"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "stealth": 0.05
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "assassin"
            ],
            "mantras": []
        }),
    }),
    gold_assassins_hood: new classes.equipment({
        "name": "gold_assassins_hood",
        "rich_name": "Gold Assassin's hood",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 6
            }),
            "stats": new classes.statDistribution({
                "agility": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "pale_assassins_hood",
            "crimson_assassins_hood",
            "mist_assassins_hood"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [
                "cloaked_assassin"
            ],
            "bosses": [],
            "quests": [
                "aelita",
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "stealth": 0.05
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "assassin"
            ],
            "mantras": []
        }),
    }),
    crimson_assassins_hood: new classes.equipment({
        "name": "crimson_assassins_hood",
        "rich_name": "Crimson Assassin's hood",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 6
            }),
            "stats": new classes.statDistribution({
                "agility": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "pale_assassins_hood",
            "gold_assassins_hood",
            "mist_assassins_hood"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [
                "cloaked_assassin"
            ],
            "bosses": [],
            "quests": [
                "aelita",
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "stealth": 0.05
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "assassin"
            ],
            "mantras": []
        }),
    }),
    mist_assassins_hood: new classes.equipment({
        "name": "mist_assassins_hood",
        "rich_name": "Mist Assassin's hood",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 6
            }),
            "stats": new classes.statDistribution({
                "agility": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "pale_assassins_hood",
            "gold_assassins_hood",
            "crimson_assassins_hood"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [
                "cloaked_assassin"
            ],
            "bosses": [],
            "quests": [
                "aelita",
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "stealth": 0.05
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "assassin"
            ],
            "mantras": []
        }),
    }),
    authority_helm: new classes.equipment({
        "name": "authority_helm",
        "rich_name": "Authority Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "The standard-issue helmet of the Central Authority. The bearer's identity is stripped away, leaving only a faceless soldier in service of the world's salvation under the guiding hand of Sovereign Drallis Ehr, Overseer of Epochs. None have ever seen the true face of Lumen's Savior, and so too are his proxy's faces shrouded. Truly, the world is only illuminated by the will and grace of the Sovereign of Ages. Within this dark a blazing light.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({
                "fortitude": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
            ],
            "enemies": [
                "authority_commander",
                "authority_officer",
                "authority_peacekeeper",
            ],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "chaser"
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "strong_hold"
            ],
            "mantras": []
        })
    }),
    barrel_helm: new classes.equipment({
        "name": "barrel_helm",
        "rich_name": "Barrel Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "A sturdy helmet shaped like a barrel.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({
                "fortitude": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipRarity.UNCOMMON,
        ],
        "obtained_from": {
            "locations": [
                "the_depths",
                "the_eternal_gale"
            ],
            "enemies": [],
            "bosses": [
                "duke_erisia",
            ],
            "quests": [],
            "other": [
                "bounty_chest",
                "artifact_chest"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    black_hood: new classes.equipment({
        "name": "black_hood",
        "rich_name": "Black Hood",
        "type": Enum.EquipmentType.HEAD,
        "description": "A sleek black hood.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "brown_hood"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [],
        "obtained_from": {
            "locations": [
                "summer_isle",
                "the_depths"
            ],
            "enemies": [],
            "monsters": [
                "deep_widow"
            ],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": [
                "bounty_chest",
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "stealth": 0.04,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    brown_hood: new classes.equipment({
        "name": "brown_hood",
        "rich_name": "Brown Hood",
        "type": Enum.EquipmentType.HEAD,
        "description": "A sleek brown hood.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_hood"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [],
        "obtained_from": {
            "locations": [
                "summer_isle",
                "the_depths"
            ],
            "enemies": [],
            "monsters": [
                "deep_widow"
            ],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": [
                "bounty_chest",
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "stealth": 0.04,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    blackleaf_helm: new classes.equipment({
        "name": "blackleaf_helm",
        "rich_name": "Blackleaf Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({
                "fortitude": 20
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "goldleaf_helm"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "arate_island",
                "the_depths"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest"
            ],
            "quests": [],
            "other": [
                "war_mode",
                "chime_of_conflict"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "posture": 2
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "concussive_force"
            ],
            "mantras": []
        })
    }),
    goldleaf_helm: new classes.equipment({
        "name": "goldleaf_helm",
        "rich_name": "Goldleaf Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({
                "fortitude": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "blackleaf_helm"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
                "the_depths",
                "the_eternal_gale"
            ],
            "enemies": [
                "golden_warriror"
            ],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "chaser",
            ],
            "quests": [],
            "other": [
                "artifact_chest",
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    blacksteel_helm: new classes.equipment({
        "name": "blacksteel_helm",
        "rich_name": "Blacksteel Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "An imposing helmet made from blackened steel.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 8
            }),
            "stats": new classes.statDistribution({
                "fortitude": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "summer_isle",
                "the_depths"
            ],
            "enemies": [
                "blacksteel_pirate"
            ],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
            ],
            "quests": [],
            "other": [
                "chime_of_conflict",
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    black_strapped_hat: new classes.equipment({
        "name": "black_strapped_hat",
        "rich_name": "Black Strapped Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "A hat typically worn by those from the Central Luminant.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 6
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "double_strapped_hat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "the_depths"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "exterminator"
            ],
            "mantras": []
        })
    }),
    bloodfeather_cowl: new classes.equipment({
        "name": "bloodfeather_cowl",
        "rich_name": "Bloodfeather Cowl",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "the_eternal_gale"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "stealth": 0.06,
                "resistance": {
                    "shadow": 0.05
                }
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "bloodletter"
            ],
            "mantras": []
        })
    }),
    bloodforged_crown: new classes.equipment({
        "name": "bloodforged_crown",
        "rich_name": "Bloodforged Crown",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.MYTHICAL,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "chaser",
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "cauterized_wounds"
            ],
            "mantras": []
        })
    }),
    brigands_bicorn: new classes.equipment({
        "name": "brigands_bicorn",
        "rich_name": "Brigand's Bicorn",
        "type": Enum.EquipmentType.HEAD,
        "description": "Even outlaws need style.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 6
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "the_depths",
                "miners_landing",
                "summer_isle"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "chaser",
                "maestro_evengarde_rest",
                "duke_erisia"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "spare_nails",
                "emergency_repairs"
            ],
            "mantras": []
        })
    }),
    bulwark_helm: new classes.equipment({
        "name": "bulwark_helm",
        "rich_name": "Bulwark Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_depths",
                "miners_landing",
                "the_eternal_gale"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
                "duke_erisia"
            ],
            "quests": [],
            "other": [
                "hell_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "strong_hold",
            ],
            "mantras": []
        })
    }),
    captains_kabuto: new classes.equipment({
        "name": "captains_kabuto",
        "rich_name": "Captain's Kabuto",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "guards_kabuto",
            "royal_guards_kabuto"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "the_depths",
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
                "duke_erisia"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 8,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    celtor_commander_helm: new classes.equipment({
        "name": "celtor_commander_helm",
        "rich_name": "Celtor Commander Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_depths",
                "the_eternal_gale"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
                "duke_erisia"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "grasp_on_reality"
            ],
            "mantras": []
        })
    }),
    chefs_toque: new classes.equipment({
        "name": "chefs_toque",
        "rich_name": "Chef's Toque",
        "type": Enum.EquipmentType.HEAD,
        "description": "It's not raw, you are.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 100,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [
                "chef_odiolovaro", // TODO: get this name
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "umami",
                "gourmet"
            ],
            "mantras": []
        })
    }),
    dark_cowl: new classes.equipment({
        "name": "dark_cowl",
        "rich_name": "Dark Cowl",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [],
        "obtained_from": {
            "locations": [
                "the_depths",
            ],
            "enemies": [],
            "monsters": [
                "deep_widow"
            ],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
            ],
            "quests": [],
            "other": [
                "chime_of_conflict",
                "artifact_chest"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "stealth": 0.04,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    dark_owl_chapeau: new classes.equipment({
        "name": "dark_owl_chapeau",
        "rich_name": "Dark Owl Chapeau",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_diluvian_mechanism",
                "the_depths",
                "the_eternal_gale",
                "miners_landing"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "primadon",
            ],
            "quests": [],
            "other": [
                "chime_of_conflict",
                "bounty_chest"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "stealth": 0.10,
                "resistance": {
                    "shadow": 0.05
                }
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "giantslayer"
            ],
            "mantras": []
        })
    }),
    deepscorn_casque: new classes.equipment({
        "name": "deepscorn_casque",
        "rich_name": "Deepscore Casque",
        "type": Enum.EquipmentType.HEAD,
        "description": "An artifact of dark renown, convincing them they are already dead, instilling a strange reckless calm, Crafted from darksteel, its history is steeped in blood; its last owner met a grim fate during a forbidden Ministry Ritual to grow a murky, grotesque abomination. Grayhule failed his experiments and succumbed to his own shadows. Dare to don this helm at your own peril.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 100,
        "rarity": Enum.ItemRarity.MYTHICAL,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "ministry_cache"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "already_dead"
            ],
            "mantras": []
        })
    }),
    deepwoken_hood: new classes.equipment({
        "name": "deepwoken_hood",
        "rich_name": "Deepwoken Hood",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 6
            }),
            "stats": new classes.statDistribution({
                "agility": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "fort_merit",
                "the_depths",
                "miners_landing"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "primadon"
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "already_dead"
            ],
            "mantras": []
        })
    }),
    double_strapped_hat: new classes.equipment({
        "name": "double_strapped_hat",
        "rich_name": "Double Strapped Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "A hat typically worn by those from the Central Luminant.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 6
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_strapped_hat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "the_depths",
            ],
            "enemies": [],
            "monsters": [
                "dread_serpent"
            ],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "exterminator"
            ],
            "mantras": []
        })
    }),
    familiar_heretics_helm: new classes.equipment({
        "name": "familiar_heretics_helm",
        "rich_name": "Familiar Heretic's Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "A familiar helm said to have been passed down by a wayward line of a distant land.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [
            Enum.PipRarity.UNCOMMON,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "hallowtide"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    familiar_knights_helm: new classes.equipment({
        "name": "familiar_knights_helm",
        "rich_name": "Familiar Knight's Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "A familiar helm said to have been passed down by a wayward line of a distant land.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [
            Enum.PipRarity.UNCOMMON,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "hallowtide"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    familiar_priests_helm: new classes.equipment({
        "name": "familiar_priests_helm",
        "rich_name": "Familiar Priest's Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "A familiar helm said to have been passed down by a wayward line of a distant land.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [
            Enum.PipRarity.UNCOMMON,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "hallowtide"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    feathertop_helm: new classes.equipment({
        "name": "feathertop_helm",
        "rich_name": "Feathertop Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "A stylish headpiece to keep you looking sharp.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON
        ],
        "obtained_from": {
            "locations": [
                "the_depths"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "dread_serpent"
            ],
            "quests": [],
            "other": [
                "war_mode",
                "artifact_chest"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    gladiator_helmet: new classes.equipment({
        "name": "gladiator_helmet",
        "rich_name": "Gladiator Helmet",
        "type": Enum.EquipmentType.HEAD,
        "description": "The visage of a gladiator who has seen many battles.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 8,
                "fortitude": 15
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
                "the_depths"
            ],
            "enemies": [],
            "monsters": [
                "deep_widow"
            ],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": [
                "bounty_chest",
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "posture": 2
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "concussive_force"
            ],
            "mantras": []
        })
    }),
    grand_fisher_helm: new classes.equipment({
        "name": "grand_fisher_helm",
        "rich_name": "Grand Fisher Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 100,
        "rarity": Enum.ItemRarity.MYTHICAL,
        "pips": [
            Enum.PipRarity.LEGENDARY,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [
                "the_fisherman"
            ],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "resistances": {
                    "ice": 0.05,
                    "lightning": 0.05
                }
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "coldseep_reactor"
            ],
            "mantras": []
        })
    }),
    guards_kabuto: new classes.equipment({
        "name": "guards_kabuto",
        "rich_name": "Guard's Kabuto",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "captains_kabuto",
            "royal_guards_kabuto"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "the_depths"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "dread_serpent"
            ],
            "quests": [],
            "other": [
                "artifact_chest"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    guardian_helmet: new classes.equipment({
        "name": "guardian_helmet",
        "rich_name": "Guardian Helmet",
        "type": Enum.EquipmentType.HEAD,
        "description": "The imposing helm of a guardian.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({
                "fortitude": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "deep_widow",
                "primadon"
            ],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": [
                "bounty_chest",
                "chime_of_conflict",
                "artifact_chest"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    dark_gumshoe_hat: new classes.equipment({
        "name": "dark_gumshoe_hat",
        "rich_name": "Dark Gumshoe Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "grey_gumshoe_hat",
            "white_gumshoe_hat",
            "ochre_gumshoe_hat"
        ],
        "selling_price": 7,
        "rarity": Enum.ItemRarity.COMMON,
        "pips": [
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    grey_gumshoe_hat: new classes.equipment({
        "name": "grey_gumshoe_hat",
        "rich_name": "Grey Gumshoe Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "dark_gumshoe_hat",
            "white_gumshoe_hat",
            "ochre_gumshoe_hat"
        ],
        "selling_price": 7,
        "rarity": Enum.ItemRarity.COMMON,
        "pips": [
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    white_gumshoe_hat: new classes.equipment({
        "name": "white_gumshoe_hat",
        "rich_name": "White Gumshoe Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "dark_gumshoe_hat",
            "grey_gumshoe_hat",
            "ochre_gumshoe_hat"
        ],
        "selling_price": 7,
        "rarity": Enum.ItemRarity.COMMON,
        "pips": [
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    ochre_gumshoe_hat: new classes.equipment({
        "name": "ochre_gumshoe_hat",
        "rich_name": "Ochre Gumshoe Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "dark_gumshoe_hat",
            "grey_gumshoe_hat",
            "white_gumshoe_hat",
        ],
        "selling_price": 7,
        "rarity": Enum.ItemRarity.COMMON,
        "pips": [
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    immortal_helm: new classes.equipment({
        "name": "immortal_helm",
        "rich_name": "Immortal Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "Helm of an Immortal Guardian. The product of Ministry experimentation, it's thought that these helmets enthrall their wielders by means of a Mind Veil, causing immediate death should they ever be removed. It seems that in prying this helmet off that this functionality has been disabled. You hope.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 6
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [
                "immortal_guardian"
            ],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [
                "immortality"
            ],
            "mantras": []
        })
    }),
    investigators_hat: new classes.equipment({
        "name": "investigators_hat",
        "rich_name": "Investigator's Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 6
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "aratel_island"
            ],
            "enemies": [],
            "monsters": [
                "dread_serpent"
            ],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest"
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 4
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "diplomat"
            ],
            "mantras": []
        })
    }),
    khan_helmet: new classes.equipment({
        "name": "khan_helmet",
        "rich_name": "Khan Helmet",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({
                "fortitude": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON
        ],
        "obtained_from": {
            "locations": [
                "aratel_island"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest"
            ],
            "quests": [],
            "other": [
                "war_mode",
                "merchant_ship"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
                "posture": 2
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    knights_helm: new classes.equipment({
        "name": "knights_helm",
        "rich_name": "Knight's Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 8,
            }),
            "stats": new classes.statDistribution({
                "fortitude": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "aratel_island"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
                "chaser",
                "dread_serpent",
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    kyrsmas_hat: new classes.equipment({
        "name": "kyrsmas_hat",
        "rich_name": "Kyrsmas Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "A cheerful cozy hat donned by the most festive Kyrs garde.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "kyrsmas_ethiron"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    legate_helm: new classes.equipment({
        "name": "legate_helm",
        "rich_name": "Legate Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({
                "fortitude": 5
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "deep_widow"
            ],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": [
                "bounty_chest",
                "the_depths",
                "artifact_chest"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    miners_hardhat: new classes.equipment({
        "name": "miners_hardhat",
        "rich_name": "Miner's Hardhat",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 6
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "mineskipper"
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [
                "rock_blaster",
                "excavator"
            ],
            "mantras": []
        })
    }),
    monastery_cowl: new classes.equipment({
        "name": "monastery_cowl",
        "rich_name": "Monastery Cowl",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
            ],
            "quests": [],
            "other": [
                "etris_siege"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "stealth": 0.05
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "blade_dancer"
            ],
            "mantras": []
        })
    }),
    mushroom_costume: new classes.equipment({
        "name": "mushroom_costume",
        "rich_name": "Mushroom Costume",
        "type": Enum.EquipmentType.HEAD,
        "description": "A fullbody mushroom costume. You feel the strange urge to change your name to Fungbert, or perhaps Fungula.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "glowshroom_costume",
            "metalshroom_costume",
            "charmshroom_costume",
            "zapshroom_costume",
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "hallowtide"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    glowshroom_costume: new classes.equipment({
        "name": "mushroom_costume",
        "rich_name": "Mushroom Costume",
        "type": Enum.EquipmentType.HEAD,
        "description": "A fullbody mushroom costume. You feel the strange urge to change your name to Fungbert, or perhaps Fungula.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "mushroom_costume",
            "metalshroom_costume",
            "charmshroom_costume",
            "zapshroom_costume",
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "hallowtide"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    metalshroom_costume: new classes.equipment({
        "name": "mushroom_costume",
        "rich_name": "Mushroom Costume",
        "type": Enum.EquipmentType.HEAD,
        "description": "A fullbody mushroom costume. You feel the strange urge to change your name to Fungbert, or perhaps Fungula.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "mushroom_costume",
            "glowshroom_costume",
            "charmshroom_costume",
            "zapshroom_costume",
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "hallowtide"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    charmshroom_costume: new classes.equipment({
        "name": "mushroom_costume",
        "rich_name": "Mushroom Costume",
        "type": Enum.EquipmentType.HEAD,
        "description": "A fullbody mushroom costume. You feel the strange urge to change your name to Fungbert, or perhaps Fungula.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "mushroom_costume",
            "glowshroom_costume",
            "metalshroom_costume",
            "zapshroom_costume",
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "hallowtide"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    zapshroom_costume: new classes.equipment({
        "name": "mushroom_costume",
        "rich_name": "Mushroom Costume",
        "type": Enum.EquipmentType.HEAD,
        "description": "A fullbody mushroom costume. You feel the strange urge to change your name to Fungbert, or perhaps Fungula.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "mushroom_costume",
            "glowshroom_costume",
            "metalshroom_costume",
            "charmshroom_costume",
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "hallowtide"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    party_hat: new classes.equipment({
        "name": "party_hat",
        "rich_name": "Party Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "Hooray! Worth your weight in gold on the exchange, for some reason.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "seasonal_medals"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    phalanx_helm: new classes.equipment({
        "name": "phalanx_helm",
        "rich_name": "Phalanx Helm",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_eternal_gale",
                "saramaed_hollow"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "dread_serpent"
            ],
            "quests": [],
            "other": [
                "chime_of_conflict"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "precise_swing"
            ],
            "mantras": []
        })
    }),
    parasol_planter: new classes.equipment({
        "name": "parasol_planter",
        "rich_name": "Parasol Planter",
        "type": Enum.EquipmentType.HEAD,
        "description": "The remains of a Parasol that have been relentlessly butchered in the name of fashion. Believed to migrate between the regions of the Voidsea, the sight of a Parasol is more than enough to make many lose their lunch. It's thought that they act as a form of cross-pollinator for various creatures that make their way from the Depths to Lumen, exchanging the traits and properties between them and dismantling ecosystems by injecting them into a competing niche.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 150,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "interluminary_parasol"
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 7
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "grotesque_resilience"
            ],
            "mantras": []
        })
    }),
    pumpkin_head: new classes.equipment({
        "name": "pumpkin_head",
        "rich_name": "Pumpkin Head",
        "type": Enum.EquipmentType.HEAD,
        "description": "Just make sure you still have a head after you take it off.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "hallowtide"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    royal_guards_kabuto: new classes.equipment({
        "name": "royal_guards_kabuto",
        "rich_name": "Royal Guard's Kabuto",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "captains_kabuto",
            "guards_kabuto"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "primadon"
            ],
            "quests": [],
            "other": [
                "first_layer",
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    simmerbloom_diadem: new classes.equipment({
        "name": "simmerbloom_diadem",
        "rich_name": "Simmerbloom Diadem",
        "type": Enum.EquipmentType.HEAD,
        "description": "Another relic of Aska's, this ancient artifact was once in the hands of the elusive pioneer of flame charm. Bestowed by flame worshippers and seldom seen, its precise origins are shrouded in mystery. The flame that flickers within its adorned flower suggests a hidden power, making it a priceless treasure for those who truly understand its significance.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({
                "flamecharm": 80
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "saramaed_hollow"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "aska"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "simmerbloom"
            ],
            "mantras": []
        })
    }),
    smiths_bandana: new classes.equipment({
        "name": "smiths_bandana",
        "rich_name": "Smith's Bandana",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON
        ],
        "obtained_from": {
            "locations": [
                "erisia",
                "the_depths",
                "the_diluvian_mechanism"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "chaser",
                "maestro_evengarde_rest",
                "primadon"
            ],
            "quests": [],
            "other": [
                "artifact_chest",
                "pure_ore"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 4
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    ten_gallon_hat: new classes.equipment({
        "name": "ten_gallon_hat",
        "rich_name": "Ten-Gallon Hat",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "saramaed_hollow",
                "aratel_island"
            ],
            "enemies": [],
            "monsters": [
                "rogue_construct"
            ],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest"
            ],
            "quests": [],
            "other": [
                "the_diluvian_mechanism"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({
                "posture": 2
            }),
            "talents": [],
            "mantras": []
        })
    }),
    tillians_beret: new classes.equipment({
        "name": "tillians_beret",
        "rich_name": "Tillian's Beret",
        "type": Enum.EquipmentType.HEAD,
        "description": "A beret with a sleek texture and fit, evidently the work of a skilled tailor – must've cost a pretty penny. Though to those which money has no meaning, the visual statement outweighs any price.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "carnival_of_hearts"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 7
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "cap_artist"
            ],
            "mantras": []
        })
    }),
    burgundy_tophat: new classes.equipment({
        "name": "burgundy_tophat",
        "rich_name": "Burgundy Tophat",
        "type": Enum.EquipmentType.HEAD,
        "description": "While wearing a hat like this you start feeling the urge to exploit the surplus labor of the working class.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "slate_tophat",
            "beige_tophat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "summer_isle"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 4
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "give_and_take"
            ],
            "mantras": []
        })
    }),
    slate_tophat: new classes.equipment({
        "name": "slate_tophat",
        "rich_name": "Slate Tophat",
        "type": Enum.EquipmentType.HEAD,
        "description": "While wearing a hat like this you start feeling the urge to exploit the surplus labor of the working class.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "burgundy_tophat",
            "beige_tophat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "summer_isle"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 4
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "give_and_take"
            ],
            "mantras": []
        })
    }),
    beige_tophat: new classes.equipment({
        "name": "beige_tophat",
        "rich_name": "Beige Tophat",
        "type": Enum.EquipmentType.HEAD,
        "description": "While wearing a hat like this you start feeling the urge to exploit the surplus labor of the working class.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "burgundy_tophat",
            "slate_tophat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "summer_isle"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 4
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "give_and_take"
            ],
            "mantras": []
        })
    }),
    vagabonds_bicorn: new classes.equipment({
        "name": "vagabonds_bicorn",
        "rich_name": "Vagabond's Bicorn",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON
        ],
        "obtained_from": {
            "locations": [
                "the_depths"
            ],
            "enemies": [],
            "monsters": [
                "deep_widow",
            ],
            "bosses": [
                "duke_erisia",
                "chaser",
                "maestro_evengarde_rest",
                "primadon"
            ],
            "quests": [],
            "other": [
                "war_mode",
                "artifact_chest"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 4
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    vigil_hood: new classes.equipment({
        "name": "vigil_hood",
        "rich_name": "Vigil Hood",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 6
            }),
            "stats": new classes.statDistribution({
                "agility": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
                "the_depths"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "primadon"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    lilac_warlocks_brim: new classes.equipment({
        "name": "lilac_warlocks_brim",
        "rich_name": "Lilac Warlock's Brim",
        "type": Enum.EquipmentType.HEAD,
        "description": "A finely crafted hat worn by master wizards of the Northern Luminant, imbued with song woven into its fabric. It amplifies the wearer's power in battle.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({
                "power": 16
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "verdant_warlocks_brim",
            "sky_warlocks_brim"
        ],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "world_serpent"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    verdant_warlocks_brim: new classes.equipment({
        "name": "verdant_warlocks_brim",
        "rich_name": "Verdant Warlock's Brim",
        "type": Enum.EquipmentType.HEAD,
        "description": "A finely crafted hat worn by master wizards of the Northern Luminant, imbued with song woven into its fabric. It amplifies the wearer's power in battle.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({
                "power": 16
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "lilac_warlocks_brim",
            "sky_warlocks_brim"
        ],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "world_serpent"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    sky_warlocks_brim: new classes.equipment({
        "name": "sky_warlocks_brim",
        "rich_name": "Sky Warlock's Brim",
        "type": Enum.EquipmentType.HEAD,
        "description": "A finely crafted hat worn by master wizards of the Northern Luminant, imbued with song woven into its fabric. It amplifies the wearer's power in battle.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({
                "power": 16
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "lilac_warlocks_brim",
            "verdant_warlocks_brim"
        ],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "world_serpent"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    a_lot_of_hats: new classes.equipment({
        "name": "a_lot_of_hats",
        "rich_name": "A Lot of Hats",
        "type": Enum.EquipmentType.HEAD,
        "description": "Go play dark souls 1.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.UNCOMMON
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "moderator_shop"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    hive_greatlords_royal_adorment: new classes.equipment({
        "name": "hive_greatlords_royal_adorment",
        "rich_name": "Hive Greatlord's Royal Adornment",
        "type": Enum.EquipmentType.HEAD,
        "description": "Lol.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "developer_spec"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
                "posture": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "ashes_on_the_fire"
            ],
            "mantras": []
        })
    }),
    microwavetm: new classes.equipment({
        "name": "microwavetm",
        "rich_name": "MICROWAVETM",
        "type": Enum.EquipmentType.HEAD,
        "description": "Go play heat signature.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.UNCOMMON
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "moderator_shop"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    moderator_cap: new classes.equipment({
        "name": "moderator_cap",
        "rich_name": "Moderator Cap",
        "type": Enum.EquipmentType.HEAD,
        "description": "Go play ultrakill.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.UNCOMMON
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "moderator_shop"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    the_machine: new classes.equipment({
        "name": "the_machine",
        "rich_name": "THE MACHINE",
        "type": Enum.EquipmentType.HEAD,
        "description": "Go play metal gear rising.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.UNCOMMON
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "moderator_shop"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    worldshapers_laurel: new classes.equipment({
        "name": "worldshapers_laurel",
        "rich_name": "Worldshaper's Laurel",
        "type": Enum.EquipmentType.HEAD,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "fanart_contest"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    // #endregion
    // #region ARMS EQUIPMENT
    abyss_wanderer_plate: new classes.equipment({
        "name": "abyss_wanderer_plate",
        "rich_name": "Abyss Wanderer Plate",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 100,
        "rarity": Enum.ItemRarity.MYTHICAL,
        "pips": [
            Enum.PipRarity.LEGENDARY,
            Enum.PipRarity.LEGENDARY,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "saramaed_hollow"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "braced_collapse",
                "kick_off"
            ],
            "mantras": []
        })
    }),
    ash_adjudicator_coat: new classes.equipment({
        "name": "ash_adjudicator_coat",
        "rich_name": "Ash Adjudicator's Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "pink_adjudicator_coat",
            "rural_adjudicator_coat",
            "sable_adjudicator_coat",
            "tawny_adjudicator_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit",
                "the_aratel_sea"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "the_ferryman"
            ],
            "quests": [],
            "other": [
                "aelita",
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [
                "unwavering_resolve"
            ],
            "mantras": []
        })
    }),
    pink_adjudicator_coat: new classes.equipment({
        "name": "pink_adjudicator_coat",
        "rich_name": "Pink Adjudicator's Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "ash_adjudicator_coat",
            "rural_adjudicator_coat",
            "sable_adjudicator_coat",
            "tawny_adjudicator_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit",
                "the_aratel_sea"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "the_ferryman"
            ],
            "quests": [
                "aelita",
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [
                "unwavering_resolve"
            ],
            "mantras": []
        })
    }),
    rural_adjudicator_coat: new classes.equipment({
        "name": "rural_adjudicator_coat",
        "rich_name": "Rural Adjudicator's Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "ash_adjudicator_coat",
            "pink_adjudicator_coat",
            "sable_adjudicator_coat",
            "tawny_adjudicator_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit",
                "the_aratel_sea"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "the_ferryman"
            ],
            "quests": [
                "aelita",
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [
                "unwavering_resolve"
            ],
            "mantras": []
        })
    }),
    sable_adjudicator_coat: new classes.equipment({
        "name": "sable_adjudicator_coat",
        "rich_name": "Sable Adjudicator's Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "ash_adjudicator_coat",
            "pink_adjudicator_coat",
            "rural_adjudicator_coat",
            "tawny_adjudicator_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit",
                "the_aratel_sea"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "the_ferryman"
            ],
            "quests": [
                "aelita",
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [
                "unwavering_resolve"
            ],
            "mantras": []
        })
    }),
    tawny_adjudicator_coat: new classes.equipment({
        "name": "tawny_adjudicator_coat",
        "rich_name": "Tawny Adjudicator's Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "ash_adjudicator_coat",
            "pink_adjudicator_coat",
            "rural_adjudicator_coat",
            "sable_adjudicator_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit",
                "the_aratel_sea"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "the_ferryman"
            ],
            "quests": [
                "aelita",
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [
                "unwavering_resolve"
            ],
            "mantras": []
        })
    }),
    black_adventurer_coat: new classes.equipment({
        "name": "black_adventurer_coat",
        "rich_name": "Black Adventurer Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "brown_adventurer_coat",
            "green_adventurer_coat",
            "white_adventurer_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    brown_adventurer_coat: new classes.equipment({
        "name": "brown_adventurer_coat",
        "rich_name": "Brown Adventurer Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_adventurer_coat",
            "green_adventurer_coat",
            "white_adventurer_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    green_adventurer_coat: new classes.equipment({
        "name": "green_adventurer_coat",
        "rich_name": "Green Adventurer Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_adventurer_coat",
            "brown_adventurer_coat",
            "white_adventurer_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    white_adventurer_coat: new classes.equipment({
        "name": "white_adventurer_coat",
        "rich_name": "White Adventurer Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_adventurer_coat",
            "brown_adventurer_coat",
            "green_adventurer_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    beige_aristocrat_coat: new classes.equipment({
        "name": "beige_aristocrat_coat",
        "rich_name": "Beige Aristocrat Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "Any man worth his salt or indeed worth the salt of a hundred other men would have a coat like this, you're sure.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "burgundy_aristocrat_coat",
            "slate_aristocrat_coat"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [
                "summer_isle"
            ],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 6
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "art_of_the_deal"
            ],
            "mantras": []
        })
    }),
    burgundy_aristocrat_coat: new classes.equipment({
        "name": "burgundy_aristocrat_coat",
        "rich_name": "Burgundy Aristocrat Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "Any man worth his salt or indeed worth the salt of a hundred other men would have a coat like this, you're sure.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "beige_aristocrat_coat",
            "slate_aristocrat_coat"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [
                "summer_isle"
            ],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 6
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "art_of_the_deal"
            ],
            "mantras": []
        })
    }),
    slate_aristocrat_coat: new classes.equipment({
        "name": "slate_aristocrat_coat",
        "rich_name": "Slate Aristocrat Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "Any man worth his salt or indeed worth the salt of a hundred other men would have a coat like this, you're sure.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "beige_aristocrat_coat",
            "burgundy_aristocrat_coat"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [
                "summer_isle"
            ],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 6
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "art_of_the_deal"
            ],
            "mantras": []
        })
    }),
    gold_assassins_cloak: new classes.equipment({
        "name": "gold_assassins_cloak",
        "rich_name": "Gold Assassin's Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "mist_assassins_cloak",
            "pale_assassins_cloak",
            "crimson_assassins_cloak"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [
                "cloaked_assasin"
            ],
            "monsters": [],
            "bosses": [
                "the_ferryman",
            ],
            "quests": [
                "aelita",
            ],
            "other": [
                "carnival_of_hearts"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 6,
                "stealth": 0.03
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "lowstride"
            ],
            "mantras": []
        })
    }),
    crimson_assassins_cloak: new classes.equipment({
        "name": "crimson_assassins_cloak",
        "rich_name": "Crimson Assassin's Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "mist_assassins_cloak",
            "pale_assassins_cloak",
            "gold_assassins_cloak"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [
                "cloaked_assasin"
            ],
            "monsters": [],
            "bosses": [
                "the_ferryman",
            ],
            "quests": [
                "aelita",
            ],
            "other": [
                "carnival_of_hearts"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 6,
                "stealth": 0.03
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "lowstride"
            ],
            "mantras": []
        })
    }),
    mist_assassins_cloak: new classes.equipment({
        "name": "mist_assassins_cloak",
        "rich_name": "Mist Assassin's Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "gold_assassins_cloak",
            "pale_assassins_cloak",
            "crimson_assassins_cloak"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "the_ferryman",
            ],
            "quests": [
                "aelita",
            ],
            "other": [
                "carnival_of_hearts"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 6,
                "stealth": 0.03
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "lowstride"
            ],
            "mantras": []
        })
    }),
    pale_assassins_cloak: new classes.equipment({
        "name": "pale_assassins_cloak",
        "rich_name": "Pale Assassin's Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "mist_assassins_cloak",
            "gold_assassins_cloak",
            "crimson_assassins_cloak"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "aratel_island"
            ],
            "enemies": [],
            "monsters": [
                "rogue_construct"
            ],
            "bosses": [
                "primadon",
            ],
            "quests": [
                "calamus" // todo: find name of this quest
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 6,
                "stealth": 0.03
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "lowstride"
            ],
            "mantras": []
        })
    }),
    amber_authority_commander_coat: new classes.equipment({
        "name": "amber_authority_commander_coat",
        "rich_name": "Amber Authority Commander Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "authority_commander_coat",
            "bronze_authority_commander_coat",
            "gold_authority_commander_coat",
            "haze_authority_commander_coat",
            "royal_authority_commander_coat",
            "ruby_authority_commander_coat",
            "stygian_authority_commander_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "the_ferryman"
            ],
            "quests": [
                "aelita",
            ],
            "other": [
                "sea_event_authority_stronghold"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    bronze_authority_commander_coat: new classes.equipment({
        "name": "bronze_authority_commander_coat",
        "rich_name": "Bronze Authority Commander Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "authority_commander_coat",
            "amber_authority_commander_coat",
            "gold_authority_commander_coat",
            "haze_authority_commander_coat",
            "royal_authority_commander_coat",
            "ruby_authority_commander_coat",
            "stygian_authority_commander_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit"
            ],
            "enemies": [
                "aelita",
                "the_ferryman"
            ],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "sea_event_authority_stronghold"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    gold_authority_commander_coat: new classes.equipment({
        "name": "gold_authority_commander_coat",
        "rich_name": "Gold Authority Commander Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "authority_commander_coat",
            "amber_authority_commander_coat",
            "bronze_authority_commander_coat",
            "haze_authority_commander_coat",
            "royal_authority_commander_coat",
            "ruby_authority_commander_coat",
            "stygian_authority_commander_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "the_ferryman",
            ],
            "quests": [
                "aelita",
            ],
            "other": [
                "sea_event_authority_stronghold"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    haze_authority_commander_coat: new classes.equipment({
        "name": "haze_authority_commander_coat",
        "rich_name": "Haze Authority Commander Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "authority_commander_coat",
            "amber_authority_commander_coat",
            "bronze_authority_commander_coat",
            "gold_authority_commander_coat",
            "royal_authority_commander_coat",
            "ruby_authority_commander_coat",
            "stygian_authority_commander_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "the_ferryman"
            ],
            "quests": [
                "aelita",
            ],
            "other": [
                "sea_event_authority_stronghold"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    royal_authority_commander_coat: new classes.equipment({
        "name": "royal_authority_commander_coat",
        "rich_name": "Royal Authority Commander Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "authority_commander_coat",
            "amber_authority_commander_coat",
            "bronze_authority_commander_coat",
            "gold_authority_commander_coat",
            "haze_authority_commander_coat",
            "ruby_authority_commander_coat",
            "stygian_authority_commander_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "the_ferryman"
            ],
            "quests": [
                "aelita",
            ],
            "other": [
                "sea_event_authority_stronghold"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    ruby_authority_commander_coat: new classes.equipment({
        "name": "ruby_authority_commander_coat",
        "rich_name": "Ruby Authority Commander Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "authority_commander_coat",
            "amber_authority_commander_coat",
            "bronze_authority_commander_coat",
            "gold_authority_commander_coat",
            "haze_authority_commander_coat",
            "royal_authority_commander_coat",
            "stygian_authority_commander_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "the_ferryman"
            ],
            "quests": [
                "aelita",
            ],
            "other": [
                "sea_event_authority_stronghold"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    stygian_authority_commander_coat: new classes.equipment({
        "name": "stygian_authority_commander_coat",
        "rich_name": "Stygian Authority Commander Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "authority_commander_coat",
            "amber_authority_commander_coat",
            "bronze_authority_commander_coat",
            "gold_authority_commander_coat",
            "haze_authority_commander_coat",
            "royal_authority_commander_coat",
            "ruby_authority_commander_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "the_ferryman"
            ],
            "quests": [
                "aelita",
            ],
            "other": [
                "sea_event_authority_stronghold"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    autumn_pauldrons: new classes.equipment({
        "name": "autumn_pauldrons",
        "rich_name": "Autumn Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
                "erisia"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
                "dread_serpent"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    azure_royal_guard: new classes.equipment({
        "name": "azure_royal_guard",
        "rich_name": "Azure Royal Guard",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 7,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    bastions_of_enmity: new classes.equipment({
        "name": "bastions_of_enmity",
        "rich_name": "Bastions of Enmity",
        "type": Enum.EquipmentType.ARMS,
        "description": "Holy Mackerel! That was a tough fight!",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 15,
            }),
            "stats": new classes.statDistribution({
                "fortitude": 10
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.LEGENDARY,
            Enum.PipRarity.LEGENDARY,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "heart_of_enmity"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
                "posture": 2
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    black_overcoat: new classes.equipment({
        "name": "black_overcoat",
        "rich_name": "Black Overcoat",
        "type": Enum.EquipmentType.ARMS,
        "description": "A thick coat to protect you against the elements.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "brown_overcoat",
            "white_overcoat",
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "chaser",
                "maestro_evengarde_rest",
            ],
            "quests": [],
            "other": [
                "hell_mode",
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    brown_overcoat: new classes.equipment({
        "name": "brown_overcoat",
        "rich_name": "Brown Overcoat",
        "type": Enum.EquipmentType.ARMS,
        "description": "A thick coat to protect you against the elements.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_overcoat",
            "white_overcoat",
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "summer_isle",
                "erisia",
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "chaser",
                "duke_erisia",
                "maestro_evengarde_rest",
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    white_overcoat: new classes.equipment({
        "name": "white_overcoat",
        "rich_name": "White Overcoat",
        "type": Enum.EquipmentType.ARMS,
        "description": "A thick coat to protect you against the elements.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_overcoat",
            "brown_overcoat",
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "summer_isle",
                "erisia",
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "dread_serpent"
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    black_parka: new classes.equipment({
        "name": "black_parka",
        "rich_name": "Black Parka",
        "type": Enum.EquipmentType.ARMS,
        "description": "An essential winter coat to protect you against the cold.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "brown_overcoat",
            "white_overcoat",
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
                "dread_serpent",
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 2,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "steady_footing"
            ],
            "mantras": []
        })
    }),
    brown_parka: new classes.equipment({
        "name": "brown_parka",
        "rich_name": "Brown Parka",
        "type": Enum.EquipmentType.ARMS,
        "description": "An essential winter coat to protect you against the cold.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_overcoat",
            "white_overcoat",
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
                "dread_serpent",
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 2,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "steady_footing"
            ],
            "mantras": []
        })
    }),
    white_parka: new classes.equipment({
        "name": "white_parka",
        "rich_name": "White Parka",
        "type": Enum.EquipmentType.ARMS,
        "description": "An essential winter coat to protect you against the cold.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_overcoat",
            "brown_overcoat",
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
                "dread_serpent",
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 2,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "steady_footing"
            ],
            "mantras": []
        })
    }),
    blacksteel_pauldrons: new classes.equipment({
        "name": "blacksteel_pauldrons",
        "rich_name": "Blacksteel Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_overcoat",
            "brown_overcoat",
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "erisia",
            ],
            "enemies": [
                "blacksteel_pirate"
            ],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    bluesteel_pauldrons: new classes.equipment({
        "name": "bluesteel_pauldrons",
        "rich_name": "Bluesteel Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_overcoat",
            "brown_overcoat",
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "the_depths",
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "primadon",
                "maestro_evengarde_rest",
            ],
            "quests": [],
            "other": [
                "chime_of_conflict"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    brigands_cloak: new classes.equipment({
        "name": "brigands_cloak",
        "rich_name": "Brigand's Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_overcoat",
            "brown_overcoat",
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "the_depths",
                "summer_isle"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "primadon",
                "maestro_evengarde_rest",
                "duke_erisia",
                "dread_serpent"
            ],
            "quests": [],
            "other": [
                "merchant_ship"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    brilliant_pauldron: new classes.equipment({
        "name": "brilliant_pauldron",
        "rich_name": "Brilliant Pauldron",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 7,
        "rarity": Enum.ItemRarity.COMMON,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_depths",
                "the_diluvian_mechanism"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "primadon",
                "chaser"
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    celtor_commander_plate: new classes.equipment({
        "name": "celtor_commander_plate",
        "rich_name": "Celtor Commander Plate",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_depths",
                "miners_landing"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "primadon",
                "dread_serpent"
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 8,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "breathing_excercise"
            ],
            "mantras": []
        })
    }),
    dark_owl_cloak: new classes.equipment({
        "name": "dark_owl_cloak",
        "rich_name": "Dark Owl Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_eternal_gale",
                "miners_landing",
                "saramaed_summit",
            ],
            "enemies": [],
            "monsters": [
                "deep_owl",
                "deep_widow"
            ],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "primadon",
                "dread_serpent"
            ],
            "quests": [],
            "other": [
                "chime_of_conflict",
                "pure_ore"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "resistances": {
                    "shadow": 0.08
                },
                "stealth": 0.06
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "disbelief"
            ],
            "mantras": []
        })
    }),
    white_deepwoken_cloak: new classes.equipment({
        "name": "white_deepwoken_cloak",
        "rich_name": "White Deepwoken Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "An ancient cloak of incredible power. Worn by a select few.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_deepwoken_cloak"
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "miners_landing",
                "saramaed_summit",
                "starfield_veldt",
                "saramaed_hollow"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "primadon",
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "blade_dancer"
            ],
            "mantras": []
        })
    }),
    black_deepwoken_cloak: new classes.equipment({
        "name": "black_deepwoken_cloak",
        "rich_name": "Black Deepwoken Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "An ancient cloak of incredible power. Worn by a select few.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "white_deepwoken_cloak"
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "miners_landing",
                "saramaed_summit",
                "starfield_veldt",
                "saramaed_hollow"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "primadon",
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "blade_dancer"
            ],
            "mantras": []
        })
    }),
    delvers_duster: new classes.equipment({
        "name": "delvers_duster",
        "rich_name": "Delver's Duster",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 100,
        "rarity": Enum.ItemRarity.MYTHICAL,
        "pips": [
            Enum.PipRarity.LEGENDARY,
            Enum.PipRarity.LEGENDARY,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "miners_landing",
                "saramaed_summit",
                "saramaed_hollow",
                "starfield_veldt"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "chaser",
                "ethiron",
            ],
            "quests": [],
            "other": [
                "merchant_ship"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "braced_collapse",
                "kick_off"
            ],
            "mantras": []
        })
    }),
    divers_light_plate: new classes.equipment({
        "name": "divers_light_plate",
        "rich_name": "Diver's Light Plate",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13,
            }),
            "stats": new classes.statDistribution({
                "fortitude": 5
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 100,
        "rarity": Enum.ItemRarity.MYTHICAL,
        "pips": [
            Enum.PipRarity.LEGENDARY,
            Enum.PipRarity.LEGENDARY,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "hell_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "conquer_your_fears"
            ],
            "mantras": []
        })
    }),
    enforcer_plate: new classes.equipment({
        "name": "enforcer_plate",
        "rich_name": "Enforcer Plate",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_depths"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [
                "berserker"
            ],
            "mantras": []
        })
    }),
    etrean_siege_curiass: new classes.equipment({
        "name": "etrean_siege_curiass",
        "rich_name": "Etrean Siege Curiass",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_eternal_gale",
                "saramaed_summit",
                "miners_landing",
                "crypt_of_the_unbroken"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
                "dread_serpent"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "battle_tendency"
            ],
            "mantras": []
        })
    }),
    azure_first_ranger_duster: new classes.equipment({
        "name": "azure_first_ranger_duster",
        "rich_name": "Azure First Ranger Duster",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "cloud_first_ranger_duster",
            "jade_first_ranger_duster",
            "lavender_first_ranger_duster",
            "umber_first_ranger_duster"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "king_thresher"
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
                "posture": 2
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    cloud_first_ranger_duster: new classes.equipment({
        "name": "cloud_first_ranger_duster",
        "rich_name": "Cloud First Ranger Duster",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "azure_first_ranger_duster",
            "jade_first_ranger_duster",
            "lavender_first_ranger_duster",
            "umber_first_ranger_duster"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "king_thresher"
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
                "posture": 2
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    jade_first_ranger_duster: new classes.equipment({
        "name": "jade_first_ranger_duster",
        "rich_name": "Jade First Ranger Duster",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "azure_first_ranger_duster",
            "cloud_first_ranger_duster",
            "lavender_first_ranger_duster",
            "umber_first_ranger_duster"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "king_thresher"
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
                "posture": 2
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    lavender_first_ranger_duster: new classes.equipment({
        "name": "lavender_first_ranger_duster",
        "rich_name": "Lavender First Ranger Duster",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "azure_first_ranger_duster",
            "cloud_first_ranger_duster",
            "jade_first_ranger_duster",
            "umber_first_ranger_duster"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "king_thresher"
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
                "posture": 2
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    umber_first_ranger_duster: new classes.equipment({
        "name": "umber_first_ranger_duster",
        "rich_name": "Umber First Ranger Duster",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "azure_first_ranger_duster",
            "cloud_first_ranger_duster",
            "jade_first_ranger_duster",
            "lavender_first_ranger_duster"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "king_thresher"
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
                "posture": 2
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    flameguard_pauldrons: new classes.equipment({
        "name": "flameguard_pauldrons",
        "rich_name": "Flameguard Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 7,
        "rarity": Enum.ItemRarity.COMMON,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
                "minityrsa"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    black_fur_pauldrons: new classes.equipment({
        "name": "black_fur_pauldrons",
        "rich_name": "Black Fur Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "white_fur_pauldrons"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
                "erisia"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "dread_serpent",
                "maestro_evengarde_rest"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    white_fur_pauldrons: new classes.equipment({
        "name": "white_fur_pauldrons",
        "rich_name": "White Fur Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_fur_pauldrons"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
                "erisia"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "dread_serpent"
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    gladiator_pauldrons: new classes.equipment({
        "name": "gladiator_pauldrons",
        "rich_name": "Gladiator Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "erisia"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": [
                "chime_of_conflict"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 2,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    glassdancer_wraps: new classes.equipment({
        "name": "glassdancer_wraps",
        "rich_name": "Glassdancer Wraps",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 6
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "minityrsa",
                "songseeker_wilds"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 7,
                "posture": 3
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "lightweight"
            ],
            "mantras": []
        })
    }),
    grand_authority_plate: new classes.equipment({
        "name": "grand_authority_plate",
        "rich_name": "Grand Authority Plate",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_eternal_gale",
                "miners_landing"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "primadon",
                "dread_serpent"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "heavy_haul"
            ],
            "mantras": []
        })
    }),
    grand_fisher_plate: new classes.equipment({
        "name": "grand_fisher_plate",
        "rich_name": "Grand Authority Plate",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({
                "fortitude": 5
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 100,
        "rarity": Enum.ItemRarity.MYTHICAL,
        "pips": [
            Enum.PipRarity.LEGENDARY,
            Enum.PipRarity.LEGENDARY,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [
                "the_fisherman"
            ],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "divers_resilience"
            ],
            "mantras": []
        })
    }),
    grand_pauldrons: new classes.equipment({
        "name": "grand_pauldrons",
        "rich_name": "Grand Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.RARE,
        ],
        "obtained_from": {
            "locations": [
                "the_depths"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    guardian_pauldrons: new classes.equipment({
        "name": "guardian_pauldrons",
        "rich_name": "Guardian Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [],
        "obtained_from": {
            "locations": [
                "the_depths"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "primadon"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 2,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    dark_gumshoe_longcoat: new classes.equipment({
        "name": "dark_gumshoe_longcoat",
        "rich_name": "Dark Gumshoe Longcoat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({ // None
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "ochre_gumshoe_longcoat",
            "grey_gumshoe_longcoat",
            "white_gumshoe_longcoat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "songseeker_wilds",
                "minitrysa"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "dread_serpent"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    ochre_gumshoe_longcoat: new classes.equipment({
        "name": "ochre_gumshoe_longcoat",
        "rich_name": "Ochre Gumshoe Longcoat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({ // None
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "dark_gumshoe_longcoat",
            "grey_gumshoe_longcoat",
            "white_gumshoe_longcoat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "songseeker_wilds",
                "minitrysa"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "dread_serpent"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    grey_gumshoe_longcoat: new classes.equipment({
        "name": "grey_gumshoe_longcoat",
        "rich_name": "Grey Gumshoe Longcoat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({ // None
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "dark_gumshoe_longcoat",
            "ochre_gumshoe_longcoat",
            "white_gumshoe_longcoat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "songseeker_wilds",
                "minitrysa"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "dread_serpent"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    white_gumshoe_longcoat: new classes.equipment({
        "name": "white_gumshoe_longcoat",
        "rich_name": "White Gumshoe Longcoat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({ // None
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "dark_gumshoe_longcoat",
            "ochre_gumshoe_longcoat",
            "grey_gumshoe_longcoat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.RARE
        ],
        "obtained_from": {
            "locations": [
                "songseeker_wilds",
                "minitrysa"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "dread_serpent"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    hive_scourge_cuirass: new classes.equipment({
        "name": "hive_scourge_cuirass",
        "rich_name": "Hive Scourge Cuirass",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipRarity.UNCOMMON,
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_eternal_gale"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
            ],
            "quests": [],
            "other": [
                "merchant_ship"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "posture": 2
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    ignition_gauntlets: new classes.equipment({
        "name": "ignition_gauntlets",
        "rich_name": "Ignition Gauntlets",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [
            Enum.PipRarity.RARE,
            Enum.PipRarity.LEGENDARY,
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "saramaed_hollow"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 8,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "force_your_way"
            ],
            "mantras": []
        })
    }),
    imperial_pauldrons: new classes.equipment({
        "name": "imperial_pauldrons",
        "rich_name": "Imperial Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "fort_merit",
                "the_eternal_gale",
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
                "dread_serpent"
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    iron_pauldrons: new classes.equipment({
        "name": "iron_pauldrons",
        "rich_name": "Iron Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "erisia",
                "fort_merit"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    ironsinger_heavy_plate: new classes.equipment({
        "name": "ironsinger_heavy_plate",
        "rich_name": "Ironsinger Heavy Plate",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13,
            }),
            "stats": new classes.statDistribution({
                "fortitude": 15
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [],
        "obtained_from": {
            "locations": [
                "the_eternal_gale",
                "the_depths",
                "saramaed_hollow"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "ethiron",
                "chaser"
            ],
            "quests": [],
            "other": [
                "war_mode",
                "merchant_ship"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 10,
                "resistances": {
                    "iron": 0.05
                }
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "defiant_until_the_end"
            ],
            "mantras": []
        })
    }),
    jet_black_justicar_defender_coat: new classes.equipment({
        "name": "jet_black_justicar_defender_coat",
        "rich_name": "Jet BlackJusticar Defender Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_justicar_defender_coat", 
            "faded_justicar_defender_coat", 
            "orange_justicar_defender_coat", 
            "purple_justicar_defender_coat", 
            "red_justicar_defender_coat"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "king_thresher"
            ],
            "bosses": [
                "ferryman"
            ],
            "quests": [
                "aelita"
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    black_justicar_defender_coat: new classes.equipment({
        "name": "black_justicar_defender_coat",
        "rich_name": "Black Justicar Defender Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "jet_black_justicar_defender_coat", 
            "faded_justicar_defender_coat", 
            "orange_justicar_defender_coat", 
            "purple_justicar_defender_coat", 
            "red_justicar_defender_coat"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "king_thresher"
            ],
            "bosses": [
                "ferryman"
            ],
            "quests": [
                "aelita"
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    faded_justicar_defender_coat: new classes.equipment({
        "name": "faded_justicar_defender_coat",
        "rich_name": "Faded Justicar Defender Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "jet_black_justicar_defender_coat", 
            "black_justicar_defender_coat", 
            "orange_justicar_defender_coat", 
            "purple_justicar_defender_coat", 
            "red_justicar_defender_coat"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "king_thresher"
            ],
            "bosses": [
                "ferryman"
            ],
            "quests": [
                "aelita"
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    orange_justicar_defender_coat: new classes.equipment({
        "name": "orange_justicar_defender_coat",
        "rich_name": "Orange Justicar Defender Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "jet_black_justicar_defender_coat", 
            "black_justicar_defender_coat", 
            "faded_justicar_defender_coat", 
            "purple_justicar_defender_coat", 
            "red_justicar_defender_coat"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "king_thresher"
            ],
            "bosses": [
                "ferryman"
            ],
            "quests": [
                "aelita"
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    purple_justicar_defender_coat: new classes.equipment({
        "name": "purple_justicar_defender_coat",
        "rich_name": "Purple Justicar Defender Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "jet_black_justicar_defender_coat", 
            "black_justicar_defender_coat", 
            "faded_justicar_defender_coat", 
            "orange_justicar_defender_coat", 
            "red_justicar_defender_coat"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "king_thresher"
            ],
            "bosses": [
                "ferryman"
            ],
            "quests": [
                "aelita"
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    red_justicar_defender_coat: new classes.equipment({
        "name": "red_justicar_defender_coat",
        "rich_name": "Red Justicar Defender Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "jet_black_justicar_defender_coat", 
            "black_justicar_defender_coat", 
            "faded_justicar_defender_coat", 
            "orange_justicar_defender_coat", 
            "purple_justicar_defender_coat"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "king_thresher"
            ],
            "bosses": [
                "ferryman"
            ],
            "quests": [
                "aelita"
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    khan_pauldrons: new classes.equipment({
        "name": "khan_pauldrons",
        "rich_name": "Khan Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "aratel_island",
                "songseeker_wilds"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
                "dread_serpent"
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3
            }),
            "stats": new classes.statDistribution({}),
            "talents": [], // Polite Awakening
            "mantras": []
        })
    }),
    leather_gloves: new classes.equipment({
        "name": "leather_gloves",
        "rich_name": "Leather Gloves",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 7,
        "rarity": Enum.ItemRarity.COMMON,
        "pips": [
            Enum.PipType.UNCOMMON
        ],
        "obtained_from": {
            "locations": [
                "erisia",
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": [
                "chime_of_conflict",
                "tutorial"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 1,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    leather_pauldrons: new classes.equipment({
        "name": "leather_pauldrons",
        "rich_name": "Leather Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 7,
        "rarity": Enum.ItemRarity.COMMON,
        "pips": [],
        "obtained_from": {
            "locations": [
                "erisia"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 2
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    legion_phalanx_plate: new classes.equipment({
        "name": "legion_phalanx_plate",
        "rich_name": "Legion Phalanx Plate",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({
                "fortitude": 15
            }),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_eternal_gale",
                "miners_landing",
                "the_depths"
            ],
            "enemies": [],
            "monsters": [
                "deep_widow"
            ],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "primadon",
                "chaser"
            ],
            "quests": [],
            "other": [
                "pure_ore"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 6,
                "posture": 2
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "hoplite"
            ],
            "mantras": []
        })
    }),
    brown_megalodaunt_coat: new classes.equipment({
        "name": "brown_megalodaunt_coat",
        "rich_name": "Brown Megalodaunt Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [ 
            "blue_megalodaunt_coat", 
            "peach_megalodaunt_coat", 
            "red_megalodaunt_coat", 
            "purple_megalodaunt_coat", 
            "green_megalodaunt_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "megalodaunt"
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "dvm": 0.05,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    blue_megalodaunt_coat: new classes.equipment({
        "name": "blue_megalodaunt_coat",
        "rich_name": "Blue Megalodaunt Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "brown_megalodaunt_coat",
            "peach_megalodaunt_coat",
            "red_megalodaunt_coat",
            "purple_megalodaunt_coat",
            "green_megalodaunt_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE,
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "megalodaunt"
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "dvm": 0.05,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    peach_megalodaunt_coat: new classes.equipment({
        "name": "peach_megalodaunt_coat",
        "rich_name": "Peach Megalodaunt Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "brown_megalodaunt_coat",
            "blue_megalodaunt_coat",
            "red_megalodaunt_coat",
            "purple_megalodaunt_coat",
            "green_megalodaunt_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE,
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "megalodaunt"
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "dvm": 0.05,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    red_megalodaunt_coat: new classes.equipment({
        "name": "red_megalodaunt_coat",
        "rich_name": "Red Megalodaunt Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "brown_megalodaunt_coat",
            "blue_megalodaunt_coat",
            "peach_megalodaunt_coat",
            "purple_megalodaunt_coat",
            "green_megalodaunt_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE,
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "megalodaunt"
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "dvm": 0.05,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    purple_megalodaunt_coat: new classes.equipment({
        "name": "purple_megalodaunt_coat",
        "rich_name": "Purple Megalodaunt Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "brown_megalodaunt_coat",
            "blue_megalodaunt_coat",
            "peach_megalodaunt_coat",
            "red_megalodaunt_coat",
            "green_megalodaunt_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE,
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "megalodaunt"
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "dvm": 0.05,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    green_megalodaunt_coat: new classes.equipment({
        "name": "green_megalodaunt_coat",
        "rich_name": "Green Megalodaunt Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "brown_megalodaunt_coat",
            "blue_megalodaunt_coat",
            "peach_megalodaunt_coat",
            "red_megalodaunt_coat",
            "purple_megalodaunt_coat"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE,
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "megalodaunt"
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "dvm": 0.05,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    mercenarys_garb: new classes.equipment({
        "name": "mercenarys_garb",
        "rich_name": "Mercenary's Garb",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "crypt_of_the_unbroken",
                "miners_landing"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest"
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "stealth": 0.06
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "kick_off"
            ],
            "mantras": []
        })
    }),
    onyx_ministry_cloak: new classes.equipment({
        "name": "onyx_ministry_cloak",
        "rich_name": "Onyx Ministry Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "verdant_ministry_cloak", 
            "yellow_ministry_cloak", 
            "smoke_ministry_cloak", 
            "scarlet_ministry_cloak", 
            "pink_ministry_cloak"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "blizzard_knight" //todo: rename this cuz it comes from the chest not the actual thing
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "ether": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    verdant_ministry_cloak: new classes.equipment({
        "name": "verdant_ministry_cloak",
        "rich_name": "Verdant Ministry Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "onyx_ministry_cloak", 
            "yellow_ministry_cloak", 
            "smoke_ministry_cloak", 
            "scarlet_ministry_cloak", 
            "pink_ministry_cloak"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "blizzard_knight" //todo: rename this cuz it comes from the chest not the actual thing
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "ether": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    yellow_ministry_cloak: new classes.equipment({
        "name": "yellow_ministry_cloak",
        "rich_name": "Yellow Ministry Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "onyx_ministry_cloak", 
            "verdant_ministry_cloak", 
            "smoke_ministry_cloak", 
            "scarlet_ministry_cloak", 
            "pink_ministry_cloak"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "blizzard_knight" //todo: rename this cuz it comes from the chest not the actual thing
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "ether": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    smoke_ministry_cloak: new classes.equipment({
        "name": "smoke_ministry_cloak",
        "rich_name": "Smoke Ministry Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "onyx_ministry_cloak", 
            "verdant_ministry_cloak", 
            "yellow_ministry_cloak", 
            "scarlet_ministry_cloak", 
            "pink_ministry_cloak"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "blizzard_knight" //todo: rename this cuz it comes from the chest not the actual thing
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "ether": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    scarlet_ministry_cloak: new classes.equipment({
        "name": "scarlet_ministry_cloak",
        "rich_name": "Scarlet Ministry Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "onyx_ministry_cloak", 
            "verdant_ministry_cloak", 
            "yellow_ministry_cloak", 
            "smoke_ministry_cloak", 
            "pink_ministry_cloak"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "blizzard_knight" //todo: rename this cuz it comes from the chest not the actual thing
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "ether": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    pink_ministry_cloak: new classes.equipment({
        "name": "pink_ministry_cloak",
        "rich_name": "Pink Ministry Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "onyx_ministry_cloak", 
            "verdant_ministry_cloak", 
            "yellow_ministry_cloak", 
            "smoke_ministry_cloak", 
            "scarlet_ministry_cloak"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "enemies": [],
            "monsters": [
                "blizzard_knight" //todo: rename this cuz it comes from the chest not the actual thing
            ],
            "bosses": [],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5,
                "ether": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    ministry_operative_cloak: new classes.equipment({
        "name": "ministry_operative_cloak",
        "rich_name": "Ministry Operative Cloak",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_eternal_gale",
                "crypt_of_the_unbroken",
                "saramaed_hollow"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "dread_serpent"
            ],
            "quests": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "stealth": 0.06,

            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "ether_conduit"
            ],
            "mantras": []
        })
    }),
    monastery_champion_robes: new classes.equipment({
        "name": "monastery_champion_robes",
        "rich_name": "Monastery Champion Robes",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "etris_siege",
                "the_diluvian_mechanism"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest"
            ],
            "quests": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 8,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "temple_guard"
            ], 
            "mantras": []
        })
    }),
    moonseye_gauntlets: new classes.equipment({
        "name": "moonseye_gauntlets",
        "rich_name": "Moonseye Gauntlets",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_depths",
                "the_diluvian_mechanism"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
                "primadon"
            ],
            "quests": [],
            "other": [
                "sea_event"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 7,
                "posture": 3
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    novice_brace: new classes.equipment({
        "name": "novice_brace",
        "rich_name": "Novice Brace",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "erisia",
            ],
            "enemies": [
                "eastern_tribal_leader",
                "blacksteel_pirate"
            ],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest",
                "dread_serpent"
            ],
            "quests": [],
            "other": [
                "hell_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    ash_pathfinder_elite: new classes.equipment({
        "name": "ash_pathfinder_elite",
        "rich_name": "Ash Pathfinder Elite",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "black_pathfinder_elite", 
            "crimson_pathfinder_elite", 
            "sage_pathfinder_elite"
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_diluvian_mechanism"
            ],
            "enemies": [],
            "monsters": [
                "nautilodaunt"
            ],
            "bosses": [],
            "quests": [],
            "shops": [
                "weird_trader"
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "dvm": 0.05,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    black_pathfinder_elite: new classes.equipment({
        "name": "black_pathfinder_elite",
        "rich_name": "Black Pathfinder Elite",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "ash_pathfinder_elite", 
            "crimson_pathfinder_elite", 
            "sage_pathfinder_elite"
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_diluvian_mechanism"
            ],
            "enemies": [],
            "monsters": [
                "nautilodaunt"
            ],
            "bosses": [],
            "quests": [],
            "shops": [
                "weird_trader"
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "dvm": 0.05,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    crimson_pathfinder_elite: new classes.equipment({
        "name": "crimson_pathfinder_elite",
        "rich_name": "Crimson Pathfinder Elite",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "ash_pathfinder_elite", 
            "black_pathfinder_elite", 
            "sage_pathfinder_elite"
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_diluvian_mechanism"
            ],
            "enemies": [],
            "monsters": [
                "nautilodaunt"
            ],
            "bosses": [],
            "quests": [],
            "shops": [
                "weird_trader"
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "dvm": 0.05,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    sage_pathfinder_elite: new classes.equipment({
        "name": "sage_pathfinder_elite",
        "rich_name": "Sage Pathfinder Elite",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "ash_pathfinder_elite", 
            "black_pathfinder_elite", 
            "crimson_pathfinder_elite"
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "the_diluvian_mechanism"
            ],
            "enemies": [],
            "monsters": [
                "nautilodaunt"
            ],
            "bosses": [],
            "quests": [],
            "shops": [
                "weird_trader"
            ],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "dvm": 0.05,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    providence_coat: new classes.equipment({
        "name": "providence_coat",
        "rich_name": "Providence Coat",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "the_depths"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "shops": [],
            "other": [
                "war_mode",
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 5
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "braced_collapse"
            ],
            "mantras": []
        })
    }),
    rangers_brace: new classes.equipment({
        "name": "rangers_brace",
        "rich_name": "Ranger's Brace",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 8
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": null, // TODO: FIND!!!
        "rarity": Enum.ItemRarity.RARE, // TODO: VERIFY!!!!
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "erisia"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "dread_serpent",
                "chaser"
            ],
            "quests": [],
            "shops": [],
            "other": [
                "hell_mode",
                "artifact_chest"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    redsteel_pauldrons: new classes.equipment({
        "name": "redsteel_pauldrons",
        "rich_name": "Redsteel Pauldrons",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "summer_isle",
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "primadon",
                "maestro_evengarde_rest",
                "dread_serpent"
            ],
            "quests": [],
            "shops": [],
            "other": [
                "chime_of_conflict",
                "sea_event_knives_vs_etrea"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 3,
                "posture": 1
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    dark_royal_duelist: new classes.equipment({
        "name": "dark_royal_duelist",
        "rich_name": "Dark Royal Duelist",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 13
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [ 
            "faded_royal_duelist", 
            "red_royal_duelist", 
            "rose_royal_duelist", 
            "stained_royal_duelist", 
            "purple_royal_duelist"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "minityrsa",
                "songseeker_wilds"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "shops": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    faded_royal_duelist: new classes.equipment({
        "name": "faded_royal_duelist",
        "rich_name": "Faded Royal Duelist",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [ 
            "dark_royal_duelist", 
            "red_royal_duelist", 
            "rose_royal_duelist", 
            "stained_royal_duelist", 
            "purple_royal_duelist"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "minityrsa",
                "songseeker_wilds"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "shops": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    red_royal_duelist: new classes.equipment({
        "name": "red_royal_duelist",
        "rich_name": "Red Royal Duelist",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "dark_royal_duelist",
            "faded_royal_duelist",
            "rose_royal_duelist",
            "stained_royal_duelist",
            "purple_royal_duelist"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipType.RARE,
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "minityrsa",
                "songseeker_wilds"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "shops": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
        }),
    rose_royal_duelist: new classes.equipment({
        "name": "rose_royal_duelist",
        "rich_name": "Rose Royal Duelist",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "dark_royal_duelist",
            "faded_royal_duelist",
            "red_royal_duelist",
            "stained_royal_duelist",
            "purple_royal_duelist"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipType.RARE,
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "minityrsa",
                "songseeker_wilds"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "shops": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    stained_royal_duelist: new classes.equipment({
        "name": "stained_royal_duelist",
        "rich_name": "Stained Royal Duelist",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "dark_royal_duelist",
            "faded_royal_duelist",
            "red_royal_duelist",
            "rose_royal_duelist",
            "purple_royal_duelist"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipType.RARE,
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "minityrsa",
                "songseeker_wilds"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "shops": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    purple_royal_duelist: new classes.equipment({
        "name": "purple_royal_duelist",
        "rich_name": "Purple Royal Duelist",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "dark_royal_duelist",
            "faded_royal_duelist",
            "red_royal_duelist",
            "rose_royal_duelist",
            "stained_royal_duelist"
        ],
        "selling_price": 14,
        "rarity": Enum.ItemRarity.UNCOMMON,
        "pips": [
            Enum.PipType.RARE,
            Enum.PipType.RARE
        ],
        "obtained_from": {
            "locations": [
                "minityrsa",
                "songseeker_wilds"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [],
            "quests": [],
            "shops": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        })
    }),
    royal_pathfinder: new classes.equipment({
        "name": "royal_pathfinder",
        "rich_name": "Royal Pathfinder",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 10,
            }),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "starswept_valley"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "duke_erisia"
            ],
            "quests": [],
            "shops": [],
            "other": []
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 6
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "ready_or_not"
            ],
            "mantras": []
        })
    }),
    sandrunner_wraps: new classes.equipment({
        "name": "sandrunner_wraps",
        "rich_name": "Sandrunner Wraps",
        "type": Enum.EquipmentType.ARMS,
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "back_view_sandrunner_wraps"
        ],
        "selling_price": 25,
        "rarity": Enum.ItemRarity.RARE,
        "pips": [
            Enum.PipType.RARE, 
            Enum.PipType.LEGENDARY
        ],
        "obtained_from": {
            "locations": [
                "miners_landing",
                "the_depths"
            ],
            "enemies": [],
            "monsters": [],
            "bosses": [
                "maestro_evengarde_rest"
            ],
            "quests": [],
            "shops": [],
            "other": [
                "war_mode"
            ]
        },
        "innate": new classes.characterData({
            "character": new classes.characterStats({
                "health": 6,
                "stealth": 0.04,
                "resistances": {
                    "fire": 0.08
                }
            }),
            "stats": new classes.statDistribution({}),
            "talents": [
                "kick_off"
            ],
            "mantras": []
        })
    }),
    // #endregion
    // #region LEGS EQUIPMENT
    // #endregion
    // #region TORSO EQUIPMENT
    // #endregion
    // #region FACE EQUIPMENT
    // #endregion
    // #region EAR EQUIPMENT
    // #endregion
    // #region RING EQUIPMENT
    // #endregion
}