import { parsePluginArchive } from "aihappey-plugins";
import type { AgentPluginFile } from "aihappey-types";
import { blobToBase64 } from "../chat/files/file";

function base64ToBlob(data: string, mediaType = "application/zip") {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mediaType });
}

export function getEmbeddedAgentPluginPayload(plugin?: AgentPluginFile) {
  return plugin?.type === "base64" ? String(plugin.data ?? "") : "";
}

export async function readEmbeddedAgentPluginName(plugin?: AgentPluginFile) {
  const payload = getEmbeddedAgentPluginPayload(plugin);
  if (!payload || plugin?.media_type !== "application/zip") return undefined;

  try {
    const result = await parsePluginArchive(base64ToBlob(payload, plugin.media_type));
    return result.imported.length === 1 ? result.imported[0].manifest.name : undefined;
  } catch {
    return undefined;
  }
}

export async function createEmbeddedAgentPlugin(archive: Blob): Promise<AgentPluginFile> {
  return {
    type: "base64",
    media_type: "application/zip",
    data: await blobToBase64(archive),
  };
}
