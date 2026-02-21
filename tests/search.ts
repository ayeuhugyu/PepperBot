import * as cheerio from "cheerio";
import * as log from "../src/lib/log";

const query = "test query";

const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=us-en&kp=-1`); // kl: language; kp: safe search - moderate

const body = await response.text();
if (!response.ok) {
    log.debug(`search tool response was not OK: ${response.status} ${response.statusText} // ${body}`)
    throw new Error(`response was not OK: ${response.status} ${response.statusText}`)
}

interface SearchResult {
    title: string,
    url: string,
    snippet: string,
}

interface SearchResponse {
    query: string,
    messages: Record<string, string>,
    results: SearchResult[],
}

const $ = cheerio.load(body);
$(".module").parent().parent().parent().remove();
$(".react-results--sidebar").remove();
$("#header_wrapper").remove();
$("[data-testid='web-vertical']").remove();
$(".header").remove();
$(".zci-wrapper").remove();
$(".nav-link").remove();
$(".feedback-btn").remove();
$(".clear").remove();
$("form").remove();
$("img").remove();
$("head").remove();
const fullResponse: SearchResponse = {
    query,
    messages: {},
    results: [],
}
const messageElements = $(".msg").children();
messageElements.each((_, element) => {
    const $el = $(element)
    fullResponse.messages[$el.attr("id")?.replaceAll("_", " ") ?? "unknown message type"] = $el.text().replaceAll(/ +/g, " ").trim()
});

const resultElements = $("#links").children()
resultElements.each((_, element) => {
    const $el = $(element);
    if (!$el.hasClass("result")) return;
    const titleEl = $el.find("h2.result__title").first().find("a");
    const snippet = $el.find("a.result__snippet").first().text();
    const title = titleEl.text();
    const urlRaw = titleEl.attr("href");
    const urlParsed = new URL(`https:${urlRaw}`);
    const url = decodeURIComponent(urlParsed.searchParams.get("uddg") ?? "");

    fullResponse.results.push({
        title,
        url: url ?? "unknown url; url extraction failed",
        snippet
    });
});

console.log(fullResponse);