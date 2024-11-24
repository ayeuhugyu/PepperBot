import oaths from "../database/oaths.js";
import attributes from "../database/attributes.js";
import murmurs from "../database/murmurs.js";
import equipment from "../database/equipment.js";
import fs from "fs";

class DBError {
    constructor(message, code) {
        this.message = message;
        this.error = message;
        this.code = code;
        this.time = new Date();
    }
}

const punctuation = [".", ",", "!", "?", ";", ":", "'", '"', "(", ")", "[", "]", "{", "}", "<", ">", "/", "\\", "|", "`", "~", "@", "#"]
const spaces = [" ", "-", "+"]

export function  normalizeString(string) {
    if (string === undefined) return string;
    return string.toLowerCase().split("").filter(char => !punctuation.includes(char)).map(char => spaces.includes(char) ? "_" : char).join("")
}

export const data = {
    oaths: oaths,
    attributes: attributes,
    murmurs: murmurs,
    equipment: equipment
}

fs.writeFileSync("./testUtils/database.json", JSON.stringify(data, null, 4));

function getNestedProperty(obj, key) {
    const split = key.split('.');
    if (split.length === 1) {
        return obj[key];
    }
    return split.reduce((o, k) => (o && o[k] !== 'undefined') ? o[k] : undefined, obj);
}

export function getItems(listName, key, value) {
    key = normalizeString(key);
    console.log(value)
    const list = data[listName];
    if (!list) {
        return new DBError(`invalid list name: ${listName}`, 404);
    }
    const items = Object.values(list).map(item => {
        if (getNestedProperty(item, key) === value) {
            return item;
        }
    }).filter(item => item !== undefined);
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