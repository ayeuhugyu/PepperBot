// you can for sure do some super magical type gymnastics to make this work
// something like interpolating the string and then finding what it is
// but for now, we will just hard code it and nothing will happen

export async function getGuilds(): Promise<number> {
    const jsonData = await fetch("http://localhost:49999/fetchClientValues", {
        method: "POST", // robtop reference
        body: JSON.stringify({ property: "guilds.cache.size" }),
        headers: { "Content-Type": "application/json" }
    })
        .then(res => res.json())
        .then(json => json.data) as number[]; // lord god, i come to you a sinner

    return jsonData.reduce((prev, val) => prev + val, 0);
}

export async function getUsers(): Promise<number> {
    const jsonData = await fetch("http://localhost:49999/fetchClientValues", {
        method: "POST", // robtop reference
        body: JSON.stringify({ property: "users.cache.size" }),
        headers: { "Content-Type": "application/json" }
    })
        .then(res => res.json())
        .then(json => json.data) as number[]; // lord god, i come to you a sinner

    return jsonData.reduce((prev, val) => prev + val, 0)
}