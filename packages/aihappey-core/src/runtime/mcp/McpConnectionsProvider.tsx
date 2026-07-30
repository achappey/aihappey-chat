import { ReactNode } from "react";
import { useMcpRuntimeBinding } from "./useMcpRuntimeBinding";

type McpConnectionsProviderProps = {
  children: ReactNode;
  inferenceApi?: string
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
  inferenceApi,
  children,
  agentApi,
  agentScopes,
  clientVersion,
  authenticated,
  clientName,
}: McpConnectionsProviderProps) => {
  useMcpRuntimeBinding({ inferenceApi, agentApi, agentScopes, clientVersion, authenticated, clientName });

  return <>{children}</>;
};
