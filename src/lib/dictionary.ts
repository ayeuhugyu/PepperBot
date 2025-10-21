import database from "./data_manager";
import * as log from "./log";

export class ThesaurusData {
    word: string;
    synonyms: string[];
    antonyms: string[];

    constructor(word: string, data: APIThesaurusData | null) {
        this.word = word;
        this.synonyms = data ? data.syns.flat() : [];
        this.antonyms = data ? data.ants.flat() : [];
    }
}

export interface APIThesaurusData {
    id: string; // the word being requested
    stems: string[]; // list of root forms of the word
    syns: string[][]; // list of lists of synonyms
    ants: string[][]; // list of lists of antonyms
    offensive: boolean; // whether the word is considered offensive
}
type ThesaurusAPIResponse = {
    meta: APIThesaurusData;
    // there's much more, but we really dont care about it
}[] | string[];

const baseUrl = 'https://www.dictionaryapi.com/api/v3/references/thesaurus/json/';

function APIfetchWord(word: string): Promise<ThesaurusAPIResponse | null> {
    const apiKey = process.env.DICTIONARY_API_KEY;
    const url = `${baseUrl}${encodeURIComponent(word)}?key=${apiKey}`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                log.error(`dictionary API request failed with status ${response.status}`);
                return Promise.reject(new Error(`API request failed with status ${response.status}`));
            }
            return response.json();
        })
        .then((data: ThesaurusAPIResponse) => {
            return data;
        });
}

async function cacheWord(word: string, data: ThesaurusAPIResponse) {
    return await database("thesaurus_cache")
        .insert({
            word: word,
            data: JSON.stringify(data),
            created_at: Date.now()
        });
}

export async function getThesaurusData(word: string): Promise<ThesaurusAPIResponse | null> {
    // first check cache
    const cached = await database("thesaurus_cache")
        .where({ word: word })
        .first();

    if (cached) {
        log.debug(`thesaurus cache hit for word: ${word}`);
        return JSON.parse(cached.data) as ThesaurusAPIResponse;
    }
    log.debug(`thesaurus cache miss for word: ${word}, fetching from API`);

    // not in cache, fetch from API
    const apiResponse = await APIfetchWord(word);
    if (apiResponse) {
        await cacheWord(word, apiResponse);
    }
    return apiResponse;
}