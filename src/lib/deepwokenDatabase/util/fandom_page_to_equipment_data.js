import fs from "fs";

async function fetchFandomPageData(pageTitle) {
    const url = `https://deepwoken.fandom.com/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=${encodeURIComponent(pageTitle)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Extract the page content from the JSON response
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        const pageContent = pages[pageId].revisions[0]['*'];
        const title = pages[pageId].title;

        return [pageContent, title];
    } catch (error) {
        console.error('Error fetching Fandom page data:', error);
        return null;
    }
}

// Example usage
function snakeCaseIfy(string) {
    return string.toLowerCase().replaceAll(" ", "_").replaceAll("'", "").replaceAll("(", "").replaceAll(")", "");
}

const pageTitle = "Sandrunner_Wraps";
fetchFandomPageData(pageTitle).then(([pageContent, title]) => {
    console.log(pageContent);
    const regex = [
        /\|type=(.*?)\|/s,
        /\|rarity=(.*?)\|/s,
        /\|requirements=(.*?)\|/s,
        /\|innate stats=(.*?)\|/s,
        /\|innate talent=(.*?)\|/s,
        /\|obtainment=(.*?)\|/s,
        /\|selling price={{Notes1\|(\d*)}}\|/s,
        /\|description=(.*?)\|/s,
        /<span .*?">\+(\d) (.*?) Pips?<\/span>/g,
        /<gallery>(.*?)<\/gallery>/sg,
    ]
    const data = {
        title: title,
        type: regex[0].exec(pageContent)?.[1],
        rarity: regex[1].exec(pageContent)?.[1],
        requirements: regex[2].exec(pageContent)?.[1],
        innateStats: regex[3].exec(pageContent)?.[1],
        innateTalent: regex[4].exec(pageContent)?.[1],
        obtainment: regex[5].exec(pageContent)?.[1],
        sellingPrice: regex[6].exec(pageContent)?.[1],
        description: regex[7].exec(pageContent)?.[1],
        gallery: regex[9].exec(pageContent)?.[1]
    }
    const pips = [];
    let match;
    while ((match = regex[8].exec(data.innateStats)) !== null) {
        const quantity = match[1];
        const type = match[2];
        for (let i = 0; i < quantity; i++) {
            pips.push("Enum.PipType." + type.toUpperCase());
        }
    }
    const gallerySplit = data.gallery?.split("\n") || [];
    let galleryItems = [];
    for (let i = 0; i < gallerySplit.length; i++) {
        const item = gallerySplit[i];
        if (item.includes("|")) {
            const itemData = item.split("|");
            const name = itemData[1];
            galleryItems.push(snakeCaseIfy(name) + "_" + snakeCaseIfy(title));
        }
    }
    console.log(galleryItems);
    console.log(pips);

    const formattedData = `${snakeCaseIfy(title)}: new classes.equipment({
            "name": "${snakeCaseIfy(title)}",
            "rich_name": "${title}",
            "type": Enum.EquipmentType.${data.type.toUpperCase().replaceAll("\n", "")},
            "description": "...",
            "requirements": new classes.characterData({ // ${data.requirements?.replaceAll("\n", ", ")?.replaceAll("<br>", "")}
                "character": new classes.characterStats({}),
                "stats": new classes.statDistribution({}),
                "talents": [],
                "mantras": []
            }),
            "variants": [${galleryItems.length > 0 ? "\n                \"" : ""}${galleryItems.join("\", \n                \"")}${galleryItems.length > 0 ? "\"\n            " : ""}],
            "selling_price": ${data.sellingPrice},
            "rarity": Enum.ItemRarity.${data.rarity.toUpperCase().replaceAll("\n", "")},
            "pips": [${pips.length > 0 ? "\n                " : ""}${pips.join(", \n                ")}${pips.length > 0 ? "\n            " : ""}],
            "obtained_from": { // ${data.obtainment?.replaceAll("\n", ", ").replaceAll("<br>", "")}
                "locations": [],
                "enemies": [],
                "monsters": [],
                "bosses": [],
                "quests": [],
                "shops": [],
                "other": []
            },
            "innate": new classes.characterData({
                "character": new classes.characterStats({}), // ${data.innateStats?.replaceAll("\n", ", ")?.replaceAll("<br>", "")}
                "stats": new classes.statDistribution({}),
                "talents": [], // ${data.innateTalent?.replaceAll("\n", ", ")?.replaceAll("<br>", "")}
                "mantras": []
            })
        }),`
    console.log(formattedData);
    fs.writeFileSync(`src/lib/deepwokenDatabase/util/fandom_output.js`, formattedData);
});
