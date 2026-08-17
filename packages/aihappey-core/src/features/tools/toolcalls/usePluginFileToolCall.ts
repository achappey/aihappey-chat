import { useCallback } from "react";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types";
import {
  getRuntimePluginFile,
  type RuntimePlugin,
} from "aihappey-plugins";
import { getStoredSkillFileMimeType, isTextSkillFile } from "aihappey-skills";
import { blobToBase64 } from "../../chat/files/file";
import type { ToolPlugin } from "./usePlugins";

export const readPluginFileTool: Tool = {
  name: "read_plugin_file",
  title: "Read a plugin package file",
  description: "Reads a file outside the skills directories of an enabled Agent Plugin. Provide the exact plugin name and package-relative path shown in system context.",
  inputSchema: {
    type: "object",
    properties: {
      plugin_name: { type: "string", description: "Exact enabled plugin name." },
      path: { type: "string", description: "Package-relative file path outside skills/." },
    },
    required: ["plugin_name", "path"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

const escapeAttribute = (value: string) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

export function usePluginFileToolCall(plugins: RuntimePlugin[]) {
  const handle = useCallback(async (toolCall: any): Promise<CallToolResult> => {
    const pluginName = String(toolCall.input?.plugin_name ?? "").trim();
    const plugin = plugins.find((item) => item.name === pluginName || item.id === pluginName);
    if (!plugin) throw new Error(`Plugin \"${pluginName}\" is not enabled.`);

    const file = getRuntimePluginFile(plugin, toolCall.input?.path ?? "");
    if (!file) throw new Error(`File \"${toolCall.input?.path ?? ""}\" was not found in plugin \"${plugin.name}\".`);
    const mimeType = getStoredSkillFileMimeType(file);

    if (isTextSkillFile(file)) {
      const text = await file.data.text();
      return {
        isError: false,
        structuredContent: { pluginFile: { pluginName: plugin.name, path: file.path, mimeType, text } },
        content: [{
          type: "text",
          text: `<plugin_file plugin_name="${escapeAttribute(plugin.name)}" path="${escapeAttribute(file.path)}" mimeType="${escapeAttribute(mimeType)}">\n${text}\n</plugin_file>`,
        }],
      };
    }

    return {
      isError: false,
      structuredContent: { pluginFile: { pluginName: plugin.name, path: file.path, mimeType, encoding: "base64" } },
      content: [
        { type: "text", text: `Binary plugin file ${file.path} from ${plugin.name}. mimeType=${mimeType}.` },
        {
          type: "resource",
          resource: {
            uri: `plugin://${encodeURIComponent(plugin.name)}/${file.path.split("/").map(encodeURIComponent).join("/")}`,
            mimeType,
            blob: await blobToBase64(file.data),
          },
        },
      ],
    };
  }, [plugins]);

  const plugin: ToolPlugin = {
    name: "read-plugin-file",
    match: (toolName) => toolName === readPluginFileTool.name,
    handle,
  };
  return plugin;
}
