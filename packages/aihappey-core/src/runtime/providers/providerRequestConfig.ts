import { canonicalizeAnthropicTools } from "aihappey-components";

export const sanitizeProviderRequestConfigForProvider = (
  config?: Record<string, any>,
  providerKey?: string,
  _options?: { endpointId?: string },
): Record<string, any> | undefined => {
  if (!config) return undefined;

  const sanitized = Object.fromEntries(
    Object.entries(config).filter(([key, value]) => {
      const normalizedKey = key.trim().toLowerCase();
      if (!normalizedKey || value === undefined) return false;
      if (normalizedKey === "headers") return false;
      if (providerKey?.trim().toLowerCase() === "abliteration" && normalizedKey === "flagged_categories") return false;
      if (providerKey?.trim().toLowerCase() === "anthropic" && normalizedKey === "anthropic-beta") return false;
      if (providerKey?.trim().toLowerCase() === "openai" && normalizedKey === "openai-beta") return false;
      return true;
    }),
  );

  if (providerKey?.trim().toLowerCase() === "anthropic") {
    return Object.keys(sanitized).length ? canonicalizeAnthropicTools(sanitized) : undefined;
  }

  if (providerKey?.trim().toLowerCase() === "openai") {
    const withoutInputFidelity = (tool: Record<string, any>) => {
      const { input_fidelity: _removed, ...rest } = tool;
      return rest;
    };
    if (sanitized.image_generation && typeof sanitized.image_generation === "object") {
      sanitized.image_generation = withoutInputFidelity(sanitized.image_generation);
    }
    if (Array.isArray(sanitized.tools)) {
      sanitized.tools = sanitized.tools.map(tool =>
        tool?.type === "image_generation" ? withoutInputFidelity(tool) : tool);
    }
  }

  return Object.keys(sanitized).length ? sanitized : undefined;
};
