import React, { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router";
import { McpConnectionsProvider } from "../runtime/mcp/McpConnectionsProvider";
import { ChatAppConnector } from "./connectors/ChatAppConnector";
import { I18nProvider } from "aihappey-i18n";
import { ConversationsProvider } from "aihappey-conversations";
import {
  defaultAgents,
  defaultProviderMetadata,
  store as appStore,
  useRemoteStorageConnected,
  useAppStore,
} from "aihappey-state";
import { useAccessToken } from "aihappey-auth/src/msal/useAccessToken";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { McpServerBootstrap } from "./bootstrap/McpServerBootstrap";
import { useModels } from "../features/models/useModels";
import { useRemoteAgentModels } from "../features/agents/useRemoteAgentModels";
import { ChatConfig, ChatProvider } from "../features/chat/context/ChatProvider";
import { useIsDesktop } from "./responsive/useIsDesktop";
import { useDefaultModel } from "./bootstrap/useDefaultModel";
import { useDefaultProviders } from "./bootstrap/useDefaultProviders";
import { ImagesProvider } from "aihappey-images";
import { ToolsProvider } from "aihappey-tools";
import { FilesProvider } from "aihappey-files";
import { TranscriptionsProvider } from "aihappey-transcriptions";
import { RerankingProvider } from "aihappey-reranking";
import { SpeechProvider } from "aihappey-speech";
import { ErrorLog } from "./bootstrap/ErrorLog";
import { StructuredOutputsProvider } from "aihappey-structured-outputs";
import { JsonRenderRegistryProvider } from "aihappey-json-render-registry";
import { JsonRenderCatalogProvider } from "aihappey-json-render-catalog";
import { JsonRenderAppsProvider } from "aihappey-json-render-apps";
import { VideosProvider } from "aihappey-videos";
import { SkillsProvider } from "aihappey-skills";
import {
  localAgentStore,
  resolveAgentHydration as resolveLocalAgentHydration,
} from "aihappey-agents";
import {
  chatProviderMetadataStore,
  resolveProviderMetadataHydration,
} from "aihappey-provider-metadata";
import type { Agent } from "aihappey-types";

const ensureDefaultLocalAgents = (agents: Agent[] = []) => {
  const existingNames = new Set((agents ?? []).map((agent) => agent?.name).filter(Boolean));
  const missingDefaults = defaultAgents.filter((agent) => !existingNames.has(agent.name));
  return [...(agents ?? []), ...missingDefaults];
};

type Props = {
  chatConfig: ChatConfig;
  apiUrl?: string;
  chatAppMcp?: string;
  conversationScopes?: string[];
  agentScopes?: string[];
};

export const CoreShell: React.FC<Props> = ({
  chatConfig,
  apiUrl,
  conversationScopes,
  agentScopes,
  chatAppMcp,
}) => {
  const remoteStorageConnected = useRemoteStorageConnected();
  const [, token, error, refresh] = useAccessToken(conversationScopes ?? []);
  const [, , , refreshAgentToken] = useAccessToken(agentScopes ?? []);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const setSafeHosts = useAppStore((s) => s.setSafeHosts);
  const setAgents = useAppStore((s) => s.setAgents);
  const setProviderMetadata = useAppStore((s) => s.setProviderMetadata);
  const isDesktop = useIsDesktop();
  const [] = useSearchParams()

  useDefaultModel(chatConfig?.getAccessToken != undefined)
  useDefaultProviders(chatConfig?.defaultProvidersByType)

  useEffect(() => {
    let cancelled = false;

    const hydrateProviderMetadata = async () => {
      const indexedDbProviderMetadata = await chatProviderMetadataStore.list();
      const legacyProviderMetadata = (appStore.getState() as any)
        .__legacyProviderMetadata as Record<string, any> | undefined;

      const { record: hydratedProviderMetadata, source } =
        resolveProviderMetadataHydration({
          defaults: defaultProviderMetadata,
          indexedDb: indexedDbProviderMetadata,
          legacy: legacyProviderMetadata,
        });

      const shouldWriteHydratedRecord =
        source !== "indexeddb"
        || JSON.stringify(indexedDbProviderMetadata) !== JSON.stringify(hydratedProviderMetadata);

      if (shouldWriteHydratedRecord) {
        await chatProviderMetadataStore.replaceAll(hydratedProviderMetadata);
      }

      if (cancelled) return;

      const unsubscribeProviderMetadataPersist = appStore.subscribe(
        (state, previousState) => {
          if (state.providerMetadata === previousState.providerMetadata) return;

          void chatProviderMetadataStore.replaceAll(state.providerMetadata ?? {});
        }
      );

      setProviderMetadata(hydratedProviderMetadata);

      return unsubscribeProviderMetadataPersist;
    };

    let unsubscribeProviderMetadataPersist: (() => void) | undefined;

    void hydrateProviderMetadata().then((unsubscribe) => {
      if (cancelled) {
        unsubscribe?.();
        return;
      }

      unsubscribeProviderMetadataPersist = unsubscribe;
    });

    return () => {
      cancelled = true;
      unsubscribeProviderMetadataPersist?.();
    };
  }, [setProviderMetadata]);

  useEffect(() => {
    let cancelled = false;

    const hydrateLocalAgents = async () => {
      const indexedDbAgents = await localAgentStore.list();
      const legacyAgents = (appStore.getState() as any)
        .__legacyAgents as Agent[] | undefined;

      const { agents: resolvedAgents, source } = resolveLocalAgentHydration({
        defaults: defaultAgents,
        indexedDb: indexedDbAgents,
        legacy: legacyAgents,
      });

      const hydratedAgents = ensureDefaultLocalAgents(resolvedAgents);

      const shouldWriteHydratedAgents =
        source !== "indexeddb"
        || JSON.stringify(indexedDbAgents) !== JSON.stringify(hydratedAgents);

      if (shouldWriteHydratedAgents) {
        await localAgentStore.replaceAll(hydratedAgents);
      }

      if (cancelled) return;

      setAgents(hydratedAgents);

      if (cancelled) return;

      const unsubscribeLocalAgentPersist = appStore.subscribe(
        (state, previousState) => {
          if (state.agents === previousState.agents) return;

          void localAgentStore.replaceAll(state.agents ?? []);
        }
      );

      return unsubscribeLocalAgentPersist;
    };

    let unsubscribeLocalAgentPersist: (() => void) | undefined;

    void hydrateLocalAgents().then((unsubscribe) => {
      if (cancelled) {
        unsubscribe?.();
        return;
      }

      unsubscribeLocalAgentPersist = unsubscribe;
    });

    return () => {
      cancelled = true;
      unsubscribeLocalAgentPersist?.();
    };
  }, [setAgents]);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, []);

  const modelsApi = chatConfig.baseUrl + chatConfig.endpoints.models;
  const remoteAgentModelsApi = chatConfig?.agentEndpoint
    ? chatConfig.agentEndpoint + chatConfig.endpoints.models
    : undefined;
  const skillsApi = chatConfig.baseUrl + chatConfig.endpoints.skills;

  useModels(
    modelsApi,
    chatConfig?.getAccessToken
  );

  useRemoteAgentModels(
    remoteAgentModelsApi,
    agentScopes?.length
      ? async () => (await refreshAgentToken()) ?? ""
      : undefined
  );

  useEffect(() => {
    if (remoteStorageConnected) {
      refresh().finally(() => console.log(token));
    }
    // Only run on mount and when remoteStorageConnected changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteStorageConnected]);

  useEffect(() => {
    const items: string[] = []
    if (chatAppMcp) {
      items.push(new URL(chatAppMcp).host);
    }

    if (chatConfig?.agentEndpoint) {
      items.push(new URL(chatConfig?.agentEndpoint).host);
    }
    setSafeHosts(items);
  }, [chatAppMcp, chatConfig]);

  const ui = chatConfig ? (
    <ChatProvider config={chatConfig}>
      <Outlet />
    </ChatProvider>
  ) : (
    <Outlet />
  );

  const samplingEndpoint = chatConfig.baseUrl + chatConfig.endpoints.sampling;

  return (
    <I18nProvider>
      <ErrorLog />
      <DndProvider backend={HTML5Backend}>
        <McpServerBootstrap />
        <ChatAppConnector
          mcpUrl={chatAppMcp}
          clientName={chatConfig?.appName}
          clientVersion={chatConfig?.appVersion}
          samplingApi={samplingEndpoint}
        >
          <ImagesProvider storageKind={"indexeddb"}>
            <ToolsProvider storageKind={"indexeddb"}>
              <FilesProvider>
                <RerankingProvider>
                  <TranscriptionsProvider>
                    <StructuredOutputsProvider>
                      <VideosProvider>
                        <SkillsProvider
                          skillsApi={skillsApi}
                          getAccessToken={chatConfig?.getAccessToken}
                          headers={chatConfig?.headers}
                          fetch={chatConfig?.fetch}
                        >
                          <JsonRenderCatalogProvider>
                            <JsonRenderRegistryProvider>
                              <JsonRenderAppsProvider>
                                <SpeechProvider storageKind={"indexeddb"}>
                                  <ConversationsProvider apiUrl={apiUrl!} scopes={conversationScopes ?? []}>
                                    <McpConnectionsProvider
                                      clientName={chatConfig?.appName}
                                      agentScopes={agentScopes ?? []}
                                      agentApi={chatConfig?.agentEndpoint!}
                                      authenticated={chatConfig?.getAccessToken != null}
                                      clientVersion={chatConfig?.appVersion}
                                      samplingApi={samplingEndpoint}
                                    >
                                      {ui}
                                    </McpConnectionsProvider>
                                  </ConversationsProvider>
                                </SpeechProvider>
                              </JsonRenderAppsProvider>
                            </JsonRenderRegistryProvider>
                          </JsonRenderCatalogProvider>
                        </SkillsProvider>
                      </VideosProvider>
                    </StructuredOutputsProvider>
                  </TranscriptionsProvider>
                </RerankingProvider>
              </FilesProvider>
            </ToolsProvider>
          </ImagesProvider>
        </ChatAppConnector>
      </DndProvider>
    </I18nProvider >
  );
};
