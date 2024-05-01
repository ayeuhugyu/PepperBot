export function search({ query, limit, creatorId, quality }) {
    return new Promise((resolve, reject) => {
        let url = `https://stock.adobe.io/Rest/Media/1/Search/Files?locale=en_US&search_parameters[words]=${query}&search_parameters[filters][premium]=all`;
        if (limit) url += `&search_parameters[limit]=${limit}`;
        if (creatorId) url += `&search_parameters[creator_id]=${creatorId}`;
        if (quality) url += `&search_parameters[thumbnail_size]=${quality}`;
        const result = fetch(url, {
            headers: {
                "x-api-key": process.env.ADOBE_API_KEY,
                "x-product": "myTestApp1.0",
            },
        });
        resolve(result);
    });
}

export async function cleanupSearchResults(searchResults) {
    const json = await searchResults.json();
    const files = json.files;
    let fileData = [];
    files.forEach((file) => {
        fileData.push({
            id: file.id,
            title: file.title,
            creatorId: file.creator_id,
            url: file.thumbnail_url,
            pageUrl: `https://stock.adobe.com/de/${file.id}`,
        });
    });
    return fileData;
}
