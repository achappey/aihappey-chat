import { useCallback } from "react";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types";
import type { ModelOption, Provider } from "aihappey-types";
import { useAppStore } from "aihappey-state";
import { PROVIDERS } from "../../../runtime/providers/providerMetadata";

const fail = (err: unknown): CallToolResult => ({
  isError: true,
  content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
});

const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();

const INFERENCE_REGION_OPTIONS = [
  "World",
  "Europe",
  "Americas",
  "Asia",
  "Africa",
  "Oceania",
] as const;

const parseLimit = (value: unknown): number | undefined => {
  if (value == null) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(Math.floor(n), 500);
};

const applyLimit = <T,>(items: T[], limit?: number) => {
  if (!limit) return items;
  return items.slice(0, limit);
};

export const localAiProvidersListTool: Tool = {
  name: "local_ai_providers_list",
  title: "List local AI providers",
  description: "List providers from the local runtime provider catalog.",
  inputSchema: {
    type: "object",
    properties: {
      country: {
        type: "string",
        description:
          "Optional provider country filter (exact ISO country code match, case-insensitive), e.g. NL.",
      },
      inferenceRegion: {
        type: "string",
        enum: [...INFERENCE_REGION_OPTIONS],
        description:
          "Optional inference region filter (exact token match, case-insensitive). Allowed values: World, Europe, Americas, Asia, Africa, Oceania.",
      },
      limit: {
        type: "integer",
        description: "Optional max number of providers to return.",
      },
    },
    required: [],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localAiProvidersSearchTool: Tool = {
  name: "local_ai_providers_search",
  title: "Search local AI providers",
  description: "Search providers in the local runtime provider catalog by key or display name.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search text matched case-insensitively against provider key and name.",
      },
      country: {
        type: "string",
        description:
          "Optional provider country filter (exact ISO country code match, case-insensitive), e.g. NL.",
      },
      inferenceRegion: {
        type: "string",
        enum: [...INFERENCE_REGION_OPTIONS],
        description:
          "Optional inference region filter (exact token match, case-insensitive). Allowed values: World, Europe, Americas, Asia, Africa, Oceania.",
      },
      limit: {
        type: "integer",
        description: "Optional max number of providers to return.",
      },
    },
    required: ["query"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localAiModelsSearchTool: Tool = {
  name: "local_ai_models_search",
  title: "Search local AI models",
  description:
    "Search models from local app state by id, name, type, owner, tags, provider id, and provider name.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search text for local models.",
      },
      provider: {
        type: "string",
        description: "Optional provider filter by provider key or display name.",
      },
      type: {
        type: "string",
        description: "Optional model type filter (e.g. language, image, speech).",
      },
      limit: {
        type: "integer",
        description: "Max number of models to return.",
      },
    },
    required: ["query", "limit"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localAiModelsListByProviderTool: Tool = {
  name: "local_ai_models_list_by_provider",
  title: "List local AI models by provider",
  description: "List local app-state models by provider, with optional model type filter.",
  inputSchema: {
    type: "object",
    properties: {
      provider: {
        type: "string",
        description: "Provider key or display name.",
      },
      type: {
        type: "string",
        description: "Optional model type filter.",
      },
      limit: {
        type: "integer",
        description: "Optional max number of models to return.",
      },
    },
    required: ["provider"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localArtificialIntelligencePluginDef = {
  name: "local-artificial-intelligence",
  match: (toolName: string) => toolName.startsWith("local_ai_"),
  tools: [
    localAiProvidersListTool,
    localAiProvidersSearchTool,
    localAiModelsSearchTool,
    localAiModelsListByProviderTool,
  ],
};

type LocalAiToolName =
  | "local_ai_providers_list"
  | "local_ai_providers_search"
  | "local_ai_models_search"
  | "local_ai_models_list_by_provider";

type LocalAiToolCall = {
  toolName: LocalAiToolName;
  input?: any;
};

type ProviderView = {
  key: string;
  name: string;
  description?: string;
  experimental?: boolean;
  providerCountry?: string;
  inferenceRegions?: string[];
};

const providerViewFromEntry = ([key, provider]: [string, Provider]): ProviderView => ({
  key,
  name: provider.name,
  description: provider.description,
  experimental: provider.experimental,
  providerCountry: provider.providerCountry,
  inferenceRegions: provider.inferenceRegions,
});

const listProviderViews = (): ProviderView[] => {
  return Object.entries(PROVIDERS)
    .map(entry => providerViewFromEntry(entry as [string, Provider]))
    .sort((a, b) => {
      const byName = a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
        numeric: true,
      });
      if (byName !== 0) return byName;
      return a.key.localeCompare(b.key, undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });
};

const filterProviderViews = (
  providers: ProviderView[],
  {
    countryInput,
    inferenceRegionInput,
  }: {
    countryInput?: unknown;
    inferenceRegionInput?: unknown;
  }
) => {
  const countryNeedle = normalizeText(countryInput);
  const inferenceRegionNeedle = normalizeText(inferenceRegionInput);

  return providers.filter(provider => {
    if (countryNeedle) {
      const providerCountry = normalizeText(provider.providerCountry);
      if (providerCountry !== countryNeedle) return false;
    }

    if (inferenceRegionNeedle) {
      const matchesRegion = (provider.inferenceRegions ?? []).some(
        region => normalizeText(region) === inferenceRegionNeedle
      );
      if (!matchesRegion) return false;
    }

    return true;
  });
};

const findProviderKeys = (providerQuery: unknown, providers: ProviderView[]) => {
  const q = normalizeText(providerQuery);
  if (!q) return [] as string[];

  const exact = providers.filter(
    p => normalizeText(p.key) === q || normalizeText(p.name) === q
  );
  if (exact.length > 0) return Array.from(new Set(exact.map(p => p.key)));

  const fuzzy = providers.filter(
    p => normalizeText(p.key).includes(q) || normalizeText(p.name).includes(q)
  );
  return Array.from(new Set(fuzzy.map(p => p.key)));
};

const modelProviderKey = (modelId: string): string => {
  const idx = modelId.indexOf("/");
  if (idx <= 0) return normalizeText(modelId);
  return normalizeText(modelId.slice(0, idx));
};

const filterModelsByProvider = (
  models: ModelOption[],
  providerInput: unknown,
  providers: ProviderView[]
) => {
  const keys = findProviderKeys(providerInput, providers);
  if (keys.length === 0) return [] as ModelOption[];
  const keySet = new Set(keys);
  return models.filter(m => keySet.has(modelProviderKey(String(m.id ?? ""))));
};

const filterModelsByType = (models: ModelOption[], typeInput: unknown) => {
  const typeNeedle = normalizeText(typeInput);
  if (!typeNeedle) return models;
  return models.filter(m => normalizeText(m.type).includes(typeNeedle));
};

const sortModels = (models: ModelOption[]) =>
  [...models].sort((a, b) => {
    const aLabel = normalizeText(a.name || a.id);
    const bLabel = normalizeText(b.name || b.id);
    const byLabel = aLabel.localeCompare(bLabel, undefined, {
      sensitivity: "base",
      numeric: true,
    });
    if (byLabel !== 0) return byLabel;
    return String(a.id ?? "").localeCompare(String(b.id ?? ""), undefined, {
      sensitivity: "base",
      numeric: true,
    });
  });

export function useLocalArtificialIntelligenceRuntime() {
  const models = (useAppStore(s => s.models) as ModelOption[] | undefined) ?? [];

  const handle = useCallback(
    async (toolCall: LocalAiToolCall): Promise<CallToolResult> => {
      try {
        const input = toolCall.input ?? {};
        const providers = listProviderViews();

        switch (toolCall.toolName) {
          case "local_ai_providers_list": {
            const filtered = filterProviderViews(providers, {
              countryInput: input.country,
              inferenceRegionInput: input.inferenceRegion,
            });
            const limit = parseLimit(input.limit);
            const items = applyLimit(filtered, limit);
            return {
              structuredContent: { total: filtered.length, count: items.length, items },
              content: []
            };
          }

          case "local_ai_providers_search": {
            const query = normalizeText(input.query);
            if (!query) throw new Error("Missing query.");

            const limit = parseLimit(input.limit);
            const queryFiltered = providers.filter(
              p => normalizeText(p.key).includes(query) || normalizeText(p.name).includes(query)
            );
            const filtered = filterProviderViews(queryFiltered, {
              countryInput: input.country,
              inferenceRegionInput: input.inferenceRegion,
            });
            const items = applyLimit(filtered, limit);
            return {
              structuredContent: { total: filtered.length, count: items.length, items },
              content: []
            };

          }

          case "local_ai_models_search": {
            const query = normalizeText(input.query);
            //if (!query) throw new Error("Missing query.");

            const limit = parseLimit(input.limit);
            let filtered = [...models];
            if (input.provider != null && String(input.provider).trim()) {
              filtered = filterModelsByProvider(filtered, input.provider, providers);
            }
            filtered = filterModelsByType(filtered, input.type);

            const providerNameByKey = new Map(
              providers.map(p => [normalizeText(p.key), normalizeText(p.name)] as const)
            );

            const searched = filtered.filter(m => {
              const id = String(m.id ?? "");
              const providerKey = modelProviderKey(id);
              const providerName = providerNameByKey.get(providerKey) ?? "";
              const haystack = normalizeText(
                [
                  m.id,
                  m.name,
                  m.type,
                  m.owned_by,
                  ...(Array.isArray(m.tags) ? m.tags : []),
                  providerKey,
                  providerName,
                ].join(" ")
              );
              return haystack.includes(query);
            });

            const sorted = sortModels(searched);
            const items = applyLimit(sorted, limit);
            return {
              structuredContent: { data: items },
              content: []
            };
          }

          case "local_ai_models_list_by_provider": {
            const provider = String(input.provider ?? "").trim();
            if (!provider) throw new Error("Missing provider.");

            const limit = parseLimit(input.limit);
            const filtered = filterModelsByType(
              filterModelsByProvider(models, provider, providers),
              input.type
            );
            const sorted = sortModels(filtered);
            const items = applyLimit(sorted, limit);
            return {
              structuredContent: { total: sorted.length, count: items.length, data: items },
              content: []
            };
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [models]
  );

  return {
    name: localArtificialIntelligencePluginDef.name,
    handle,
  };
}

