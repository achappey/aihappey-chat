import { useMemo } from "react"
import { useAppStore } from "aihappey-state"
import {
  Agent,
  McpRegistryServerResponse,
  McpServer
} from "aihappey-types"

type AgentsWithMcpServers = {
  agent: Agent
  mcpServers: {
    key: string
    server: McpServer
    registry?: McpRegistryServerResponse
  }[]
}

export function useAgents(): AgentsWithMcpServers[] {
  const agents = useAppStore(s => s.agents)
  const registries = useAppStore(s => s.mcpRegistries)

  return useMemo(() => {
    // 1️⃣ Build registry index by server.name (lowercase)
    const registryIndex: Record<string, McpRegistryServerResponse> = {}

    Object.values(registries).forEach(registryServers => {
      registryServers.forEach(r => {
        registryIndex[r.server.name.toLowerCase()] = r
      })
    })

    // 2️⃣ Map agents → per-agent MCP server list
    return agents.map(agent => {
      const mcpServers =
        agent.mcpServers
          ? Object.entries(agent.mcpServers).map(([key, server]) => ({
              key,
              server,
              registry: registryIndex[key.toLowerCase()]
            }))
          : []

      return {
        agent,
        mcpServers
      }
    })
  }, [agents, registries])
}


export type AgentWithMcpServers = {
  agent: Agent
  mcpServers: {
    key: string
    server: McpServer
    registry?: McpRegistryServerResponse
  }[]
}

export function useAgent(agent: Agent): AgentWithMcpServers {
  const registries = useAppStore(s => s.mcpRegistries)

  return useMemo(() => {
    // build registry index once
    const registryIndex: Record<string, McpRegistryServerResponse> = {}

    Object.values(registries).forEach(registryServers => {
      registryServers.forEach(r => {
        registryIndex[r.server.name.toLowerCase()] = r
      })
    })

    const mcpServers =
      agent.mcpServers
        ? Object.entries(agent.mcpServers).map(([key, server]) => ({
            key,
            server,
            registry: registryIndex[key.toLowerCase()]
          }))
        : []

    return {
      agent,
      mcpServers
    }
  }, [agent, registries])
}
