sandrunner_wraps: new classes.equipment({
            "name": "sandrunner_wraps",
            "rich_name": "Sandrunner Wraps",
            "type": Enum.EquipmentType.ARMS,
            "description": "...",
            "requirements": new classes.characterData({ // None, 
                "character": new classes.characterStats({}),
                "stats": new classes.statDistribution({}),
                "talents": [],
                "mantras": []
            }),
            "variants": [
                "back_view_sandrunner_wraps"
            ],
            "selling_price": undefined,
            "rarity": Enum.ItemRarity.RARE,
            "pips": [
                Enum.PipType.RARE, 
                Enum.PipType.LEGENDARY
            ],
            "obtained_from": { // Chests from:, [[Miner's Landing]], [[Maestro Evengarde Rest]], [[First Layer]], [[War Mode]]
                "locations": [],
                "enemies": [],
                "monsters": [],
                "bosses": [],
                "quests": [],
                "shops": [],
                "other": []
            },
            "innate": new classes.characterData({
                "character": new classes.characterStats({}), // +6 Health, +4% Stealth, +8% Fire Armor, <span style="color:#EA8F8F;">+1 Rare Pip</span>, <span style="color:#0BFF7D;">+1 Legendary Pip</span>
                "stats": new classes.statDistribution({}),
                "talents": [], // Kick Off
                "mantras": []
            })
        }),