import {
  Client,
  connectMcpServer,
  connectSimple
} from "aihappey-mcp";
import type { StateCreator } from "zustand";
import type { Provider } from "aihappey-types";

export type UiAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
};

export async function connectPersistent(id: string, url: string, opts: any) {
  let closedManually = false;

  async function connect(retry = 0): Promise<any> {
    try {
      const client = await connectSimple(url, opts);
      mcpRuntime.set(id, client);

      client.onclose = async () => {
        if (closedManually) return;

        const delay = Math.min(5000, 200 * 2 ** retry);
        await new Promise(res => setTimeout(res, delay));

        return connect(retry + 1);
      };

      return client;
    } catch {
      const delay = Math.min(5000, 200 * 2 ** retry);
      await new Promise(res => setTimeout(res, delay));

      return connect(retry + 1);
    }
  }

  await connect(0);

  return {
    close() {
      closedManually = true;
      const c = mcpRuntime.get(id);
      c?.close?.();
      mcpRuntime.delete(id);
    }
  };
}


export async function connectServerPersistent(id: string, url: string, opts: any) {
  let closedManually = false;

  async function connect(retry = 0): Promise<any> {
    try {
      const { client } = await connectMcpServer(url, opts);
      mcpRuntime.set(id, client);

      client.onclose = async () => {
        if (closedManually) return;

        const delay = Math.min(5000, 200 * 2 ** retry);
        await new Promise(res => setTimeout(res, delay));

        return connect(retry + 1);
      };

      return client;
    } catch {
      const delay = Math.min(5000, 200 * 2 ** retry);
      await new Promise(res => setTimeout(res, delay));

      return connect(retry + 1);
    }
  }

  const client = await connect(0);

  return {
    close() {
      closedManually = true;
      const c = mcpRuntime.get(id);
      c?.close?.();
      mcpRuntime.delete(id);
    }
  };
}

//client: InstanceType<typeof Client>;
export const mcpRuntime = new Map<string, Client>();

export const PROVIDER_CAPABILITIES = [
  "language",
  "image",
  "audio",
  "transcription",
  "speech",
  "reranking",
  "video",
] as const;

export type ProviderCapability = typeof PROVIDER_CAPABILITIES[number];
export type EnabledProvidersByType = Record<ProviderCapability, string[]>;
export type FavoriteModelsByType = Record<ProviderCapability, string[]>;
export type CustomProvidersByKey = Record<string, Provider>;

export const normalizeCustomProviderKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeStringArray = (values: unknown) => Array.isArray(values)
  ? Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)))
  : [];

export const normalizeCustomProviders = (providers: unknown): CustomProvidersByKey => {
  if (!providers || typeof providers !== "object" || Array.isArray(providers)) return {};

  const entries: [string, Provider][] = [];

  Object.entries(providers as Record<string, any>)
    .forEach(([rawKey, rawProvider]) => {
      const key = normalizeCustomProviderKey(rawKey);
      if (!key || !rawProvider || typeof rawProvider !== "object" || Array.isArray(rawProvider)) return;

      const provider = rawProvider as Partial<Provider>;
      const name = String(provider.name ?? key).trim();
      const apiBaseUrl = String(provider.apiBaseUrl ?? "").trim();
      const chatEndpoints = normalizeStringArray(provider.chatEndpoints);

      if (!name || !apiBaseUrl || chatEndpoints.length === 0) return;

      entries.push([key, {
        ...provider,
        name,
        apiBaseUrl,
        chatEndpoints,
        icons: Array.isArray(provider.icons) ? provider.icons : undefined,
        inferenceRegions: normalizeStringArray(provider.inferenceRegions),
        category: provider.category ?? "model_provider",
      }]);
    });

  return Object.fromEntries(entries);
};

export const createEmptyEnabledProvidersByType = (): EnabledProvidersByType => ({
  language: [],
  image: [],
  audio: [],
  transcription: [],
  speech: [],
  reranking: [],
  video: [],
});

export const createEmptyFavoriteModelsByType = (): FavoriteModelsByType => ({
  language: [],
  image: [],
  audio: [],
  transcription: [],
  speech: [],
  reranking: [],
  video: [],
});

const normalizeEnabledProvidersByType = (
  input?: Partial<Record<ProviderCapability, string[]>>
): EnabledProvidersByType => {
  const next = createEmptyEnabledProvidersByType();
  for (const capability of PROVIDER_CAPABILITIES) {
    const list = input?.[capability] ?? [];
    next[capability] = Array.from(new Set((list ?? []).filter(Boolean)));
  }
  return next;
};

const normalizeFavoriteModelsByType = (
  input?: Partial<Record<ProviderCapability, string[]>>
): FavoriteModelsByType => {
  const next = createEmptyFavoriteModelsByType();
  for (const capability of PROVIDER_CAPABILITIES) {
    const list = input?.[capability] ?? [];
    next[capability] = Array.from(new Set((list ?? []).filter(Boolean)));
  }
  return next;
};

export type UiSlice = {
  showActivities: boolean;
  enableAgentImport: boolean
  enableConversationImport: boolean
  chatWithImageModels?: boolean
  chatWithVideoModels?: boolean
  chatWithTranscriptionModels?: boolean
  chatWithSpeechModels?: boolean
  chatWithRerankModels?: boolean
  transcriptionFileSplitEnabled?: boolean
  transcriptionFileSplitOverlapSeconds?: number
  transcriptionFileSplitMaxSizeMb?: number
  elicitation?: any
  debugMode?: boolean
  showMessageTemperature?: boolean
  showMessageTokens?: boolean
  disableProviderLogo?: boolean
  pinnedConversations?: string[]
  hiddenNavigationItemKeys?: string[]
  togglePinnedConversation: (conversationId: string) => void;
  hideNavigationItem: (key: string) => void;
  showNavigationItem: (key: string) => void;
  toggleHiddenNavigationItem: (key: string) => void;
  setShowMessageTemperature: (value: boolean) => void;
  setShowMessageTokens: (value: boolean) => void;
  setDisableProviderLogo: (value: boolean) => void;

  quickSearches?: string[]
  addQuickSearch: (value: string) => void;
  deleteQuickSearch: (value: string) => void;
  toggleDebugMode: () => void;

  activitiesSize: string;
  setActivitiesSize: (value: string) => void;
  toggleChatWithImageModels: () => void;
  toggleChatWithVideoModels: () => void;
  toggleChatWithSpeechModels: () => void;
  toggleChatWithTranscriptionModels: () => void;
  setTranscriptionFileSplitEnabled: (enabled: boolean) => void;
  setTranscriptionFileSplitOverlapSeconds: (seconds: number) => void;
  setTranscriptionFileSplitMaxSizeMb: (mb: number) => void;
  toggleEliciation: () => void;
  toggleAgentImport: () => void;
  toggleConversationImport: () => void;
  toggleActivities: () => void;
  setActivities: (open: boolean) => void;

  extractExif: boolean;
  toggleExtractExif: () => void;
  setExtractExif: (extractExif: boolean) => void;

  enableUserLocation: boolean;
  toggleEnableUserLocation: () => void;
  setEnableUserLocation: (userLocation: boolean) => void;

  enableApps: boolean;
  toggleEnableApps: () => void;
  setEnableApps: (enableApps: boolean) => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  conversationStorage: "local" | "remote";
  setConversationStorage: (kind: "local" | "remote") => void;

  remoteStorageConnected: boolean;
  setRemoteStorageConnected: (connected: boolean) => void;

  enabledProvidersByType: EnabledProvidersByType;
  toggleEnabledProviderForType: (capability: ProviderCapability, provider: string) => void;
  setEnabledProvidersForType: (capability: ProviderCapability, providers: string[]) => void;
  setEnabledProvidersByType: (
    providersByType: Partial<Record<ProviderCapability, string[]>>
  ) => void;

  favoriteModelsByType: FavoriteModelsByType;
  toggleFavoriteModelForType: (capability: ProviderCapability, modelId: string) => void;
  setFavoriteModelsForType: (capability: ProviderCapability, modelIds: string[]) => void;
  setFavoriteModelsByType: (
    favoriteModelsByType: Partial<Record<ProviderCapability, string[]>>
  ) => void;

  enabledSkillIds: string[];
  toggleEnabledSkillId: (skillId: string) => void;
  setEnabledSkillIds: (skillIds: string[]) => void;

  favoriteSkillIds: string[];
  toggleFavoriteSkill: (skillId: string) => void;
  setFavoriteSkillIds: (skillIds: string[]) => void;

  favoriteProviderIds: string[];
  toggleFavoriteProvider: (providerId: string) => void;
  setFavoriteProviderIds: (providerIds: string[]) => void;

  customProviders: CustomProvidersByKey;
  setCustomProviders: (providers: CustomProvidersByKey) => void;
  upsertCustomProvider: (key: string, provider: Provider) => void;
  removeCustomProvider: (key: string) => void;

  selectedThemeId?: string;
  setSelectedThemeId: (themeId: string) => void;

  userPreferredModel?: string;
  setUserPreferredModel: (model: string) => void;

  userPreferredImageModel?: string;
  setUserPreferredImageModel: (model: string) => void;

  userPreferredAudioModel?: string;
  setUserPreferredAudioModel: (model: string) => void;

  userPreferredVideoModel?: string;
  setUserPreferredVideoModel: (model: string) => void;

  userPreferredRerankingModel?: string;
  setUserPreferredRerankingModel: (model: string) => void;

  userPreferredTranscriptionModel?: string;
  setUserPreferredTranscriptionModel: (model: string) => void;

  userPreferredSpeechModel?: string;
  setUserPreferredSpeechModel: (model: string) => void;

  accountLocation?: any
  setAccountLocation: (location?: any) => void

};

export const createUiSlice: StateCreator<
  any,
  [],
  [],
  UiSlice
> = (set, get, store) => ({
  showActivities: false,
  enableApps: true,
  enableAgentImport: true,
  enableConversationImport: true,
  enableUserLocation: false,
  extractExif: false,
  debugMode: false,
  elicitation: {},
  accountLocation: undefined,
  enabledProvidersByType: createEmptyEnabledProvidersByType(),
  favoriteModelsByType: createEmptyFavoriteModelsByType(),
  customProviders: {},
  enabledSkillIds: [],
  favoriteSkillIds: [],
  favoriteProviderIds: [],
  selectedThemeId: undefined,
  chatWithImageModels: false,
  chatWithVideoModels: false,
  chatWithRerankModels: false,
  chatWithSpeechModels: false,
  chatWithTranscriptionModels: false,
  transcriptionFileSplitEnabled: false,
  transcriptionFileSplitOverlapSeconds: 5,
  transcriptionFileSplitMaxSizeMb: 25,
  activitiesSize: "medium",
  quickSearches: ["Outlook", "SharePoint", "Microsoft", "Audio", "Images", "Video", "Web"],
  hiddenNavigationItemKeys: ["speech", "reranking", "videos", "jobs", "arena"],
  togglePinnedConversation: (value: string) =>
    set((state: UiSlice) => ({
      pinnedConversations: state.pinnedConversations?.includes(value) ?
        state.pinnedConversations.filter((a: any) => a != value) : [...state.pinnedConversations ?? [], value]
    })),
  hideNavigationItem: (key: string) =>
    set((state: UiSlice) => {
      if (!key || state.hiddenNavigationItemKeys?.includes(key)) return state;
      return {
        hiddenNavigationItemKeys: [...state.hiddenNavigationItemKeys ?? [], key],
      };
    }),
  showNavigationItem: (key: string) =>
    set((state: UiSlice) => {
      if (!key) return state;
      return {
        hiddenNavigationItemKeys: (state.hiddenNavigationItemKeys ?? []).filter((itemKey) => itemKey !== key),
      };
    }),
  toggleHiddenNavigationItem: (key: string) =>
    set((state: UiSlice) => {
      if (!key) return state;
      const current = state.hiddenNavigationItemKeys ?? [];
      const isHidden = current.includes(key);
      return {
        hiddenNavigationItemKeys: isHidden
          ? current.filter((itemKey) => itemKey !== key)
          : [...current, key],
      };
    }),
  setShowMessageTemperature: (value: boolean) =>
    set((state: UiSlice) => ({
      showMessageTemperature: value
    })),
  setShowMessageTokens: (value: boolean) =>
    set((state: UiSlice) => ({
      showMessageTokens: value
    })),
  setDisableProviderLogo: (value: boolean) =>
    set((state: UiSlice) => ({
      disableProviderLogo: value
    })),

  toggleChatWithImageModels: () =>
    set((s: UiSlice) => ({
      chatWithImageModels: !s.chatWithImageModels,
    })),
  toggleChatWithVideoModels: () =>
    set((s: UiSlice) => ({
      chatWithVideoModels: !s.chatWithVideoModels,
    })),
  toggleChatWithSpeechModels: () =>
    set((s: UiSlice) => ({
      chatWithSpeechModels: !s.chatWithSpeechModels,
    })),
  toggleChatWithTranscriptionModels: () =>
    set((s: UiSlice) => ({
      chatWithTranscriptionModels: !s.chatWithTranscriptionModels,
    })),
  setTranscriptionFileSplitEnabled: (enabled: boolean) =>
    set(() => ({
      transcriptionFileSplitEnabled: enabled,
    })),
  setTranscriptionFileSplitOverlapSeconds: (seconds: number) =>
    set(() => ({
      transcriptionFileSplitOverlapSeconds: Math.max(0, seconds),
    })),
  setTranscriptionFileSplitMaxSizeMb: (mb: number) =>
    set(() => ({
      transcriptionFileSplitMaxSizeMb: Math.max(1, mb),
    })),
  toggleEliciation: () =>
    set((s: any) => ({
      eliciation: s.eliciation ? undefined : {},
    })),
  toggleAgentImport: () =>
    set((s: any) => ({
      enableAgentImport: !s.enableAgentImport,
    })),

  toggleConversationImport: () =>
    set((s: any) => ({
      enableConversationImport: !s.enableConversationImport,
    })),

  addQuickSearch: (value: string) =>
    set((state: any) => ({
      quickSearches: state.quickSearches.includes(value)
        ? state.quickSearches
        : [...state.quickSearches, value],
    })),
  deleteQuickSearch: (value: string) =>
    set((state: any) => ({
      quickSearches: state.quickSearches.filter((v: string) => v !== value),
    })),

  setUserPreferredModel: (model) =>
    set((state: any) => {
      return {
        userPreferredModel: model
      }
    }),

  setUserPreferredImageModel: (model) =>
    set((state: any) => {
      return {
        userPreferredImageModel: model
      }
    }),

  setUserPreferredAudioModel: (model) =>
    set((state: any) => {
      return {
        userPreferredAudioModel: model
      }
    }),

  setUserPreferredVideoModel: (model) =>
    set((state: any) => {
      return {
        userPreferredVideoModel: model
      }
    }),

  setUserPreferredRerankingModel: (model) =>
    set((state: any) => {
      return {
        userPreferredRerankingModel: model
      }
    }),

  setUserPreferredSpeechModel: (model) =>
    set((state: any) => {
      return {
        userPreferredSpeechModel: model
      }
    }),

  setUserPreferredTranscriptionModel: (model) =>
    set((state: any) => {
      return {
        userPreferredTranscriptionModel: model
      }
    }),
  /*  toggleExcludedModel: (model) =>
    set((state: any) => {
      if (!model) return state
      const exists = state.exludedModels.includes(model)
      return {
        exludedModels: exists
          ? state.exludedModels.filter((p: any) => p !== model)
          : [...state.exludedModels, model],
      }
    }),*/
  toggleDebugMode: () =>
    set((state: any) => {
      return {
        debugMode: !state.debugMode
      }
    }),

  setActivitiesSize: (value: string) =>
    set((state: any) => {
      return {
        activitiesSize: value,
      }
    }),

  setEnabledProvidersByType: (providersByType: Partial<Record<ProviderCapability, string[]>>) =>
    set((state: any) => {
      return {
        enabledProvidersByType: normalizeEnabledProvidersByType(providersByType),
      }
    }),

  setFavoriteModelsByType: (favoriteModelsByType: Partial<Record<ProviderCapability, string[]>>) =>
    set(() => ({
      favoriteModelsByType: normalizeFavoriteModelsByType(favoriteModelsByType),
    })),

  setFavoriteModelsForType: (capability: ProviderCapability, modelIds: string[]) =>
    set((state: any) => {
      if (!capability) return state;
      const normalized = Array.from(new Set((modelIds ?? []).filter(Boolean)));
      return {
        favoriteModelsByType: {
          ...state.favoriteModelsByType,
          [capability]: normalized,
        },
      };
    }),

  toggleFavoriteModelForType: (capability: ProviderCapability, modelId?: string) =>
    set((state: any) => {
      if (!capability || !modelId) return state;
      const current = state.favoriteModelsByType?.[capability] ?? [];
      const exists = current.includes(modelId);
      return {
        favoriteModelsByType: {
          ...state.favoriteModelsByType,
          [capability]: exists
            ? current.filter((id: string) => id !== modelId)
            : [...current, modelId],
        },
      };
    }),

  setEnabledProvidersForType: (capability: ProviderCapability, providers: string[]) =>
    set((state: any) => {
      if (!capability) return state;
      const normalized = Array.from(new Set((providers ?? []).filter(Boolean)));
      return {
        enabledProvidersByType: {
          ...state.enabledProvidersByType,
          [capability]: normalized,
        },
      };
    }),

  setEnabledSkillIds: (skillIds: string[]) =>
    set(() => ({
      enabledSkillIds: Array.from(new Set((skillIds ?? []).filter(Boolean))),
    })),

  toggleEnabledSkillId: (skillId: string) =>
    set((state: UiSlice) => {
      if (!skillId) return state;
      const exists = state.enabledSkillIds.includes(skillId);
      return {
        enabledSkillIds: exists
          ? state.enabledSkillIds.filter((id) => id !== skillId)
          : [...state.enabledSkillIds, skillId],
      };
    }),

  setFavoriteSkillIds: (skillIds: string[]) =>
    set(() => ({
      favoriteSkillIds: Array.from(new Set((skillIds ?? []).filter(Boolean))),
    })),

  setFavoriteProviderIds: (providerIds: string[]) =>
    set(() => ({
      favoriteProviderIds: Array.from(new Set((providerIds ?? []).filter(Boolean))),
    })),

  setCustomProviders: (customProviders: CustomProvidersByKey) =>
    set(() => ({
      customProviders: normalizeCustomProviders(customProviders),
    })),

  upsertCustomProvider: (key: string, provider: Provider) =>
    set((state: any) => {
      const normalizedKey = normalizeCustomProviderKey(key);
      if (!normalizedKey) return state;

      const normalized = normalizeCustomProviders({ [normalizedKey]: provider });
      const normalizedProvider = normalized[normalizedKey];
      if (!normalizedProvider) return state;

      return {
        customProviders: {
          ...(state.customProviders ?? {}),
          [normalizedKey]: normalizedProvider,
        },
      };
    }),

  removeCustomProvider: (key: string) =>
    set((state: any) => {
      const normalizedKey = normalizeCustomProviderKey(key);
      if (!normalizedKey) return state;

      const { [normalizedKey]: _removed, ...rest } = state.customProviders ?? {};
      return { customProviders: rest };
    }),

  toggleFavoriteSkill: (skillId: string) =>
    set((state: UiSlice) => {
      if (!skillId) return state;
      const current = state.favoriteSkillIds ?? [];
      const exists = current.includes(skillId);
      return {
        favoriteSkillIds: exists
          ? current.filter((id) => id !== skillId)
          : [...current, skillId],
      };
    }),

  toggleFavoriteProvider: (providerId: string) =>
    set((state: UiSlice) => {
      if (!providerId) return state;
      const current = state.favoriteProviderIds ?? [];
      const exists = current.includes(providerId);
      return {
        favoriteProviderIds: exists
          ? current.filter((id) => id !== providerId)
          : [...current, providerId],
      };
    }),

  setSelectedThemeId: (themeId: string) =>
    set(() => ({
      selectedThemeId: themeId,
    })),

  toggleEnabledProviderForType: (capability: ProviderCapability, provider?: string) =>
    set((state: any) => {
      if (!capability || !provider) return state
      const current = state.enabledProvidersByType?.[capability] ?? [];
      const exists = current.includes(provider)
      return {
        enabledProvidersByType: {
          ...state.enabledProvidersByType,
          [capability]: exists
            ? current.filter((p: any) => p !== provider)
            : [...current, provider],
        },
      }
    }),

  setAccountLocation: (location?: any) =>
    set(() => ({ accountLocation: location })),

  toggleEnableUserLocation: () =>
    set((s: any) => ({
      enableUserLocation: !s.enableUserLocation,
    })),

  setEnableUserLocation: (enableUserLocation: boolean) =>
    set(() => ({
      enableUserLocation: enableUserLocation,
    })),

  toggleExtractExif: () =>
    set((s: any) => ({
      extractExif: !s.extractExif,
    })),
  setExtractExif: (extractExif: boolean) =>
    set(() => ({
      extractExif: extractExif,
    })),
  toggleEnableApps: () =>
    set((s: any) => ({
      enableApps: !s.enableApps,
    })),
  setEnableApps: (enableApps: boolean) =>
    set(() => ({
      enableApps: enableApps,
    })),
  toggleActivities: () =>
    set((s: any) => ({
      showActivities: !s.showActivities,
    })),
  setActivities: (open: boolean) =>
    set(() => ({
      showActivities: open,
    })),
  sidebarOpen: true,
  toggleSidebar: () =>
    set((s: any) => ({
      sidebarOpen: !s.sidebarOpen,
    })),
  setSidebarOpen: (open: boolean) =>
    set(() => ({
      sidebarOpen: open,
    })),
  conversationStorage: "local",
  setConversationStorage: (kind: "local" | "remote") =>
    set(() => ({
      conversationStorage: kind,
    })),
  remoteStorageConnected: false,
  setRemoteStorageConnected: (connected: boolean) =>
    set(() => ({
      remoteStorageConnected: connected,
    })),
});
