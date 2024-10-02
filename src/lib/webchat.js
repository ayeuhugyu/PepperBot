import fs from "fs"
import fsextra from "fs-extra"
import * as log from "./log.js"
import { Buffer } from "buffer"
import exp from "constants"
import { EventEmitter } from "events"
import process from "process"

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

export class WebSpoofMessage {
    constructor(text, authorID) {
        this.id = generateMessageID()
        this.author = getUser(authorID)
        this.author.globalName = this.author.username
        this.author.displayName = this.author.username
        this.reply = (message) => {
            let replyMessage;
            if (message.content) {
                replyMessage = message.content;
            } else {
                replyMessage = message.embeds[0].description;
            } 
            if ((!replyMessage || typeof replyMessage !== "string") && typeof message === "string") {
                replyMessage = message;
            }
            if (!typeof replyMessage == String) {
                console.log(replyMessage)
                replyMessage = "error getting message content; replyMessage has been logged.";
            }
            if (!replyMessage) {
                replyMessage = "error getting message content; replyMessage was undefined";
            }
            fetch(`http://127.0.0.1:53134/api/chat/message?text=${replyMessage}&author=6f3a9020ea31502b6c6b40ed480fe70a`, { method: "POST" }).then(response => response.text());
            return new Promise((resolve) => {
                resolve({ id: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                }), content: replyMessage, author: { id: "1209297323029565470", username: "PepperBot" }, timestamp: Date.now(), edit: (message) => {
                    let replyMessage;
                    if (message.content) {
                        replyMessage = message.content;
                    } else {
                        replyMessage = message.embeds[0].description;
                    } 
                    if ((!replyMessage || typeof replyMessage !== "string") && typeof message === "string") {
                        replyMessage = message;
                    }
                    if (!typeof replyMessage == String) {
                        console.log(replyMessage)
                        replyMessage = "error getting message content; replyMessage has been logged.";
                    }
                    if (!replyMessage) {
                        replyMessage = "error getting message content; replyMessage was undefined";
                    }
                    fetch(`http://127.0.0.1:53134/api/chat/message?text=${replyMessage}&author=6f3a9020ea31502b6c6b40ed480fe70a`, { method: "POST" }).then(response => response.text());
                    return new Promise((resolve) => {
                        resolve({ id: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
                        }), content: replyMessage, author: { id: "1209297323029565470", username: "PepperBot" }, timestamp: Date.now() })
                    })
                } })
            })
        }
        this.author.send = this.reply
        this.author.discriminator = "0"
        this.edit = this.reply
        this.delete = () => {}
        this.timestamp = Date.now()
        this.content = text
        this.cleanContent = text
        this.mentions = new Map();
        const mentionPattern = /<@!?(\d+)>/g;
        let match;
        while ((match = mentionPattern.exec(text)) !== null) {
            const userID = match[1];
            this.mentions.set(userID, getUser(userID));
        }
        this.reference = {}
        this.react = (emoji) => {}
        this.guild = {
            id: "0",
            name: "webchat",
            members: new Map(),
            channels: new Map(),
            roles: new Map(),
            ownerID: "0",
        }
        this.reply = this.reply.toString()
        this.react = this.react.toString()
        this.delete = this.delete.toString()
        this.edit = this.reply
    }
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
    constructor(id, username, {bot = false, system = false, error = false}, displayName) {
        this.username = username || id
        this.id = id
        this.bot = bot
        this.system = system
        this.error = error
        this.createdAt = Date.now()
    }
}

export function registerUser(username, id = generateUID(), {bot = false, system = false, error = false}, displayName = username) {
    let author = new Author(id, username, {bot: bot, system: system, error: error}, displayName)
    users[author.id] = author
    log.info(`registered user ${author.username}`)
    writeUsers()
    return author.id
}

export function getUser(id) {
    return users[id]
}

export function getUserByName(username) {
    return Object.values(users).find(user => user.username == username)
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