export const AGENT_PLUGIN_VERSION = "1.0.0" as const;
export const PLUGIN_SCHEMA_URL = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json" as const;
export const PLUGIN_MCP_SCHEMA_URL = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json" as const;

export const PLUGIN_MANIFEST_FIELDS = new Set([
  "$schema", "name", "version", "description", "author", "homepage",
  "repository", "license", "keywords", "extensions",
]);

export const PLUGIN_NAME_PATTERN = /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
export const EXTENSION_NAMESPACE_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const PLUGIN_NAME_TRANSLITERATIONS: Record<string, string> = {
  "ß": "ss",
  "æ": "ae",
  "œ": "oe",
  "ø": "o",
  "ð": "d",
  "þ": "th",
  "ł": "l",
};

export function normalizePluginName(value: unknown) {
  const transliterated = String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[ßæœøðþł]/g, (character) => PLUGIN_NAME_TRANSLITERATIONS[character]);

  return transliterated
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\.+/g, ".")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .slice(0, 64)
    .replace(/[^a-z0-9]+$/g, "");
}
