import * as classes from "../lib/classDefinitions.js"
import * as Enum from "../lib/enums.js"

export default {
    arcwarder: new classes.oath({
        "name": "arcwarder",
        "rich_name": "Arcwarder",
        "description": "You vow to be a shield for your comrades, to wear your regalia with pride and serve the greater collective. From each according to their ability, to each according to their needs.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 0,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": null,
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                }
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 20,
                    "frostdraw": 0,
                    "thundercall": 20,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 0,
                    "medium": 0,
                    "heavy": 0
                },
                "base": {
                    "strength": 0,
                    "fortitude": 20,
                    "agility": 0,
                    "intelligence": 0,
                    "willpower": 0,
                    "charisma": 0
                }
            }),
            "talents": [],
            "mantras": []
        }),
        "oathgiver": "delta",
        "mantraSlots": {
            "combat": 2,
            "mobility": 0,
            "support": 0,
            "wildcard": 1
        },
        "talents": [
            "arc_module_leap",
            "arc_module_dash",
            "arc_module_eject",
            "arc_module_guard",
            "arc_module_null"
        ],
        "mantras": [
            "arc_suit",
            "arc_wave",
            "arc_beam"
        ],
        "progression": [
            new classes.oathProgression({
                "level": 0,
                "talents": [
                    "arc_module_leap",
                    "arc_module_dash"
                ],
                "mantras": [
                    "arc_suit"
                ]
            }),
            new classes.oathProgression({
                "level": 1,
                "talents": [
                    "arc_module_eject"
                ],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 2,
                "talents": [],
                "mantras": [
                    "arc_wave"
                ]
            }),
            new classes.oathProgression({
                "level": 3,
                "talents": [
                    "arc_module_guard"
                ],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 4,
                "talents": [
                    "arc_module_null"
                ],
                "mantras": [
                    "arc_beam"
                ]
            })
        ]
    }),
    blindseer: new classes.oath({
        "name": "blindseer",
        "rich_name": "Blindseer",
        "description": "You vow to not let the horrors of the world pierce your tightly fastened blindfold. Everything is simply as we choose to percieve it.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 0,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": null,
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                }
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 0,
                    "frostdraw": 0,
                    "thundercall": 0,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 0,
                    "medium": 0,
                    "heavy": 0
                },
                "base": {
                    "strength": 0,
                    "fortitude": 0,
                    "agility": 0,
                    "intelligence": 0,
                    "willpower": 40,
                    "charisma": 0
                }
            }),
            "talents": [
                "breathing_exercise",
                "conquer_your_fears",
                "disbelief",
                "blinded"
            ],
            "mantras": []
        }),
        "oathgiver": "???",
        "mantraSlots": {
            "combat": 0,
            "mobility": 0,
            "support": 1,
            "wildcard": 1
        },
        "talents": [
            "all_seeing_eye"
        ],
        "mantras": [
            "mindsoothe",
            "tranquil_circle",
            "sightless_beam"
        ],
        "progression": [
            new classes.oathProgression({
                "level": 0,
                "talents": [],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 1,
                "talents": [],
                "mantras": [
                    "mindsoothe"
                ]
            }),
            new classes.oathProgression({
                "level": 2,
                "talents": [],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 3,
                "talents": [],
                "mantras": [
                    "tranquil_circle"
                ]
            }),
            new classes.oathProgression({
                "level": 4,
                "talents": [
                    "all_seeing_eye"
                ],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 5,
                "talents": [],
                "mantras": [
                    "sightless_beam"
                ]
            })
        ]
    }),
    bladeharper: new classes.oath({
        "name": "bladeharper",
        "rich_name": "Bladeharper",
        "description": "You vow to carry your blade as an instrument, to lend yourself to any cause it guides you to. Collapse the infinite number of possibilities ahead of you into just one. The blade keeps you as much as you keep it.",
        "cumulative_stats": true,
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 0,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": "any",
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                },
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 0,
                    "frostdraw": 0,
                    "thundercall": 0,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 90,
                    "medium": 75,
                    "heavy": 90
                },
                "base": {
                    "strength": 25,
                    "fortitude": 0,
                    "agility": 25,
                    "intelligence": 0,
                    "willpower": 0,
                    "charisma": 0
                }
            }),
            "talents": [],
            "mantras": []
        }),
        "oathgiver": "the_sky_statue",
        "mantraSlots": {
            "combat": 2,
            "mobility": 0,
            "support": 0,
            "wildcard": 0
        },
        "talents": [
            "lithe_step",
            "soaring_storm",
            "untouchable",
            "reveal",
            "float_like_a_butterfly"
        ],
        "mantras": [
            "palm_strike",
            "decimate"
        ],
        "progression": [
            new classes.oathProgression({
                "level": 0,
                "talents": [
                    "lithe_step"
                ],
                "mantras": [
                    "palm_strike"
                ]
            }),
            new classes.oathProgression({
                "level": 1,
                "talents": [
                    "soaring_storm",
                    "untouchable"
                ],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 2,
                "talents": [
                    "reveal",
                    "float_like_a_butterfly"
                ],
                "mantras": [
                    "decimate"
                ]
            })
        ]
    }), // TODO: come up with a way to have alternate stats
    contractor: new classes.oath({
        "name": "contractor",
        "rich_name": "Contractor",
        "description": "Your heart is forever now eternally tied to Zi'eer, the 4th Prophet of the Ministry. You swear to serve under his will, no matter the cost.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 0,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": "any",
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                },
                "reputation": {
                    "ministry": 1,
                    "etrea": 150
                }
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 0,
                    "frostdraw": 0,
                    "thundercall": 0,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 0,
                    "medium": 0,
                    "heavy": 0
                },
                "base": {
                    "strength": 0,
                    "fortitude": 0,
                    "agility": 0,
                    "intelligence": 0,
                    "willpower": 0,
                    "charisma": 0
                }
            }),
            "talents": [],
            "mantras": []
        }),
        "oathgiver": "the_lord_regent",
        "mantraSlots": {
            "combat": 2,
            "mobility": 0,
            "support": 0,
            "wildcard": 0
        },
        "talents": [
            "hidden_tendril",
            "string_trick"
        ],
        "mantras": [
            "judgement",
            "lords_slice",
            "equalizer"
        ],
        "progression": [
            new classes.oathProgression({
                "level": 0,
                "talents": [],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 1,
                "talents": [
                    "hidden_tendril"
                ],
                "mantras": [
                    "lords_slice"
                ]
            }),
            new classes.oathProgression({
                "level": 2,
                "talents": [],
                "mantras": [
                    "equalizer"
                ]
            }),
            new classes.oathProgression({
                "level": 3,
                "talents": [
                    "string_trick"
                ],
                "mantras": [
                    "judgement"
                ]
            })
        ]
    }),
    chainwarden: new classes.oath({
        "name": "chainwarden",
        "rich_name": "Chainwarden",
        "description": "You vow to be the chain that binds the wicked and drags them back where they belong. There are those in this world who should not be free.",
        "cumulative_stats": true,
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 0,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": "any",
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                },
                "reputation": {
                    "authority": 150
                }
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 0,
                    "frostdraw": 0,
                    "thundercall": 0,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 0,
                    "medium": 0,
                    "heavy": 0
                },
                "base": {
                    "strength": 40,
                    "fortitude": 40,
                    "agility": 0,
                    "intelligence": 0,
                    "willpower": 40,
                    "charisma": 0
                }
            }),
            "talents": [],
            "mantras": []
        }),
        "oathgiver": "vice_warden_morreth",
        "mantraSlots": {
            "combat": 1,
            "mobility": 0,
            "support": 0,
            "wildcard": 1
        },
        "talents": [
            "perpetual_wrath",
            "chain_lash"
        ],
        "mantras": [
            "restrain",
            "impel",
            "rupture"
        ],
        "progression": [] // TODO: figure out chainwarden progression its not on wiki
    }), // TODO: alternate stats :/
    dawnwalker: new classes.oath({
        "name": "dawnwalker",
        "rich_name": "Dawnwalker",
        "description": "You vow to forever reach towards the brilliant Light. There is no shadow that your radiance cannot expunge.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 0,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": "any",
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                },
                "reputation": {}
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 0,
                    "frostdraw": 0,
                    "thundercall": 0,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 0,
                    "medium": 0,
                    "heavy": 0
                },
                "base": {
                    "strength": 0,
                    "fortitude": 0,
                    "agility": 0,
                    "intelligence": 0,
                    "willpower": 0,
                    "charisma": 0
                }
            }),
            "talents": [],
            "mantras": []
        }),
        "oathgiver": "klaris_llfiend",
        "mantraSlots": {
            "combat": 2,
            "mobility": 0,
            "support": 0,
            "wildcard": 0
        },
        "talents": [
            "protagonist_syndrome",
            "absolute_radiance",
            "luminous_flash"
        ],
        "mantras": [
            "blinding_dawn",
            "radiant_dawn",
            "radiant_kick",
        ],
        "progression": [
            new classes.oathProgression({
                "level": 0,
                "talents": [],
                "mantras": [
                    "blinding_dawn"
                ]
            }),
            new classes.oathProgression({
                "level": 1,
                "talents": [],
                "mantras": [
                    "radiant_kick"
                ]
            }),
            new classes.oathProgression({
                "level": 2,
                "talents": [
                    "protagonist_syndrome"
                ],
                "mantras": [
                    "radiant_dawn"
                ]
            }),
            new classes.oathProgression({
                "level": 3,
                "talents": [
                    "absolute_radiance",
                    "luminous_flash"
                ],
                "mantras": []
            })
        ]
    }),
    fadetrimmer: new classes.oath({
        "name": "fadetrimmer",
        "rich_name": "Fadetrimmer",
        "description": "You vow to forever hone your precision with the scissors. There will never be another fringe incident again.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 12,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": "any",
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                },
                "reputation": {}
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 0,
                    "frostdraw": 0,
                    "thundercall": 0,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 0,
                    "medium": 0,
                    "heavy": 0
                },
                "base": {
                    "strength": 0,
                    "fortitude": 0,
                    "agility": 0,
                    "intelligence": 0,
                    "willpower": 0,
                    "charisma": 0
                }
            }),
            "talents": [],
            "mantras": []
        }),
        "oathgiver": "barber",
        "mantraSlots": {
            "combat": 1,
            "mobility": 0,
            "support": 0,
            "wildcard": 1
        },
        "talents": [
            "fadetrimmers_skillset", 
            "hair_products", 
            "hair_spray"
        ],
        "mantras": [
            "precision_cuts", 
            "close_shave",
        ],
        "progression": [
            new classes.oathProgression({
                "level": 0,
                "talents": [
                    "fadetrimmers_skillset", 
                    "hair_products", 
                    "hair_spray"
                ],
                "mantras": [
                    "precision_cuts", 
                    "close_shave",
                ],
            }),
        ]
    }),
    jetstriker: new classes.oath({
        "name": "jetstriker",
        "rich_name": "Jetstriker",
        "description": "You vow to flow with the Song itself, drifting across where the trails may take you. If the Song permeates everything, then let it be your conduit, and you its master.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 0,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": "any",
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                },
                "reputation": {}
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 0,
                    "frostdraw": 0,
                    "thundercall": 0,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 0,
                    "medium": 0,
                    "heavy": 0
                },
                "base": {
                    "strength": 0,
                    "fortitude": 0,
                    "agility": 50,
                    "intelligence": 0,
                    "willpower": 0,
                    "charisma": 0
                }
            }),
            "talents": [],
            "mantras": []
        }),
        "oathgiver": "",
        "mantraSlots": {
            "combat": 0,
            "mobility": 1,
            "support": 0,
            "wildcard": 1
        },
        "talents": [
            "acceleration_points", 
            "jetstream_pursuit", 
            "momentum_bar", 
            "stratos_step", 
            "decisive_winds", 
            "rush_of_ancients"
        ],
        "mantras": [
            "false_strike", 
            "jet_kick"
        ],
        "progression": [
            new classes.oathProgression({
                "level": 0,
                "talents": [
                    "momentum_bar"
                ],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 1,
                "talents": [
                    "acceleration_points"
                ],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 2,
                "talents": [
                    "jetstream_pursuit"
                ],
                "mantras": [
                    "false_strike"
                ]
            }),
            new classes.oathProgression({
                "level": 3,
                "talents": [
                    "stratos_step"
                ],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 4,
                "talents": [
                    "decisive_winds"
                ],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 5,
                "talents": [
                    "rush_of_ancients"
                ],
                "mantras": [
                    "jet_kick"
                ]
            })
        ]
    }), // TODO: verify progression
    linkstrider: new classes.oath({
        "name": "linkstrider",
        "rich_name": "Linkstrider",
        "description": "The Entropy Catalyst generated enough force to fundementally change your state of existence. You now exist between two states, your newfound clarity making the imperceptible Bonds between all souls malleable to you.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 0,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": "any",
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                },
                "reputation": {}
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 0,
                    "frostdraw": 0,
                    "thundercall": 0,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 0,
                    "medium": 0,
                    "heavy": 0
                },
                "base": {
                    "strength": 0,
                    "fortitude": 0,
                    "agility": 0,
                    "intelligence": 0,
                    "willpower": 0,
                    "charisma": 0
                }
            }),
            "talents": [],
            "mantras": []
        }),
        "oathgiver": "the_entropy_catalyst",
        "mantraSlots": {
            "combat": 0,
            "mobility": 0,
            "support": 2,
            "wildcard": 1
        },
        "talents": [
            "entropy_link",
            "symbiotic_link"
        ],
        "mantras": [
            "symbiotic_sustain",
            "parasitic_leech",
        ],
        "progression": [
            new classes.oathProgression({
                "level": 0,
                "talents": [],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 1,
                "talents": [
                    "entropy_link"
                ],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 2,
                "talents": [
                    "symbiotic_link"
                ],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 3,
                "talents": [],
                "mantras": [
                    "symbiotic_sustain"
                ]
            }),
            new classes.oathProgression({
                "level": 4,
                "talents": [],
                "mantras": [
                    "parasitic_leech"
                ]
            })
        ]
    }),
    oathless: new classes.oath({
        "name": "oathless",
        "rich_name": "Oathless",
        "description": "You vow to never be bound to any oath; to live your life free of restraint. If free will is an illusion, why not make it a convincing one?",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 0,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": "any",
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                },
                "reputation": {}
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 0,
                    "frostdraw": 0,
                    "thundercall": 0,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 0,
                    "medium": 0,
                    "heavy": 0
                },
                "base": {
                    "strength": 0,
                    "fortitude": 0,
                    "agility": 0,
                    "intelligence": 0,
                    "willpower": 0,
                    "charisma": 0
                }
            }),
            "talents": [],
            "mantras": []
        }),
        "oathgiver": "cerulean",
        "mantraSlots": {
            "combat": 0,
            "mobility": 0,
            "support": 0,
            "wildcard": 2
        },
        "talents": [],
        "mantras": [],
        "progression": [
            new classes.oathProgression({
                "level": 0,
                "talents": [],
                "mantras": []
            }),
        ]
    }),
    saltchemist: new classes.oath({
        "name": "saltchemist",
        "rich_name": "Saltchemist",
        "description": "You vow to dedicate body and mind to the furthering of the Material Arts. Your body is a conduit through which true knowledge shall be siphoned. Knowledge is power, and you shall be its vessel.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 0,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": "any",
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                },
                "reputation": {}
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 0,
                    "frostdraw": 0,
                    "thundercall": 0,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 0,
                    "medium": 0,
                    "heavy": 0
                },
                "base": {
                    "strength": 0,
                    "fortitude": 0,
                    "agility": 0,
                    "intelligence": 75,
                    "willpower": 0,
                    "charisma": 0
                }
            }),
            "talents": [],
            "mantras": []
        }),
        "oathgiver": "adrofalis",
        "mantraSlots": {
            "combat": 0,
            "mobility": 0,
            "support": 1,
            "wildcard": 1
        },
        "talents": [
            "perpetual_distillery",
            "biotic_salts",
            "aromatic_salts",
            "antithetic_salts"
        ],
        "mantras": [
            "lethal_injection"
        ],
        "progression": [
            new classes.oathProgression({
                "level": 0,
                "talents": [
                    "perpetual_distillery",
                ],
                "mantras": [
                    "lethal_injection"
                ]
            }),
            new classes.oathProgression({
                "level": 1,
                "talents": [
                    "biotic_salts",
                    "aromatic_salts",
                    "antithetic_salts"
                ],
                "mantras": []
            }),
        ]
    }),
    silentheart: new classes.oath({ // TODO: ALTERNATE STATS!!!!!!!
        "name": "silentheart",
        "rich_name": "Silentheart",
        "description": "You vow to reject the Words of the Song, denying yourself if mantras in pursuit of your own path to true strength, no matter the cost. You can wield weapons with half the usual requirements.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 0,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": "any",
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                },
                "reputation": {}
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 0,
                    "frostdraw": 0,
                    "thundercall": 0,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 75,
                    "medium": 75,
                    "heavy": 75
                },
                "base": {
                    "strength": 25,
                    "fortitude": 0,
                    "agility": 25,
                    "intelligence": 0,
                    "willpower": 0,
                    "charisma": 25
                }
            }),
            "talents": [
                "ankle_cutter", 
                "dread_fighter", 
                "flow_state", 
                "mayhem", 
                "merciless_blade", 
                "relentless_hunt", 
                "rising_star", 
                "true_vantage", 
                "unmatched_dexterity", 
                "vengeful_pursuit"
            ],
            "mantras": []
        }),
        "oathgiver": "the_dreadstar",
        "mantraSlots": {
            "combat": 0,
            "mobility": 0,
            "support": 0,
            "wildcard": 0
        },
        "talents": [],
        "mantras": [],
        "progression": [
            new classes.oathProgression({
                "level": 0,
                "talents": [],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 1,
                "talents": [],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 2,
                "talents": [],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 3,
                "talents": [],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 4,
                "talents": [],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 5,
                "talents": [],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 6,
                "talents": [],
                "mantras": []
            }),
        ]
    }), // TODO: discover silentheart progression
    starkindred: new classes.oath({
        "name": "starkindred",
        "rich_name": "Starkindred",
        "description": "You vow to feel the knowledge of all that is, all at once. Your heart beats with the world itself, as the Stars above watch over you.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 0,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": "any",
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                },
                "reputation": {}
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 0,
                    "frostdraw": 0,
                    "thundercall": 0,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 0,
                    "medium": 0,
                    "heavy": 0
                },
                "base": {
                    "strength": 40,
                    "fortitude": 0,
                    "agility": 0,
                    "intelligence": 0,
                    "willpower": 0,
                    "charisma": 0
                }
            }),
            "talents": [],
            "mantras": []
        }),
        "oathgiver": "samael",
        "mantraSlots": {
            "combat": 2,
            "mobility": 0,
            "support": 0,
            "wildcard": 0
        },
        "talents": [
            "death_from_above"
        ],
        "mantras": [
            "ascension",
            "sinister_halo",
            "celestial_assault"
        ],
        "progression": [
            new classes.oathProgression({
                "level": 0,
                "talents": [
                    "death_from_above"
                ],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 1,
                "talents": [],
                "mantras": [
                    "ascension"
                ]
            }),
            new classes.oathProgression({
                "level": 2,
                "talents": [],
                "mantras": [
                    "sinister_halo"
                ]
            }),
            new classes.oathProgression({
                "level": 3,
                "talents": [],
                "mantras": [
                    "celestial_assault"
                ]
            }),
        ]
    }),
    visionshaper: new classes.oath({
        "name": "visionshaper",
        "rich_name": "Visionshaper",
        "description": "You vow to see only that which you wish to see. Reality itself is malleable, pliable to your deft hands.",
        "requirements": new classes.characterData({
            "character": new classes.characterStats({
                "level": 0,
                "health": 0,
                "ether": 0,
                "sanity": 0,
                "posture": 0,
                "carry_load": 0,
                "dvm": 0,
                "weapon_type": null,
                "murmur": null,
                "oath": null,
                "resonance": "any",
                "penetration": {
                    "melee": 0,
                    "mantra": 0
                },
                "resistance": {
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
                },
                "mantra_slots": {
                    "combat": 0,
                    "mobility": 0,
                    "support": 0,
                    "wildcard": 0
                },
                "reputation": {}
            }),
            "stats": new classes.statDistribution({
                "attunement": {
                    "flamecharm": 0,
                    "frostdraw": 0,
                    "thundercall": 0,
                    "galebreathe": 0,
                    "shadowcast": 0,
                    "ironsing": 0
                },
                "weapon": {
                    "light": 0,
                    "medium": 0,
                    "heavy": 0
                },
                "base": {
                    "strength": 0,
                    "fortitude": 0,
                    "agility": 0,
                    "intelligence": 0,
                    "willpower": 0,
                    "charisma": 50
                }
            }),
            "talents": [
                "cheap_trick"
            ],
            "mantras": [
                "illusory_servants",
                "illusory_counter",
                "mirror_illusion"
            ]
        }),
        "oathgiver": "the_nestmind",
        "mantraSlots": {
            "combat": 2,
            "mobility": 0,
            "support": 1,
            "wildcard": 0
        },
        "talents": [],
        "mantras": [],
        "progression": [
            new classes.oathProgression({
                "level": 0,
                "talents": [
                    "death_from_above"
                ],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 1,
                "talents": [],
                "mantras": [
                    "illusory_servants"
                ],
            }),
            new classes.oathProgression({
                "level": 2,
                "talents": [],
                "mantras": [
                    "illusory_counter"
                ]
            }),
            new classes.oathProgression({
                "level": 3,
                "talents": [
                    "cheap_trick"
                ],
                "mantras": []
            }),
            new classes.oathProgression({
                "level": 4,
                "talents": [],
                "mantras": [
                    "mirror_illusion"
                ]
            }),
        ]
    }),
}