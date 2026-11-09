import { useEffect, useRef, useState } from "react";
import { store as appStore, useAppStore } from "aihappey-state";
import { useSearchParams } from "react-router";
import { listModelsWithSplitProviderHeaders, mergeCredentialHeaders, mergeModelResponses } from "../provider-credentials/providerAuthHeaders";
import type { ModelOption } from "aihappey-types";
import { useProviderRegistry } from "../../runtime/providers/useProviderRegistry";
import { localModelStore, modelCacheScope, type ModelCatalogSnapshot } from "aihappey-models";
import { favoriteRouterModel } from "../chat/engine/favoriteRouter";

const equivalentModelIds = (model: ModelOption) => [
  model.id,
  (model as any).displayId,
  (model as any).providerModelId,
].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

const resolveSelectableModelId = (
  models: ModelOption[],
  value?: string | null,
) => {
  const requested = String(value ?? "").trim();
  if (!requested) return undefined;

  const exact = models.find((item) => item.id === requested);
  if (exact) return exact.id;

  const matches = models.filter((item) => equivalentModelIds(item).includes(requested));
  if (matches.length === 0) return undefined;

  return matches.length === 1 ? matches[0].id : undefined;
};

const newestModelOfType = (models: ModelOption[], type?: string) => {
  const candidates = models.filter((item) => !type || item.type === type);
  return candidates
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (b.item.created ?? 0) - (a.item.created ?? 0) || a.index - b.index)[0]
    ?.item;
};

const modelTypeFor = (models: ModelOption[] | undefined, modelId?: string) =>
  modelId ? models?.find((item) => item.id === modelId)?.type : undefined;

export const useModels = (
  modelsApi: string,
  getAccessToken?: () => Promise<string>,
  options?: { gatewayEnabled?: boolean; headers?: Record<string, string>; cacheIdentity?: string }
) => {
  const models = useAppStore(a => a.models);
  const modelsLoaded = useAppStore(a => a.modelsLoaded);
  const refreshVersion = useAppStore(a => a.modelsRefreshVersion);
  const setModels = useAppStore(a => a.setModels)
  const customHeaders = useAppStore(a => a.customHeaders)
  const apiKeyEncryptionStatus = useAppStore(a => a.apiKeyEncryptionStatus);
  const gatewayEnabled = options?.gatewayEnabled !== false;
  const configuredHeaders = options?.headers;
  const cacheIdentity = options?.cacheIdentity;
  const setModelsLoadingProgress = useAppStore((a: any) => a.setModelsLoadingProgress)
  const setSelectedModel = useAppStore(a => a.setSelectedModel)
  const userPreferredModel = useAppStore(a => a.userPreferredModel)
  const selectedModel = useAppStore(a => a.selectedModel)
  const routingDecisionModel = useAppStore(a => favoriteRouterModel(a, "model"));
  const defaultSelectionRef = useRef<string | undefined>(undefined);
  const defaultCandidateIdsRef = useRef<string[] | undefined>(undefined);
  const [searchParams] = useSearchParams();
  const lastSelectionRef = useRef<{ selectedModel?: string; models?: ModelOption[] }>({});
  const selectionRef = useRef<{
    model?: string | null;
    selectedModel?: string;
    userPreferredModel?: string[];
  }>({});
  const providers = useProviderRegistry();
  const [storeHydrated, setStoreHydrated] = useState(() =>
    (appStore as any).persist?.hasHydrated?.() ?? true,
  );

  const model = searchParams.get("model");

  useEffect(() => {
    selectionRef.current = { model, selectedModel, userPreferredModel };
  }, [model, selectedModel, userPreferredModel]);

  useEffect(() => {
    const persistApi = (appStore as any).persist;
    if (!persistApi || persistApi.hasHydrated?.()) {
      setStoreHydrated(true);
      return;
    }

    return persistApi.onFinishHydration?.(() => setStoreHydrated(true));
  }, []);

  useEffect(() => {
    if (selectedModel || (models?.length ?? 0) > 0) {
      lastSelectionRef.current = { selectedModel, models };
    }
  }, [models, selectedModel]);

  useEffect(() => {
    // A locked startup has no provider headers yet; its anonymous catalog must not
    // initialize the picker before the password prompt unlocks the real catalog.
    if (!storeHydrated || apiKeyEncryptionStatus === "locked") return;

    let cancelled = false;
    let published = false;

    const publish = (loadedModels: ModelOption[]) => {
      if (cancelled) return;

      published = true;
      setModels(loadedModels);

      // Refreshing credentials/catalogs must not replace an explicit chat candidate selection.
      const state = appStore.getState();
      const defaultCandidates = state.selectedChatModelIds !== undefined
        && state.selectedChatModelIds === defaultCandidateIdsRef.current;
      if (!selectionRef.current.model && state.selectedChatModelIds !== undefined && !defaultCandidates) return;

      const latestUrlModel = selectionRef.current.model;
      // Preferences are durable lists; routing only controls the active picker selection.
      const defaults = state.userPreferredModel ?? [];
      const fromDefaults = !latestUrlModel
        && (defaultCandidates || !state.selectedModel || state.selectedModel === defaultSelectionRef.current);
      // Reconsider defaults after a partial cache/credential refresh, but never
      // mistake a deliberate user or conversation selection for our own fallback.
      const preferredModel = latestUrlModel ?? (fromDefaults ? defaults[0] : state.selectedModel);
      if (fromDefaults && favoriteRouterModel(state, "model")) {
        const ids = defaults.map(id => resolveSelectableModelId(loadedModels, id))
          .filter((id): id is string => !!id && loadedModels.some(m => m.id === id && m.type === "language"));
        if (ids.length) {
          state.setSelectedChatModelIds(ids);
          defaultCandidateIdsRef.current = appStore.getState().selectedChatModelIds;
          return;
        }
      }
      defaultCandidateIdsRef.current = undefined;
      const resolvedPreferredModel = resolveSelectableModelId(loadedModels, preferredModel);
      if (resolvedPreferredModel) {
        if (fromDefaults) defaultSelectionRef.current = resolvedPreferredModel;
        setSelectedModel(resolvedPreferredModel);
        return;
      }

      const previousModels = lastSelectionRef.current.models;
      const previousType = modelTypeFor(previousModels, preferredModel)
        ?? modelTypeFor(previousModels, lastSelectionRef.current.selectedModel)
        ?? "language";
      const fallbackModel = newestModelOfType(loadedModels, previousType);
      if (fromDefaults) defaultSelectionRef.current = fallbackModel?.id;
      setSelectedModel(fallbackModel?.id);
    };

    const load = async () => {
      const headers = mergeCredentialHeaders(configuredHeaders, customHeaders);
      const scope = await modelCacheScope({ endpoint: modelsApi, authenticated: !!getAccessToken,
        identity: cacheIdentity, gatewayEnabled, headers, providers }).catch(() => undefined);
      if (cancelled) return;
      const saved = scope ? await localModelStore.load<ModelOption>(scope) : undefined;
      if (cancelled) return;
      const snapshot: ModelCatalogSnapshot<ModelOption> = saved ?? { version: 1, sources: {} };
      if (saved) publish(mergeModelResponses(Object.values(saved.sources).map(source => source.response)).data);
      const response = await listModelsWithSplitProviderHeaders({
        modelsApi, getAccessToken, customHeaders: headers, directProviderModels: true,
        includeGatewayModels: gatewayEnabled, providers,
        cachedSources: Object.fromEntries(Object.entries(snapshot.sources).map(([key, value]) => [key, value.response])),
        onSource: (source, response) => {
          snapshot.sources[source] = { updatedAt: Date.now(), response };
        },
        onProgress: progress => { if (!cancelled) setModelsLoadingProgress?.(progress); },
      });
      if (cancelled) return;
      publish(response.data ?? []);
      setModelsLoadingProgress?.(undefined);
      if (scope) await localModelStore.replace(scope, snapshot);
    };

    void load().catch((err) => {
      if (cancelled) return;

      // Never replace a usable cached catalog with a failed refresh.
      if (!published) setModels([]);
      setModelsLoadingProgress?.(undefined);
      console.error("Failed to load models:", err);
    });

    return () => {
      cancelled = true;
    };

  }, [modelsApi, getAccessToken, configuredHeaders, customHeaders, apiKeyEncryptionStatus, cacheIdentity, refreshVersion, providers, setModels, setSelectedModel, setModelsLoadingProgress, storeHydrated, gatewayEnabled]);

  useEffect(() => {
    if (!modelsLoaded || !model) return;

    setSelectedModel(resolveSelectableModelId(models ?? [], model) ?? model);
  }, [models, modelsLoaded, model, setSelectedModel]);

  // The configured decision model may arrive after a cached catalog. Expand only a
  // default-owned selection, never an explicit URL/user/conversation candidate set.
  useEffect(() => {
    if (!modelsLoaded || !routingDecisionModel || model) return;
    const state = appStore.getState();
    if (state.selectedChatModelIds !== undefined || state.selectedModel !== defaultSelectionRef.current) return;
    const ids = (state.userPreferredModel ?? []).map(id => resolveSelectableModelId(models ?? [], id))
      .filter((id): id is string => !!id && models?.some(m => m.id === id && m.type === "language") === true);
    if (ids.length) {
      state.setSelectedChatModelIds(ids);
      defaultCandidateIdsRef.current = appStore.getState().selectedChatModelIds;
    }
  }, [models, modelsLoaded, routingDecisionModel, model, userPreferredModel, selectedModel]);
};
