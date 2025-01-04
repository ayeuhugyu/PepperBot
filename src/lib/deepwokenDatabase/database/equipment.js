import * as Enum from '../lib/enumDefinitions.js'
import * as classes from '../lib/classDefinitions.js'

export default {
    // #region HEAD EQUIPMENT
    alchemists_hat: new classes.equipment({
        "name": "alchemists_hat",
        "rich_name": "Alchemist's Hat",
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
            "npcs": [
                "duke_erisia"
            ],
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
            "npcs": [
                "duke_erisia"
            ],
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
            "npcs": [
                "duke_erisia"
            ],
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
            "npcs": [
                "maestro_evengarde_rest",
                "duke_erisia"
            ],
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
            "npcs": [
                "primadon"
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
    gold_assassins_hood: new classes.equipment({
        "name": "gold_assassins_hood",
        "rich_name": "Gold Assassin's hood",
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
            "npcs": [
                "aelita",
                "cloaked_assassin"
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
            "npcs": [
                "aelita",
                "cloaked_assassin"
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
            "npcs": [
                "aelita",
                "cloaked_assassin"
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
            "npcs": [
                "authority_commander",
                "authority_officer",
                "authority_peacekeeper",
                "duke_erisia",
                "maestro_evengarde_rest",
                "chaser"
            ],
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
            "npcs": [
                "duke_erisia",
            ],
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
            "npcs": [
                "duke_erisia"
            ],
            "monsters": [
                "deep_widow"
            ],
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
            "npcs": [
                "duke_erisia"
            ],
            "monsters": [
                "deep_widow"
            ],
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
            "npcs": [
                "maestro_evengarde_rest"
            ],
            "monsters": [],
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "chaser",
                "golden_warriror"
            ],
            "monsters": [],
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest",
                "blacksteel_pirate"
            ],
            "monsters": [],
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest",
            ],
            "monsters": [],
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
            "npcs": [
                "maestro_evengarde_rest",
            ],
            "monsters": [],
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
            "npcs": [
                "chaser",
            ],
            "monsters": [],
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
            "npcs": [
                "chaser",
                "maestro_evengarde_rest",
                "duke_erisia"
            ],
            "monsters": [],
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
            "npcs": [
                "maestro_evengarde_rest",
                "duke_erisia"
            ],
            "monsters": [],
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
            "npcs": [
                "maestro_evengarde_rest",
                "duke_erisia"
            ],
            "monsters": [],
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
            "npcs": [
                "maestro_evengarde_rest",
                "duke_erisia"
            ],
            "monsters": [],
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
            "npcs": [
                "chef_odiolovaro",
            ],
            "monsters": [],
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest",
            ],
            "monsters": [
                "deep_widow"
            ],
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest",
            ],
            "monsters": [
                "primadon",
            ],
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
            "npcs": [],
            "monsters": [],
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest",
            ],
            "monsters": [
                "primadon"
            ],
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest",
            ],
            "monsters": [
                "dread_serpent"
            ],
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
            "npcs": [],
            "monsters": [],
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
            "npcs": [],
            "monsters": [],
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
            "npcs": [],
            "monsters": [],
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest"
            ],
            "monsters": [
                "dread_serpent"
            ],
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
            "npcs": [
                "duke_erisia"
            ],
            "monsters": [
                "deep_widow"
            ],
            "other": [
                "bounty_chest"
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
            "npcs": [],
            "monsters": [],
            "other": [
                "the_fisherman"
            ]
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest",
            ],
            "monsters": [
                "dread_serpent"
            ],
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
            "npcs": [
                "duke_erisia"
            ],
            "monsters": [
                "deep_widow",
                "primadon"
            ],
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
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "grey",
            "white",
            "ochre"
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
            "npcs": [],
            "monsters": [],
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
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "dark",
            "white",
            "ochre"
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
            "npcs": [],
            "monsters": [],
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
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "dark",
            "grey",
            "ochre"
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
            "npcs": [],
            "monsters": [],
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
        "description": "...",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "dark",
            "grey",
            "white",
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
            "npcs": [],
            "monsters": [],
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
            "npcs": [
                "immortal_guardian"
            ],
            "monsters": [],
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest"
            ],
            "monsters": [
                "dread_serpent"
            ],
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest"
            ],
            "monsters": [],
            "other": [
                "war_mode",
                "merchant_ships"
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
            "npcs": [
                "maestro_evengarde_rest",
                "chaser"
            ],
            "monsters": [
                "dread_serpent",
            ],
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
            "npcs": [],
            "monsters": [
                "ethiron"
            ],
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
    legate_helm: new classes.equipment({
        "name": "legate_helm",
        "rich_name": "Legate Helm",
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
            "npcs": [
                "duke_erisia"
            ],
            "monsters": [
                "deep_widow"
            ],
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
            "npcs": [],
            "monsters": [
                "mineskipper"
            ],
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
            "npcs": [
                "maestro_evengarde_rest",
            ],
            "monsters": [],
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
        "description": "A fullbody mushroom costume. You feel the strange urge to change your name to Fungbert, or perhaps Fungula.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "glowshroom",
            "metalshroom",
            "charmshroom",
            "zapshroom",
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "npcs": [],
            "monsters": [],
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
        "description": "A fullbody mushroom costume. You feel the strange urge to change your name to Fungbert, or perhaps Fungula.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "mushroom",
            "metalshroom",
            "charmshroom",
            "zapshroom",
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "npcs": [],
            "monsters": [],
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
        "description": "A fullbody mushroom costume. You feel the strange urge to change your name to Fungbert, or perhaps Fungula.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "mushroom",
            "glowshroom",
            "charmshroom",
            "zapshroom",
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "npcs": [],
            "monsters": [],
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
        "description": "A fullbody mushroom costume. You feel the strange urge to change your name to Fungbert, or perhaps Fungula.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "mushroom",
            "glowshroom",
            "metalshroom",
            "zapshroom",
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "npcs": [],
            "monsters": [],
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
        "description": "A fullbody mushroom costume. You feel the strange urge to change your name to Fungbert, or perhaps Fungula.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "mushroom",
            "glowshroom",
            "metalshroom",
            "charmshroom",
        ],
        "selling_price": 50,
        "rarity": Enum.ItemRarity.LEGENDARY,
        "pips": [],
        "obtained_from": {
            "locations": [],
            "npcs": [],
            "monsters": [],
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
            "npcs": [],
            "monsters": [],
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest"
            ],
            "monsters": [
                "dread_serpent"
            ],
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
            "npcs": [],
            "monsters": [
                "interluminary_parasol"
            ],
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
            "npcs": [],
            "monsters": [],
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
            "npcs": [],
            "monsters": [
                "primadon"
            ],
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
            "npcs": [
                "aska"
            ],
            "monsters": [],
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
            "npcs": [
                "duke_erisia",
                "chaser",
                "maestro_evengarde_rest"
            ],
            "monsters": [
                "primadon"
            ],
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest"
            ],
            "monsters": [
                "rogue_construct"
            ],
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
            "npcs": [],
            "monsters": [],
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
        "description": "While wearing a hat like this you start feeling the urge to exploit the surplus labor of the working class.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "slate",
            "beige"
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
            "npcs": [],
            "monsters": [],
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
        "description": "While wearing a hat like this you start feeling the urge to exploit the surplus labor of the working class.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "burgundy",
            "beige"
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
            "npcs": [],
            "monsters": [],
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
        "description": "While wearing a hat like this you start feeling the urge to exploit the surplus labor of the working class.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({}),
            "stats": new classes.statDistribution({}),
            "talents": [],
            "mantras": []
        }),
        "variants": [
            "burgundy",
            "slate"
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
            "npcs": [],
            "monsters": [],
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
            "npcs": [
                "duke_erisia",
                "chaser",
                "maestro_evengarde_rest"
            ],
            "monsters": [
                "deep_widow",
                "primadon"
            ],
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
            "npcs": [
                "duke_erisia",
                "maestro_evengarde_rest"
            ],
            "monsters": [
                "primadon"
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
    lilac_warlocks_brim: new classes.equipment({
        "name": "lilac_warlocks_brim",
        "rich_name": "Lilac Warlock's Brim",
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
            "verdant",
            "sky"
        ],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "npcs": [],
            "monsters": [
                "world_serpent"
            ],
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
            "lilac",
            "sky"
        ],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "npcs": [],
            "monsters": [
                "world_serpent"
            ],
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
            "lilac",
            "verdant"
        ],
        "selling_price": null,
        "rarity": Enum.ItemRarity.UNIQUE,
        "pips": [
            Enum.PipRarity.LEGENDARY
        ],
        "obtained_from": {
            "locations": [],
            "npcs": [],
            "monsters": [
                "world_serpent"
            ],
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
            "npcs": [],
            "monsters": [],
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
            "npcs": [],
            "monsters": [],
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
            "npcs": [],
            "monsters": [],
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
            "npcs": [],
            "monsters": [],
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
            "npcs": [],
            "monsters": [],
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
            "npcs": [],
            "monsters": [],
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