import { useCallback } from "react";
import { useAppStore } from "aihappey-state";
import type { Tool } from "@modelcontextprotocol/sdk/types";

/* ============================================================
   Result helpers
============================================================ */

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

const ok = (text: string): ToolTextResult => ({
  isError: false,
  content: [{ type: "text", text }],
});

const fail = (err: unknown): ToolTextResult => ({
  isError: true,
  content: [
    {
      type: "text",
      text: err instanceof Error ? err.message : String(err),
    },
  ],
});

/* ============================================================
   Tool definitions (STATIC)
============================================================ */

export const localSettingsGetTool: Tool = {
  name: "local_settings_get",
  title: "Get local settings",
  description:
    "Returns all local user settings such as enableUserLocation and MCP timeout settings.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localSettingsSetTool: Tool = {
  name: "local_settings_set",
  title: "Update local settings",
  description:
    "Updates local user settings such as enableUserLocation and MCP timeout configuration.",
  inputSchema: {
    type: "object",
    properties: {
      enableUserLocation: {
        type: "boolean",
        description: "Enable or disable access to the user's location.",
      },
      temperature: {
        type: "number",
        description: "AI temperature.",
      },
      throttle: {
        type: "number",
        description: "Custom throttle wait in ms for the chat messages and data updates.",
      },
      mcpToolTimeout: {
        type: "number",
        description: "Timeout (in milliseconds) applied to all MCP tool calls.",
      },
      mcpResetTimeoutOnProgress: {
        type: "boolean",
        description: "Whether the MCP tool timeout resets when progress events arrive.",
      },
    },
    required: [],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};

/* ============================================================
   Plugin DEFINITION (STATIC)
============================================================ */

export const localSettingsPluginDef = {
  name: "local-settings",
  match: (toolName: string) => toolName.startsWith("local_settings_"),
  tools: [localSettingsGetTool, localSettingsSetTool],
};

/* ============================================================
   Runtime types
============================================================ */

type LocalSettingsToolName = "local_settings_get" | "local_settings_set";

type LocalSettingsToolCall = {
  toolName: LocalSettingsToolName;
  input?: any;
};

/* ============================================================
   Plugin RUNTIME (execution only)
============================================================ */

export function useLocalSettingsRuntime() {
  const enableUserLocation = useAppStore(a => a.enableUserLocation);
  const setEnableUserLocation = useAppStore(a => a.setEnableUserLocation);

  const experimentalThrottle = useAppStore(a => a.experimentalThrottle);
  const setThrottle = useAppStore(a => a.setThrottle);

  const temperature = useAppStore(a => a.temperature);
  const setTemperature = useAppStore(a => (a as any).setTemperature);

  const toolTimeout = useAppStore(a => a.toolTimeout);
  const resetTimeoutOnProgress = useAppStore(a => a.resetTimeoutOnProgress);
  const setMcpTimeout = useAppStore(a => a.setMcpTimeout);

  const handle = useCallback(
    async (toolCall: LocalSettingsToolCall): Promise<ToolTextResult> => {
      try {
        switch (toolCall.toolName) {
          case "local_settings_get":
            return ok(
              JSON.stringify({
                chatApp: {
                  enableUserLocation,
                  throttleInMs: experimentalThrottle,
                },
                ai: {
                  temperature,
                },
                mcp: {
                  toolTimeoutInMs: toolTimeout,
                  resetTimeoutOnProgress,
                },
              })
            );

          case "local_settings_set": {
            const input = toolCall.input ?? {};

            if (typeof input.enableUserLocation === "boolean") {
              setEnableUserLocation(input.enableUserLocation);
            }

            if (input.throttle !== undefined) {
              setThrottle(input.throttle);
            }

            if (input.temperature !== undefined) {
              if (typeof setTemperature !== "function") {
                throw new Error(
                  "setTemperature missing in store (expected a.setTemperature)."
                );
              }
              setTemperature(input.temperature);
            }

            if (input.mcpToolTimeout !== undefined) {
              setMcpTimeout(
                input.mcpToolTimeout,
                input.mcpResetTimeoutOnProgress ?? resetTimeoutOnProgress
              );
            } else if (input.mcpResetTimeoutOnProgress !== undefined) {
              setMcpTimeout(toolTimeout, input.mcpResetTimeoutOnProgress);
            }

            return ok("Settings updated");
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [
      enableUserLocation,
      experimentalThrottle,
      temperature,
      toolTimeout,
      resetTimeoutOnProgress,
      setEnableUserLocation,
      setThrottle,
      setTemperature,
      setMcpTimeout,
    ]
  );

  return {
    name: localSettingsPluginDef.name,
    handle,
  };
}
