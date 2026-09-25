import { useEffect } from "react";
import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../theme/ThemeContext";

const REASONING_EFFORTS = [
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;

const SEARCH_PROVIDERS = ["exa", "keenable", "parallel", "youcom"] as const;

type ReasoningEffort = (typeof REASONING_EFFORTS)[number];
type SearchProvider = (typeof SEARCH_PROVIDERS)[number];

type BasetenTool = {
  type: string;
  [key: string]: unknown;
};

export type BasetenChatConfig = {
  chat_template_args?: {
    enable_thinking?: boolean;
    [key: string]: unknown;
  };
  reasoning_effort?: ReasoningEffort;
  tools?: BasetenTool[];
  baseten?: {
    tool_settings?: {
      max_react_iterations?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const SERVER_TOOLS_HEADER = "x-baseten-server-tools";
const DEFAULT_REASONING_EFFORT: ReasoningEffort = "medium";
const DEFAULT_MAX_REACT_ITERATIONS = 6;

const TOOL_SELECTORS: Record<
  SearchProvider,
  { search: string; fetch: string; advancedSearch?: string }
> = {
  exa: {
    search: "baseten__exa__web_search_exa",
    fetch: "baseten__exa__web_fetch_exa",
    advancedSearch: "baseten__exa__web_search_advanced_exa",
  },
  keenable: {
    search: "baseten__keenable__search_web_pages",
    fetch: "baseten__keenable__fetch_page_content",
  },
  parallel: {
    search: "baseten__parallel__web_search",
    fetch: "baseten__parallel__web_fetch",
  },
  youcom: {
    search: "baseten__youcom__you-search",
    fetch: "baseten__youcom__you-contents",
  },
};

const MANAGED_TOOL_SELECTORS = new Set(
  Object.values(TOOL_SELECTORS).flatMap(({ search, fetch, advancedSearch }) =>
    [search, fetch, advancedSearch].filter((value): value is string => !!value)
  )
);

const hasOwn = (value: unknown, key: string) =>
  Object.prototype.hasOwnProperty.call(value ?? {}, key);

const getTools = (config: BasetenChatConfig) =>
  Array.isArray(config?.tools) ? config.tools.filter((tool) => !!tool?.type) : [];

const getManagedToolTypes = (config: BasetenChatConfig) =>
  new Set(
    getTools(config)
      .map((tool) => tool.type)
      .filter((type) => MANAGED_TOOL_SELECTORS.has(type))
  );

const inferSearchProvider = (config: BasetenChatConfig): SearchProvider => {
  const managedTypes = getManagedToolTypes(config);
  return (
    SEARCH_PROVIDERS.find((provider) => {
      const selectors = TOOL_SELECTORS[provider];
      return (
        managedTypes.has(selectors.search) ||
        managedTypes.has(selectors.fetch) ||
        (!!selectors.advancedSearch && managedTypes.has(selectors.advancedSearch))
      );
    }) ??
    "exa"
  );
};

const withManagedTools = (
  config: BasetenChatConfig,
  managedTypes: Iterable<string>
): BasetenChatConfig => {
  const preservedTools = getTools(config).filter(
    (tool) => !MANAGED_TOOL_SELECTORS.has(tool.type)
  );
  const tools = [
    ...preservedTools,
    ...Array.from(new Set(managedTypes)).map((type) => ({ type })),
  ];

  return {
    ...config,
    tools: tools.length ? tools : undefined,
  };
};

const hasBasetenServerTools = (config: BasetenChatConfig) =>
  getTools(config).some((tool) => tool.type.startsWith("baseten__"));

const normalizeServerToolsHeader = (
  headers: Record<string, string> | undefined,
  enabled: boolean
) => {
  const nextHeaders = Object.fromEntries(
    Object.entries(headers ?? {}).filter(
      ([key]) => key.toLowerCase() !== SERVER_TOOLS_HEADER
    )
  );

  if (enabled) nextHeaders[SERVER_TOOLS_HEADER] = "true";
  return Object.keys(nextHeaders).length ? nextHeaders : undefined;
};

const headersEqual = (
  left: Record<string, string> | undefined,
  right: Record<string, string> | undefined
) => {
  const leftEntries = Object.entries(left ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const rightEntries = Object.entries(right ?? {}).sort(([a], [b]) => a.localeCompare(b));

  return (
    leftEntries.length === rightEntries.length &&
    leftEntries.every(
      ([key, value], index) =>
        rightEntries[index]?.[0] === key && rightEntries[index]?.[1] === value
    )
  );
};

const pruneObject = (value: Record<string, unknown>) => {
  const entries = Object.entries(value).filter(([, item]) => item !== undefined);
  return entries.length ? Object.fromEntries(entries) : undefined;
};

export const BasetenChatConfigForm = ({
  config,
  headers,
  updateConfig,
  updateHeaders,
}: {
  config: BasetenChatConfig;
  headers?: Record<string, string>;
  updateConfig: (config: BasetenChatConfig) => void;
  updateHeaders?: (headers: Record<string, string> | undefined) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const thinkingIncluded = hasOwn(config?.chat_template_args, "enable_thinking");
  const enableThinking = config?.chat_template_args?.enable_thinking ?? true;
  const reasoningIncluded = hasOwn(config, "reasoning_effort");
  const reasoningEffort = REASONING_EFFORTS.includes(
    config?.reasoning_effort as ReasoningEffort
  )
    ? (config.reasoning_effort as ReasoningEffort)
    : DEFAULT_REASONING_EFFORT;
  const selectedProvider = inferSearchProvider(config);
  const selectors = TOOL_SELECTORS[selectedProvider];
  const managedTypes = getManagedToolTypes(config);
  const webSearchOn = managedTypes.size > 0;
  const searchOn = managedTypes.has(selectors.search);
  const fetchOn = managedTypes.has(selectors.fetch);
  const advancedSearchOn = !!selectors.advancedSearch && managedTypes.has(selectors.advancedSearch);
  const maxIterationsIncluded = hasOwn(
    config?.baseten?.tool_settings,
    "max_react_iterations"
  );
  const maxReactIterations =
    config?.baseten?.tool_settings?.max_react_iterations ??
    DEFAULT_MAX_REACT_ITERATIONS;

  const submitConfig = (nextConfig: BasetenChatConfig) => {
    updateConfig(nextConfig);
    const nextHeaders = normalizeServerToolsHeader(
      headers,
      hasBasetenServerTools(nextConfig)
    );
    if (!headersEqual(headers, nextHeaders)) updateHeaders?.(nextHeaders);
  };

  useEffect(() => {
    const nextHeaders = normalizeServerToolsHeader(
      headers,
      hasBasetenServerTools(config)
    );
    if (!headersEqual(headers, nextHeaders)) updateHeaders?.(nextHeaders);
  }, [config, headers, updateHeaders]);

  const updateThinkingIncluded = (included: boolean) => {
    const chatTemplateArgs = pruneObject({
      ...(config?.chat_template_args ?? {}),
      enable_thinking: included ? enableThinking : undefined,
    });
    submitConfig({ ...config, chat_template_args: chatTemplateArgs });
  };

  const updateReasoningIncluded = (included: boolean) => {
    const nextConfig = { ...config };
    if (included) nextConfig.reasoning_effort = reasoningEffort;
    else delete nextConfig.reasoning_effort;
    submitConfig(nextConfig);
  };

  const replaceManagedTools = (nextManagedTypes: Iterable<string>) =>
    submitConfig(withManagedTools(config, nextManagedTypes));

  const toggleManagedTool = (type: string, enabled: boolean) => {
    const nextTypes = getManagedToolTypes(config);
    if (enabled) nextTypes.add(type);
    else nextTypes.delete(type);
    replaceManagedTools(nextTypes);
  };

  const changeProvider = (provider: SearchProvider) => {
    const nextSelectors = TOOL_SELECTORS[provider];
    const nextTypes = new Set<string>();
    if (searchOn) nextTypes.add(nextSelectors.search);
    if (fetchOn) nextTypes.add(nextSelectors.fetch);
    if (advancedSearchOn && nextSelectors.advancedSearch) {
      nextTypes.add(nextSelectors.advancedSearch);
    }
    replaceManagedTools(nextTypes);
  };

  const updateWebSearchIncluded = (included: boolean) => {
    if (included) {
      replaceManagedTools([selectors.search, selectors.fetch]);
      return;
    }

    const nextConfig = withManagedTools(config, []);
    const toolSettings = pruneObject({
      ...(nextConfig.baseten?.tool_settings ?? {}),
      max_react_iterations: undefined,
    });
    const baseten = pruneObject({
      ...(nextConfig.baseten ?? {}),
      tool_settings: toolSettings,
    });
    submitConfig({ ...nextConfig, baseten });
  };

  const updateMaxIterationsIncluded = (included: boolean) => {
    const toolSettings = pruneObject({
      ...(config?.baseten?.tool_settings ?? {}),
      max_react_iterations: included ? maxReactIterations : undefined,
    });
    const baseten = pruneObject({
      ...(config?.baseten ?? {}),
      tool_settings: toolSettings,
    });
    submitConfig({ ...config, baseten });
  };

  const reasoningOptions = REASONING_EFFORTS.map((value) => ({
    value,
    label: t(value),
  }));
  const providerOptions = SEARCH_PROVIDERS.map((value) => ({
    value,
    label: t(`providers:baseten.providers.${value}`),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("providers:baseten.enableThinking")}
        headerActions={
          <theme.Switch
            id="baseten-enable-thinking-included"
            checked={thinkingIncluded}
            onChange={updateThinkingIncluded}
          />
        }
      >
        <theme.Switch
          id="baseten-enable-thinking"
          disabled={!thinkingIncluded}
          checked={enableThinking}
          label={t("providers:baseten.enableThinkingValue")}
          onChange={(enabled) =>
            submitConfig({
              ...config,
              chat_template_args: {
                ...(config?.chat_template_args ?? {}),
                enable_thinking: !!enabled,
              },
            })
          }
        />
      </theme.Card>

      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="baseten-reasoning-effort-included"
            checked={reasoningIncluded}
            onChange={updateReasoningIncluded}
          />
        }
      >
        <theme.Select
          label={t("reasoningEffort", { reasoningEffort: t(reasoningEffort) })}
          disabled={!reasoningIncluded}
          values={[reasoningEffort]}
          valueTitle={t(reasoningEffort)}
          options={reasoningOptions}
          onChange={(value: string) =>
            submitConfig({
              ...config,
              reasoning_effort: value as ReasoningEffort,
            })
          }
        >
          {reasoningOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </theme.Select>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("webSearch")}
        headerActions={
          <theme.Switch
            id="baseten-web-search-included"
            checked={webSearchOn}
            onChange={updateWebSearchIncluded}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:baseten.searchProvider")}
            disabled={!webSearchOn}
            values={[selectedProvider]}
            valueTitle={t(`providers:baseten.providers.${selectedProvider}`)}
            options={providerOptions}
            onChange={(value: string) => changeProvider(value as SearchProvider)}
          >
            {providerOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </theme.Select>

          <theme.Switch
            id="baseten-search-tool"
            disabled={!webSearchOn}
            checked={searchOn}
            label={t("providers:baseten.searchTool")}
            onChange={(enabled) => toggleManagedTool(selectors.search, !!enabled)}
          />

          <theme.Switch
            id="baseten-fetch-tool"
            disabled={!webSearchOn}
            checked={fetchOn}
            label={t("providers:baseten.fetchTool")}
            onChange={(enabled) => toggleManagedTool(selectors.fetch, !!enabled)}
          />

          {selectedProvider === "exa" ? (
            <theme.Switch
              id="baseten-advanced-search-tool"
              disabled={!webSearchOn}
              checked={advancedSearchOn}
              label={t("providers:baseten.advancedSearchTool")}
              onChange={(enabled) =>
                toggleManagedTool(TOOL_SELECTORS.exa.advancedSearch!, !!enabled)
              }
            />
          ) : null}

          <theme.Switch
            id="baseten-max-react-iterations-included"
            disabled={!webSearchOn}
            checked={maxIterationsIncluded}
            label={t("providers:baseten.limitIterations")}
            onChange={updateMaxIterationsIncluded}
          />

          <theme.Input
            id="baseten-max-react-iterations"
            type="number"
            min={1}
            step={1}
            disabled={!webSearchOn || !maxIterationsIncluded}
            label={t("providers:baseten.maxReactIterations")}
            value={maxReactIterations}
            onChange={(event: any) => {
              const value = Math.max(1, Math.trunc(Number(event?.target?.value) || 1));
              submitConfig({
                ...config,
                baseten: {
                  ...(config?.baseten ?? {}),
                  tool_settings: {
                    ...(config?.baseten?.tool_settings ?? {}),
                    max_react_iterations: value,
                  },
                },
              });
            }}
          />
        </div>
      </theme.Card>
    </div>
  );
};
