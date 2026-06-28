import { ReactNode } from "react";
import { useMcpRuntimeBinding } from "./useMcpRuntimeBinding";

type McpConnectionsProviderProps = {
  children: ReactNode;
  samplingApi?: string;
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
  useMcpRuntimeBinding({ samplingApi, agentApi, agentScopes, clientVersion, authenticated, clientName });

  return <>{children}</>;
};
