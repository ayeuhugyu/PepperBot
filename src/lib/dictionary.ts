import database from "./data_manager";
import * as log from "./log";

export class ThesaurusData {
    word: string;
    synonyms: string[] = [];
    antonyms: string[] = [];
    relatives: string[] = [];
    perDefinition: {
        definition: string;
        synonyms: string[];
        antonyms: string[];
        relatives: string[];
    }[] = [];

    constructor(word: string, data: ThesaurusAPIResponse) {
        this.word = word;
        if (!data[0]) {
            return;
        }
        if (typeof data[0] === "string") {
            this.synonyms = data as string[];
            return;
        }
        const exactData = (data as APIDefinitionData[]).filter(entry => entry.meta.id.toLowerCase() === word.toLowerCase());
        if (exactData.length === 0) {
            return;
        }
        // literally fuck you merriam webster
        exactData.map((data, index) => {
            let synonyms: string[] = [];
            synonyms.push(...data.def[0].sseq.map(seq => {
                const entry = seq[0].filter(seq => typeof seq !== "string")[0];
                const list = entry.syn_list ?? entry.sim_list ?? [];
                return list ? list.flat().map(syn => syn.wd) : [];
            }).flat());
            if (synonyms.length === 0) {
                synonyms.push(...data.meta.syns.flat());
            }
            let antonyms: string[] = [];
            antonyms.push(...data.def[0].sseq.map(seq => {
                const entry = seq[0].filter(seq => typeof seq !== "string")[0];
                const list = entry.opp_list ?? [];
                return list ? list.flat().map(ant => ant.wd) : [];
            }).flat());
            if (antonyms.length === 0) {
                antonyms.push(...data.meta.ants);
            }
            let relatives: string[] = [];
            relatives.push(...data.def[0].sseq.map(seq => {
                const entry = seq[0].filter(seq => typeof seq !== "string")[0];
                const list = entry.rel_list ?? [];
                return list ? list.flat().map(rel => rel.wd) : [];
            }).flat());
            // if there are no relatives i do not give a shit because there is not an alternative

            // push them all to the actual ones
            this.synonyms.push(...synonyms.flat());
            this.antonyms.push(...antonyms.flat());
            this.relatives.push(...relatives.flat());

            this.perDefinition[index] = {
                definition: data.shortdef[0],
                synonyms: synonyms.flat(),
                antonyms: antonyms.flat(),
                relatives: relatives.flat()
            }
        })
    }
}

export interface APIDefinitionData { // what in the ever living fuck is this piece of shit
    meta: {
        id: string;
        uuid: string;
        src: string;
        section: string;
        target: {
            tuuid: string;
            tsrc: string;
        };
        stems: string[];
        syns: string[][];
        ants: string[];
        offensive: boolean;
    };
    hwi: {
        hw: string;
    };
    fl: string;
    def: Array<{
        sseq: Array<Array<Array<string | {
            sn: string;
            dt: Array<
                [string, string] |
                [string, { t: string; }]
            >;
            syn_list?: Array<Array<{ wd: string }>>;
            sim_list?: Array<Array<{ wd: string }>>;
            opp_list?: Array<Array<{ wd: string }>>;
            rel_list?: Array<Array<{ wd: string; wvrs?: Array<{ wvl: string; wva: string }> }>>;
        }>>>;
    }>;
    shortdef: string[];
}
type ThesaurusAPIResponse = APIDefinitionData[] | string[];

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
            return response.json().catch(err => {
                log.error('failed to parse dictionary API response as JSON:', err);
                return Promise.reject(new Error('failed to parse API response as JSON: ' + err.message));
            });
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