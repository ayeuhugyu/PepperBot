import { get } from "node:http"

let uservars = {}

function setUserVariable(userId, key, value) {
    if (!uservars[userId]) {
        uservars[userId] = {}
    }
    uservars[userId][key] = value
}

function getUserVariable(userId, key) {
    if (!uservars[userId]) {
        return null
    }
    return uservars[userId][key]
}

function deleteUserVariable(userId, key) {
    if (!uservars[userId]) {
        return
    }
    delete uservars[userId][key]
}

function deleteUsersVariables(userId) {
    delete uservars[userId]
}

function getUsersVariables(userId) {
    return uservars[userId]
}

function setUsersVariables(userId, variables) {
    uservars[userId] = variables
}

export default {
    uservars: uservars,
    set: setUserVariable,
    get: getUserVariable,
    delete: deleteUserVariable,
    deleteAll: deleteUsersVariables,
    getAll: getUsersVariables,
    setAll: setUsersVariables
}