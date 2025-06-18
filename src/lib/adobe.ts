import process from "node:process";
import * as log from "./log";

interface SearchParams {
    query: string;
    limit?: number;
    creatorId?: string;
    quality?: string;
}

interface FileData {
    id: string;
    title: string;
    creatorId: string;
    url: string;
    pageUrl: string;
}

export async function cleanupSearchResults(searchResults: Response): Promise<FileData[]> {
    const json = await searchResults.json();
    const files = json.files;
    let fileData: FileData[] = [];
    files.forEach((file: any) => {
        fileData.push({
            id: file.id,
            title: file.title,
            creatorId: file.creator_id,
            url: file.thumbnail_url,
            pageUrl: `https://stock.adobe.com/es/${file.id}`,
        });
    });
    return fileData;
}

export function search({ query, limit, creatorId, quality }: SearchParams): Promise<FileData[]> {
    return new Promise(async (resolve, reject) => {
        if (!query) {
            reject("no query provided");
            return;
        }
        let url = `https://stock.adobe.io/Rest/Media/1/Search/Files?locale=en_US&search_parameters[words]=${query}&search_parameters[filters][premium]=all`;
        if (limit) url += `&search_parameters[limit]=${limit}`;
        if (creatorId) url += `&search_parameters[creator_id]=${creatorId}`;
        if (quality) url += `&search_parameters[thumbnail_size]=${quality}`;
        if (!process.env.ADOBE_API_KEY) {
            reject("Adobe API key is not defined");
            return;
        }
        const result = await fetch(url, {
            headers: {
                "x-api-key": process.env.ADOBE_API_KEY,
                "x-product": "epperboYt/1.0",
            },
        });
        log.debug(`searched adobe stock for ${query} ` + (creatorId ? `by creator ${creatorId}` : "") + (limit ? ` with limit ${limit}` : "") + (quality ? ` with quality ${quality}` : ``));
        resolve(await cleanupSearchResults(result));
    });
}