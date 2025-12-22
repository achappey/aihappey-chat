import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export async function connectionTest(
  url: string,
  type: "http" | "sse" = "http",
  opts?: {
    token?: string;
    headers?: Record<string, string>;
    clientName?: string;
    clientVersion?: string;
  }
): Promise<{
  status: "ok" | "unauthorized" | "error",
  name?: string
}> {
  // Use whatever header logic you want
  const headers: Record<string, string> = { ...opts?.headers };
  if (opts?.token) headers["Authorization"] = `Bearer ${opts.token}`;

  const client = new Client({
    name: opts?.clientName || "test-client",
    version: opts?.clientVersion || "0.0.1",
    //headers,
  });

  const baseUrl = new URL(url);
  const transport =
    type === "http"
      ? new StreamableHTTPClientTransport(baseUrl, { requestInit: { headers } })
      : new SSEClientTransport(baseUrl, { requestInit: { headers } });

  try {
    await client.connect(transport);
    const capabilities = client.getServerVersion();
    // If connect succeeds, we call it OK.
    return {
      status: "ok",
      name: capabilities?.name
    };
  } catch (err: any) {
    // Typical 401/403 = Unauthorized = valid MCP server
    if (
      err?.status === 401 ||
      err?.status === 403 ||
      err?.message?.toString().includes("401") ||
      err?.toString().includes("401") ||
      (typeof err === "object" &&
        (err.error === "oauth_required" || err.code === "oauth_required"))
    ) {
      return {
        status: "unauthorized"
      };
    }
    // All other errors: treat as "error"
    return {
      status: "error"
    };

  }
  finally {
    await client.close();

  }
}
