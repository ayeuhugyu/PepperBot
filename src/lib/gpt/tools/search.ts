import z from "zod";
import { Tool, ToolErrorResponse, ToolSuccessResponse } from "../toolTypes";
import * as cheerio from "cheerio";

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

const parameters = {
    "query": {
        key: "query",
        description: "query to search for",
        schema: z.string(),
    },
}

export default new Tool<typeof parameters, SearchResponse>({
    name: "search",
    description: "searches duckduckgo for a query and returns the results. snippets will never be enough to provide accurate information, so always use this in conjunction with request_url to provide further information. do not simply link users to the results, actually follow them. importantly, you can use duckduckgo\'s special search terms, like filtering by specific sites or by specific text. you\'ll figure it out. also please avoid doxxing me k thnx bye",
    parameters,
    execute: async function({ query }) {
        const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=us-en&kp=-1`); // kl: language; kp: safe search - moderate

        const body = await response.text();
        if (!response.ok) {
            return new ToolErrorResponse(`response was not OK: ${response.status} ${response.statusText}`)
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

        return new ToolSuccessResponse<SearchResponse>(fullResponse);
    }
});