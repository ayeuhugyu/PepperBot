import * as Enum from "../lib/enumDefinitions.js"
import * as classes from "../lib/classDefinitions.js"

export const attunement = {
    flamecharm: new classes.stat({
        "name": "flamecharm",
        "rich_name": "Flamecharm",
        "description": "Your ability to conjure flames and heat. Increases fire damage.",
        "shortform": "FLM",
        "category": Enum.StatCategory.ATTUNEMENT
    }),
    frostdraw: new classes.stat({
        "name": "frostdraw",
        "rich_name": "Frostdraw",
        "description": "Your ability to bring forth frost and the freezing cold. Increases ice damage.",
        "shortform": "ICE",
        "category": Enum.StatCategory.ATTUNEMENT
    }),
    thundercall: new classes.stat({
        "name": "thundercall",
        "rich_name": "Thundercall",
        "description": "Your ability to manipulate eletricity and energy. Increases lightning damage.",
        "shortform": "LTN",
        "category": Enum.StatCategory.ATTUNEMENT
    }),
    galebreathe: new classes.stat({
        "name": "galebreathe",
        "rich_name": "Galebreathe",
        "description": "Your ability to call upon the wind and control the air. Increases Wind damage.",
        "shortform": "GLE",
        "category": Enum.StatCategory.ATTUNEMENT
    }),
    shadowcast: new classes.stat({
        "name": "shadowcast",
        "rich_name": "Shadowcast",
        "description": "Your ability to manifest shadow and darkness. Increases shadow damage and ether drain.",
        "shortform": "SDW",
        "category": Enum.StatCategory.ATTUNEMENT
    }),
    ironsing: new classes.stat({
        "name": "ironsing",
        "rich_name": "Ironsing",
        "description": "Your ability to harness metal from your sorroundings. Increases Ironsing damage.",
        "shortform": "IRN",
        "category": Enum.StatCategory.ATTUNEMENT
    })
}
export const base = {
    strength: new classes.stat({
        "name": "strength",
        "rich_name": "Strength",
        "description": "Your raw physical strength. Increases armor PEN and Carry Load.",
        "shortform": "STR",
        "category": Enum.StatCategory.BASE
    }),
    fortitude: new classes.stat({
        "name": "fortitude",
        "rich_name": "Fortitude",
        "description": "Your ability to reisst damage and disease. Increases health slightly.",
        "shortform": "FTD",
        "category": Enum.StatCategory.BASE
    }),
    agility: new classes.stat({
        "name": "agility",
        "rich_name": "Agility",
        "description": "Your slight of hand and nimbleness. Improves Parkour and Stealth.",
        "shortform": "AGL",
        "category": Enum.StatCategory.BASE
    }),
    intelligence: new classes.stat({
        "name": "intelligence",
        "rich_name": "Intelligence",
        "description": "Your logical processing and problem solving skills. Increases Ether.",
        "shortform": "INT",
        "category": Enum.StatCategory.BASE
    }),
    willpower: new classes.stat({
        "name": "willpower",
        "rich_name": "Willpower",
        "description": "Your inner strength and ability to keep a steady mind. Increases Sanity and Tempo.",
        "shortform": "WIL",
        "category": Enum.StatCategory.BASE
    }),
    charisma: new classes.stat({
        "name": "charisma",
        "rich_name": "Charisma",
        "description": "Your ability to influence others with your personality. Increases Ether.",
        "shortform": "CHR",
        "category": Enum.StatCategory.BASE
    })
}
export const weapon = {
    light: new classes.stat({
        "name": "light",
        "rich_name": "Light Wep.",
        "description": "Your ability to wield Light Weapons such as Daggers, Guns, Rapiers, and Fists. Increases damage dealt with these weapons.",
        "shortform": "LHT",
        "category": Enum.StatCategory.WEAPON
    }),
    medium: new classes.stat({
        "name": "medium",
        "rich_name": "Medium Wep.",
        "description": "Your ability to wield Medium Weapons such as Swords, Clubs, and Spears. Increases damage dealt with these weapons.",
        "shortform": "MED",
        "category": Enum.StatCategory.WEAPON
    }),
    heavy: new classes.stat({
        "name": "heavy",
        "rich_name": "Heavy Wep.",
        "description": "Your ability to wield Heavy Weapons such as Greataxes, Greatswords, and Greathammers. Increases damage dealt with these weapons.",
        "shortform": "HVY",
        "category": Enum.StatCategory.WEAPON
    })
}

export default { ...base, ...attunement, ...weapon }