import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
    CreateMessageRequestSchema, ElicitRequestSchema, LoggingMessageNotificationSchema,
    ProgressNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";

import type {
    CreateMessageRequest, CreateMessageResult,
    ElicitRequest, ElicitResult,
    LoggingMessageNotification,
    ProgressNotification,
    CreateMessageResultWithTools
} from "@modelcontextprotocol/sdk/types.js";
import { getMcpAccessToken, initiateMcpOAuthFlow, clearMcpAccessToken } from "aihappey-auth";
import z from "zod";

export type SamplingCallback = (
    params: z.infer<any>["params"],
    accessToken: string
) => Promise<z.infer<any>>;

// --- Internal utility: not exported ---
const toMcpClientName = (input: string): string => {
    return input.toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const isTokenExpired = (token: string, skewSeconds = 60): boolean => {
    try {
        const [, payload] = token.split(".");
        if (!payload) return false;
        const { exp } = JSON.parse(atob(payload));
        if (typeof exp !== "number") return false;
        return exp * 1000 <= Date.now() + skewSeconds * 1000;
    } catch { return false; }
}

function needsOAuth(err: any): boolean {
    if (!err) return false;
    if (err.toString().includes("HTTP 401") || err.toString().includes("Non-200 status code (401)")) return true;
    if (err.status === 401) return true;
    if (err.code === 401) return true;
    if (typeof err === "object" && (err.error === "oauth_required" || err.code === "oauth_required")) return true;
    if (err.headers && typeof err.headers.get === "function") {
        const www = err.headers.get("WWW-Authenticate");
        if (www && www.includes("Bearer")) return true;
    }
    return false;
}

// --- Internal: core connect function ---
async function _connectMcpBase(
    url: string,
    opts: {
        token?: string;
        headers?: Record<string, string>;
        clientName?: string;
        clientVersion?: string;
        logLevel?: any;
        onSample?: (server: string, req: CreateMessageRequest) => Promise<CreateMessageResult | CreateMessageResultWithTools>;
        onElicit?: (server: string, req: ElicitRequest) => Promise<ElicitResult>;
        onLogging?: (server: string, req: LoggingMessageNotification) => Promise<void>;
        onProgress?: (req: ProgressNotification) => Promise<void>;
        handleOAuth?: boolean;
    } = {}
): Promise<Client> {
    const headers: Record<string, string> = { ...opts.headers };
    let token: string | null = opts.token || getMcpAccessToken(url);

    if (token && isTokenExpired(token)) {
        clearMcpAccessToken(url);
        token = null;
    }
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const client = new Client({
        name: toMcpClientName(opts.clientName || "test-client"),
        version: opts.clientVersion || "0.0.1",
    }, {
        capabilities: {
            sampling: opts.onSample ? {} : undefined,
            elicitation: opts.onElicit ? {} : undefined,
        }
    });

    if (opts.onSample)
        client.setRequestHandler(CreateMessageRequestSchema,
            req => opts.onSample!(url, req));

    if (opts.onElicit)
        client.setRequestHandler(ElicitRequestSchema,
            req => opts.onElicit!(url, req));

    if (opts.onLogging)
        client.setNotificationHandler(LoggingMessageNotificationSchema,
            ({ params }) => opts.onLogging!(url, params as any));

    if (opts.onProgress)
        client.setNotificationHandler(ProgressNotificationSchema,
            ({ params }) => opts.onProgress!(params as any));

    const transport = new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers } });

    try {
        await client.connect(transport);
    } catch (err: any) {
        if (opts.handleOAuth && needsOAuth(err)) {
            await initiateMcpOAuthFlow(url);
            throw new Error("Redirecting for OAuth");
        }
        throw err;
    }

    if (opts.logLevel) await client.setLoggingLevel(opts.logLevel);
    // client.close();
    return client;
}

// --- Public: minimal (just returns connected client) ---
export async function connectSimple(
    url: string,
    opts?: {
        token?: string;
        headers?: Record<string, string>;
        onSample?: (server: string, req: CreateMessageRequest) => Promise<CreateMessageResult>;
        clientName?: string;
        clientVersion?: string;
    }
): Promise<Client> {
    return _connectMcpBase(url, opts ?? {});
}

// --- Public: full-featured (returns client and server info) ---
export async function connectMcpServer(
    url: string,
    opts?: {
        token?: string;
        headers?: Record<string, string>;
        clientName?: string;
        clientVersion?: string;
        logLevel?: any;
        onSample?: (server: string, req: CreateMessageRequest) => Promise<CreateMessageResult>;
        onElicit?: (server: string, req: ElicitRequest) => Promise<ElicitResult>;
        onLogging?: (server: string, req: LoggingMessageNotification) => Promise<void>;
        onProgress?: (req: ProgressNotification) => Promise<void>;
        handleOAuth?: boolean;
        onDisconnect?: (url: string) => Promise<void>;
    }
): Promise<{
    client: Client;
}> {
    const client = await _connectMcpBase(url, opts ?? {});
    // if (opts?.logLevel) await client.setLoggingLevel(opts?.logLevel)

    /* client.onerror = (item) => {
         console.log(item)
         if (item.message.indexOf("SSE stream disconnected") > -1 && opts?.onDisconnect) {
             opts.onDisconnect(url)
         }
     }*/

    return {
        client,
        
    };
}