import {
  Client,
  connectMcpServer,
  connectSimple, CreateMessageRequest,
  CreateMessageResult
} from "aihappey-mcp";
import type { StateCreator } from "zustand";

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

export type UiSlice = {
  showActivities: boolean;
  enableAgentImport: boolean
  enableConversationImport: boolean
  sampling?: any
  elicitation?: any
  debugMode?: boolean
  quickSearches?: string[]
  addQuickSearch: (value: string) => void;
  deleteQuickSearch: (value: string) => void;
  toggleDebugMode: () => void;

  activitiesSize: string;
  setActivitiesSize: (value: string) => void;
  toggleSampling: () => void;
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

  enabledProviders: string[];
  toggleEnabledProvider: (provider: string) => void;

  userPreferredModel?: string;
  setUserPreferredModel: (model: string) => void;

  accountLocation?: any
  setAccountLocation: (location?: any) => void

  connectChatApp: (
    clientName: string,
    clientVersion: string,
    url: string,
    opts: McpConnectOpts
  ) => Promise<{
    close(): void;
  }>;

};

type McpConnectOpts = {
  onSample?: (server: string, req: CreateMessageRequest) => Promise<CreateMessageResult>;
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
  sampling: {},
  elicitation: {},
  accountLocation: undefined,
  enabledProviders: [],
  activitiesSize: "medium",
  quickSearches: ["Outlook", "SharePoint", "Microsoft", "Audio", "Images", "Video", "Web"],
  toggleEliciation: () =>
    set((s: any) => ({
      eliciation: s.eliciation ? undefined : {},
    })),
  toggleSampling: () =>
    set((s: any) => ({
      sampling: s.sampling ? undefined : {},
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
  toggleEnabledProvider: (provider?: string) =>
    set((state: any) => {
      if (!provider) return state
      const exists = state.enabledProviders.includes(provider)
      return {
        enabledProviders: exists
          ? state.enabledProviders.filter((p: any) => p !== provider)
          : [...state.enabledProviders, provider],
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
  connectChatApp: async (name, version, url, opts) => {
    return connectPersistent("chatapp", url, {
      ...opts,
      clientName: name,
      clientVersion: version
    });
  },

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
