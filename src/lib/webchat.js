import fs from "fs"
import fsextra from "fs-extra"
import * as log from "./log.js"
import { Buffer } from "buffer"
import exp from "constants"

if (!fs.existsSync("resources/data/webmessages.json")) {
    fsextra.ensureFileSync("resources/data/webmessages.json")
    fs.writeFileSync("resources/data/webmessages.json", "{}")
    log.info("created missing webmessages.json")
}
if (!fs.existsSync("resources/data/webusers.json")) {
    fsextra.ensureFileSync("resources/data/webusers.json")
    fs.writeFileSync("resources/data/webusers.json", "{}")
    log.info("created missing webusers.json")
}

const messages = JSON.parse(fs.readFileSync("resources/data/webmessages.json"))
const users = JSON.parse(fs.readFileSync("resources/data/webusers.json"))
const words = JSON.parse(fs.readFileSync("resources/data/the_english_lexicon.json"))

export function writeMessages() {
    fs.writeFileSync("resources/data/webmessages.json", JSON.stringify(messages, null, 4))
}

export function writeUsers() {
    fs.writeFileSync("resources/data/webusers.json", JSON.stringify(users, null, 4))
}

export function generateUID() {
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function generateMessageID() {
    const word1 = words[Math.floor(Math.random() * words.length)]
    const word2 = words[Math.floor(Math.random() * words.length)]
    const word3 = words[Math.floor(Math.random() * words.length)]
    const word4 = words[Math.floor(Math.random() * words.length)]
    const word5 = words[Math.floor(Math.random() * words.length)]

    return Buffer.from(`${word1}-${word2}-${word3}-${word4}-${word5}`).toString("base64")
}

export class Message {
    constructor(text, authorID) {
        this.id = generateMessageID()
        this.text = text
        this.author = getUser(authorID)
        this.timestamp = Date.now()
    }
}

export class Author {
    constructor(id, username) {
        this.username = username || id
        this.id = id
    }
}

export function registerUser(username) {
    let author = new Author(generateUID(), username)
    users[author.id] = author
    log.info(`registered user ${author.id}`)
    writeUsers()
    return author.id
}

export function getUser(id) {
    return users[id]
}

export function postMessage(text, authorID) {
    let message = new Message(text, authorID)
    messages[message.id] = message
    log.info(`posted message ${message.id}`)
    writeMessages()
    return message.id
}

export function getMessage(id) {
    return messages[id]
}

export function getMessagesAbove(id, distance = 10) {
    let messageids = Object.keys(messages)
    let index = messageids.indexOf(id)
    if (index == -1) return []
    return messageids.slice(index - distance, index).map(id => messages[id])
}

export function getLatestMessages(count = 10) {
    let messageids = Object.keys(messages)
    return messageids.slice(-count).map(id => messages[id])
}