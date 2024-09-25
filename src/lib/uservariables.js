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

function getUserVariables(userId) {
    return uservars[userId]
}

export default {
    uservars: uservars,
    setUserVariable: setUserVariable,
    getUserVariable: getUserVariable,
    deleteUserVariable: deleteUserVariable,
    deleteUsersVariables: deleteUsersVariables,
    getUserVariables: getUserVariables
}