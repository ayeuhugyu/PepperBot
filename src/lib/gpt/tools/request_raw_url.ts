import z from "zod";
import { Tool, ToolErrorResponse, ToolSuccessResponse } from "../toolTypes";
import UserAgent from "user-agents";

let local_ips = ["192.168", "172.16", "10", "localhost"];
for (let i = 17; i <= 31; i++) {
    local_ips.push(`172.${i}`);
}

const parameters = {
    "url": {
        key: "url",
        description: "URL to fetch. do not input local addresses. ips are fine, just not local ones.",
        schema: z.string(),
    },
    "method": {
        key: "method",
        description: "HTTP method to use (GET, POST, PUT, DELETE, etc.).",
        schema: z.enum(["GET", "HEAD", "OPTIONS", "TRACE", "PUT", "DELETE", "POST", "PATCH", "CONNECT"]).default("GET")
    },
    "headers": {
        key: "headers",
        description: "headers to include in the request",
        schema: z.record(z.string(), z.string())
    },
    "body": {
        key: "body",
        description: "body of the request, for methods like POST or PUT.",
        schema: z.string(),
    }
}

type RawResponse = {
    status: string,
    headers: Record<string, string>,
    body: string
};

export default new Tool<typeof parameters, RawResponse>({
    name: "request_raw_url",
    description: "fetches a URL and returns the main content as markdown. does not support local addresses for security reasons. DO NOT ATTEMPT TO ACCESS IMAGES WITH THIS TOOL. IMAGES WILL BE PROVIDED TO YOU, YOU SHOULD NOT HAVE TO USE THIS TOOL TO GET IMAGES.",
    parameters,
    execute: async function({ url, method, headers, body }) {
        for (let ipStart of local_ips) {
            if (url.replace(/^https?:\/\//, '').startsWith(ipStart)) {
                return new ToolErrorResponse(`refused attempt to access private ip`);
            }
        }
        const options: RequestInit = {
            method,
            headers: {
                'User-Agent': new UserAgent().toString(),
                ...headers,
            },
            body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
        };
        try {
            const response = await fetch(url, options);
            const responseBody = await response.text();
            return new ToolSuccessResponse<RawResponse>({
                status: response.status + " " + response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: responseBody,
            });
        } catch (err: any) {
            return new ToolErrorResponse(`an error occurred while attempting to fetch the URL: ${err.message}`);
        }
    }
});