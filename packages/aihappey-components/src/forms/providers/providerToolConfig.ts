const hasOwnProperty = (value: any, key: string) =>
  Object.prototype.hasOwnProperty.call(value ?? {}, key);

export const getProviderTool = (config: any, type: string) => {
  const tools = Array.isArray(config?.tools) ? config.tools : [];
  const canonicalTool = tools.find((tool: any) => tool?.type === type);
  const legacyTool = config?.[type];
  const value = canonicalTool ?? legacyTool;

  return value ? { ...value, type } : undefined;
};

export const withResolvedProviderTools = (config: any, toolTypes: string[]) => {
  const nextConfig = { ...(config ?? {}) };

  toolTypes.forEach((type) => {
    nextConfig[type] = getProviderTool(config, type);
  });

  return nextConfig;
};

export const buildCanonicalProviderToolsConfig = (
  config: any,
  toolTypes: string[]
) => {
  const nextConfig = { ...(config ?? {}) };
  const currentTools = Array.isArray(nextConfig.tools)
    ? nextConfig.tools.filter(Boolean)
    : [];
  const preservedTools = currentTools.filter(
    (tool: any) => tool?.type && !toolTypes.includes(tool.type)
  );
  const resolvedTools = toolTypes
    .map((type) => {
      const value = hasOwnProperty(nextConfig, type)
        ? nextConfig[type]
        : getProviderTool(nextConfig, type);

      return value ? { ...value, type } : undefined;
    })
    .filter(Boolean);
  const tools = [...preservedTools, ...resolvedTools];

  delete nextConfig.tools;

  toolTypes.forEach((type) => {
    delete nextConfig[type];
  });

  return {
    ...nextConfig,
    tools: tools.length ? tools : undefined,
  };
};
