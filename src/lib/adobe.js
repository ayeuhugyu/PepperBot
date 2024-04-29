import { config } from "dotenv";
config();

async function searchFor({ search }) {
    const headers = {
        "x-api-key": process.env.ADOBE_AI_KEY,
        "x-product": "myTestApp1.0",
    };
    console.log(headers);
    return await fetch(
        `https://stock.adobe.io/Rest/Media/1/Search/Files?locale=en_US&search_parameters[words]=${search}`,
        { headers: headers }
    );
}

console.log(await searchFor({ search: "emoji" }));
