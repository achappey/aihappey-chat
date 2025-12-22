import { ReactNode, useEffect, useRef } from "react";
import { acquireAccessToken } from "aihappey-auth";
import {
  CreateMessageRequest,
  CreateMessageResult,
  ElicitResult,
  LoggingMessageNotification,
  ProgressNotification,
} from "aihappey-mcp";
import { useAppStore } from "aihappey-state";
import { useSearchParams } from "react-router";
import { useMcpRuntimeBinding } from "./useMcpRuntimeBinding";

// Pending Elicit promise resolvers, not in state
const pendingElicits: Record<string, (r: ElicitResult) => void> = {};


type McpConnectionsProviderProps = {
  children: ReactNode;
  samplingApi: string;
  agentApi: string
  agentScopes: string[]
  clientName?: string;
  clientVersion?: string;
  authenticated?: boolean;
};

/**
 * McpConnectionsProvider - Ensures all selected MCP servers are connected.
 * Place this high in the component tree (e.g. in CoreRoot).
 * Uses zustand store for state and actions.
 */
export const McpConnectionsProvider = ({
  children,
  samplingApi,
  agentApi,
  agentScopes,
  clientVersion,
  authenticated,
  clientName,
}: McpConnectionsProviderProps) => {
  const addProgress = useAppStore((a) => a.addProgress);
//  const addSamplingRequest = useAppStore((a) => a.addSamplingRequest);
//  const addSamplingResponse = useAppStore((a) => a.addSamplingResponse);
 // const customHeaders = useAppStore((a) => a.customHeaders);
  //const connect = useAppStore((a) => a.connect);
  const [searchParams] = useSearchParams();
  useMcpRuntimeBinding({ samplingApi, agentApi, agentScopes, clientVersion, authenticated, clientName });
  // const [, , , refreshToken] = useAccessToken(agentScopes ?? []);
  //searchParams.getAll("mcpServer");
  /*
    useEffect(() => {
      const urls = searchParams.getAll("mcpServer");
      if (!urls.length) return;
  
      // Build name list, add missing servers
      const nameList: string[] = [];
      urls.forEach((url) => {
        // Try to find by url
        const found = Object.entries(servers).find(([, cfg]) => cfg.url === url);
        if (found) {
          nameList.push(found[0]);
        } else {
          // Generate a name (simple, but unique-ish)
          const name =
            "custom-" +
            btoa(url)
              .replace(/[^a-z0-9]/gi, "")
              .toLowerCase();
          addServer(name, { url, type: "http", headers: {} }); // Adjust type/headers as needed
          nameList.push(name);
        }
      });
  
      if (nameList.length) {
        selectServers(nameList);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [servers, searchParams]);
  
    */
  useEffect(() => {
    //const activeServers = selected.map((n) => servers[n]).filter(Boolean);

    /*  const onElicit = (server: string, params: ElicitRequest) => {
        const id = crypto.randomUUID();
        addElicitRequest(id, server, params);
        return new Promise<ElicitResult>((resolve) => {
          pendingElicits[id] = (result: ElicitResult) => {
            addElicitResponse(id, server, result);
            resolve(result);
          };
        });
      };
  */
    const controllers = new Map<string, AbortController>();
    // Only create the callback once per render
   /* const onSample = async (server: string, params: CreateMessageRequest) => {
      const id = crypto.randomUUID();

      addSamplingRequest(id, server, params);
      const accessToken = authenticated ? await acquireAccessToken() : null;
      const res = await fetch(samplingApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...customHeaders,
        },
        body: JSON.stringify(params.params),
      });

      if (!res.ok) {
        throw new Error(`Sampling failed (${res.status})`);
      }

      const json: CreateMessageResult = await res.json();

      // 3. Add response to store
      addSamplingResponse(id, server, json);

      return json;
    };
*/
    const onProgress = async (notif: ProgressNotification) => addProgress(notif);
    /*  const connectServers = async () => {
        await Promise.all(
          connected.map(async (server) => {
            const remote = server.server.remotes?.find(a => a.type == "streamable-http");
  
            let token = undefined;
            if (
              remote?.url &&
              new URL(remote.url).host === new URL(samplingApi).host
            ) {
              token = await acquireAccessToken();
            }
  
            if (
              remote?.url &&
              new URL(remote.url).host === new URL(agentApi).host
            ) {
              token = await acquireAccessToken(agentScopes);
            }
  
            connect(
              clientName ?? "aihappey-web",
              clientVersion ?? "1.0.0",
              remote?.url!,
              {
                headers: server?.server.headers,
                token,
                onSample,
                onElicit,
                onLogging,
                onProgress,
              },
              agentHosts
            )
          }
  
          )
        );
      };
  
      connectServers();*/

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samplingApi]);

  return <>{children}</>;
};
