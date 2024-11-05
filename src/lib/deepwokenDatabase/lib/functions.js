import oaths from "../database/oaths.js";
import attributes from "../database/attributes.js";
import murmurs from "../database/murmurs.js";

class DBError {
    constructor(message, code) {
        this.message = message;
        this.error = message;
        this.code = code;
        this.time = new Date();
    }
}

const punctuation = [".", ",", "!", "?", ";", ":", "-", "_", " ", "'", '"', "(", ")", "[", "]", "{", "}", "<", ">", "/", "\\", "|", "`", "~", "@", "#"]

export function  normalizeString(string) {
    return string.toLowerCase().split("").filter(char => !punctuation.includes(char)).join("");
}

export const data = {
    oaths: oaths,
    attributes: attributes,
    murmurs: murmurs
}

function getNestedProperty(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] !== 'undefined') ? o[k] : undefined, obj);
}

export function getItems(listName, key, value) {
    key = normalizeString(key);
    const list = data[listName];
    if (!list) {
        return new DBError(`invalid list name: ${listName}`, 404);
    }
    if (typeof value === "string") {
        value = normalizeString(value);
    }
    const items = Object.values(list).filter(item => normalizeString(getNestedProperty(item, key)) === value);
    if (items.length === 0) {
        return new DBError(`item with ${key} == ${value} not found in list: ${listName}`, 404);
    }
    return items;
}

export function getList(listName) {
    const list = data[listName];
    if (!list) {
        return new DBError(`invalid list name: ${listName}`, 404);
    }
    return list;
}

export function listLists() {
    return Object.keys(data);
}