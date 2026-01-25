// useOnToolCall.ts
import { useCallback, useMemo } from "react";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { useConversations } from "aihappey-conversations";
import { useFiles } from "aihappey-files";

import { useMcpPassthroughToolCall } from "./useMcpPassthroughToolCall";

import { useMemoryToolCall } from "./useMemoryToolCall";
import { useReadResourceToolCall } from "./useReadResourceToolCall";

import { useLocalFilesRuntime } from "./useLocalFileToolCall";
import { useLocalAgentsRuntime } from "./useLocalAgentsToolCall";
import { useLocalConversationsRuntime } from "./useLocalConversationsToolCall";
import { useLocalCanvasRuntime } from "./useLocalCanvasToolCall";
import { useLocalSettingsRuntime } from "./useLocalSettingsToolCall";
import { useLocalToolsRuntime } from "./useLocalToolsToolCall";
import { useVercelAIToolCall, vercelAIPluginDef } from "./useVercelAIToolCall";
import { useLocalTools } from "aihappey-tools";
import { localStructuredOutputsPluginDef, useLocalStructuredOutputsRuntime } from "./useLocalStructuredOutputsToolCall";
import {
  compileStoredToolExecute,
  compileZodFromStoredTool,
  normalizeToolResult,
  toolErrorResult,
} from "../localStoredTools";

import { usePlugins } from "./usePlugins";

// import *defs* for normal plugins
import { localFilesPluginDef } from "./useLocalFileToolCall";
import { localAgentsPluginDef } from "./useLocalAgentsToolCall";
import { localConversationsPluginDef } from "./useLocalConversationsToolCall";
import { localCanvasPluginDef } from "./useLocalCanvasToolCall";
import { localSettingsPluginDef } from "./useLocalSettingsToolCall";
import { localToolsPluginDef } from "./useLocalToolsToolCall";
import { localStructuredOutputsPluginDef as localStructuredOutputsPluginDefStatic } from "./useLocalStructuredOutputsToolCall";
import { localImagesPluginDef, useLocalImagesRuntime } from "./useLocalImagesToolCall";

export function useOnToolCall({
  callTool,
  api,
  getAccessToken,
  headers,
  customFetch,
}: {
  api: string;
  getAccessToken?: any;
  headers?: any;
  customFetch?: any;
  callTool: (
    toolCallId: string,
    toolName: string,
    input: any,
    locale?: string,
    signal?: AbortSignal
  ) => Promise<any>;
}) {
  const enableApps = useAppStore(a => a.enableApps);
  const mcpServerContent = useAppStore(a => a.mcpServerContent);
  const mcpServers = useAppStore(a => a.mcpServers);
  const enabledPlugins = useAppStore(a => a.activePlugins); // string list
  const enabledLocalTools = useAppStore(a => (a as any).enabledLocalTools as string[]);

  const conversations = useConversations();
  const files = useFiles();
  const { i18n } = useTranslation();

  const localToolsStore = useLocalTools();

  // runtimes
  const localFilesRuntime = useLocalFilesRuntime(files);
  const localAgentsRuntime = useLocalAgentsRuntime();
  const localConversationsRuntime = useLocalConversationsRuntime(conversations);
  const localCanvasRuntime = useLocalCanvasRuntime(files);
  const localSettingsRuntime = useLocalSettingsRuntime();
  const localToolsRuntime = useLocalToolsRuntime();
  const localStructuredOutputsRuntime = useLocalStructuredOutputsRuntime(api, getAccessToken, headers);
  const localImagesRuntime = useLocalImagesRuntime(files);
  const vercelAIRuntime = useVercelAIToolCall(api, getAccessToken, headers, customFetch);

  // specials (runtime-only or conditional exposure)
  const { memoryPlugin } = useMemoryToolCall(); // runtime only
  const { readResourcePlugin } = useReadResourceToolCall({ mcpServers }); // runtime exists always

  const runtimes = useMemo(
    () => ({
      [localFilesRuntime.name]: localFilesRuntime,
      [localAgentsRuntime.name]: localAgentsRuntime,
      [localConversationsRuntime.name]: localConversationsRuntime,
      [localCanvasRuntime.name]: localCanvasRuntime,
      [localSettingsRuntime.name]: localSettingsRuntime,
      [localToolsRuntime.name]: localToolsRuntime,
      [localStructuredOutputsRuntime.name]: localStructuredOutputsRuntime,
      [vercelAIRuntime.name]: vercelAIRuntime,
      [localImagesRuntime.name]: localImagesRuntime,
    }),
    [
      localFilesRuntime,
      localAgentsRuntime,
      localConversationsRuntime,
      localCanvasRuntime,
      localSettingsRuntime,
      localToolsRuntime,
      localImagesRuntime,
      vercelAIRuntime,
      localStructuredOutputsRuntime,
    ]
  );

  const defsAll = useMemo(
    () => [
      localFilesPluginDef,
      localAgentsPluginDef,
      localConversationsPluginDef,
      localImagesPluginDef,
      localCanvasPluginDef,
      localSettingsPluginDef,
      localStructuredOutputsPluginDefStatic,
      localToolsPluginDef,
      vercelAIPluginDef,
    ],
    []
  );

  const specialRuntimes = useMemo(
    () => ({
      // memory: runtime only, no tools
      [memoryPlugin.name]: memoryPlugin,
      // read-resource: runtime exists, tools injected elsewhere conditionally
      [readResourcePlugin.name]: readResourcePlugin,
    }),
    [memoryPlugin, readResourcePlugin]
  );

  const { plugins } = usePlugins(enabledPlugins, defsAll, runtimes, specialRuntimes);

  const { handleMcpPassthroughToolCall } = useMcpPassthroughToolCall({
    callTool,
    enableApps,
    mcpServerContent,
    locale: i18n.language,
  });

  const onToolCall = useCallback(
    async ({ toolCall, signal }: any) => {
      try {
        // 0) user-defined stored local tools (enabled by user)
        const enabled = Array.isArray(enabledLocalTools) ? enabledLocalTools : [];
        if (enabled.includes(toolCall.toolName)) {
          const stored = (localToolsStore.items ?? []).find(t => t.id === toolCall.toolName);
          if (!stored) throw new Error(`Local tool not found: ${toolCall.toolName}`);

          // validate input
          const schema = compileZodFromStoredTool(stored);
          const parsed = schema.parse(toolCall.input ?? {});

          // execute
          const fn = compileStoredToolExecute(stored);
          const output = await fn(parsed);
          return normalizeToolResult(output);
        }

        // 1) normal enabled plugins
        const p = plugins.find(x => x.match(toolCall.toolName));
        if (p) return await p.handle(toolCall, signal);

        // 2) specials that are NOT gated by enabledPlugins
        // memory + read_resource
        for (const key of Object.keys(specialRuntimes)) {
          const sp = specialRuntimes[key as any];
          // both specials already have match() in their plugin objects, so easiest:
        }

        if (toolCall.toolName === "memory") {
          return await memoryPlugin.handle(toolCall, signal);
        }
        if (toolCall.toolName === "read_resource") {
          return await readResourcePlugin.handle(toolCall, signal);
        }

        // 3) fallback
        return await handleMcpPassthroughToolCall(toolCall, signal);
      } catch (e) {
        return toolErrorResult(e);
      }
    },
    [
      enabledLocalTools,
      localToolsStore.items,
      plugins,
      specialRuntimes,
      memoryPlugin,
      readResourcePlugin,
      handleMcpPassthroughToolCall,
    ]
  );

  return { onToolCall };
}
