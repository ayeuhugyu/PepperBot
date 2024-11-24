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
                "base": {
                    "agility": 10
                }
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
                "base": {
                    "agility": 10
                }
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
                "base": {
                    "agility": 10
                }
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
                "base": {
                    "agility": 10
                }
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
        "variants": [],
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