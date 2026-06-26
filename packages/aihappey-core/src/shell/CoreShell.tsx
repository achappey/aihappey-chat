import React, { useEffect, useMemo } from "react";
import { Outlet, useSearchParams } from "react-router";
import { McpConnectionsProvider } from "../runtime/mcp/McpConnectionsProvider";
import { ChatAppConnector } from "./connectors/ChatAppConnector";
import { I18nProvider } from "aihappey-i18n";
import { ConversationsProvider } from "aihappey-conversations";
import {
  defaultProviderMetadata,
  ensureDefaultAgents,
  getConfiguredDefaultAgents,
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
import { resolveEndpointProfile } from "../features/chat/engine/endpointProfiles";
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
  const setConfiguredChatEndpoint = useAppStore((s) => s.setConfiguredChatEndpoint);
  const setConfiguredBaseUrl = useAppStore((s) => s.setConfiguredBaseUrl);
  const setSelectedBaseUrl = useAppStore((s) => s.setSelectedBaseUrl);
  const setSelectedEndpointProfileId = useAppStore((s) => s.setSelectedEndpointProfileId);
  const resetModels = useAppStore((s) => s.resetModels);
  const storeEffectiveBaseUrl = useAppStore((s) => s.effectiveBaseUrl);
  const selectedBaseUrl = useAppStore((s) => s.selectedBaseUrl);
  const selectedEndpointProfileId = useAppStore((s) => s.selectedEndpointProfileId);
  const isDesktop = useIsDesktop();
  const [] = useSearchParams()
  const authenticated = chatConfig?.getAccessToken != null;
  const selectedEndpointProfile = useMemo(
    () => resolveEndpointProfile({
      selectedEndpointProfileId,
      selectedBaseUrl,
      configuredChatEndpoint: chatConfig?.defaultChatEndpoint,
    }),
    [chatConfig?.defaultChatEndpoint, selectedBaseUrl, selectedEndpointProfileId],
  );
  const effectiveBaseUrl = authenticated
    ? chatConfig.baseUrl
    : selectedEndpointProfile?.kind === "provider"
      ? selectedEndpointProfile.apiBaseUrl || chatConfig.baseUrl
    : storeEffectiveBaseUrl || chatConfig.baseUrl;
  const effectiveChatConfig = useMemo(
    () => ({
      ...chatConfig,
      baseUrl: effectiveBaseUrl,
    }),
    [chatConfig, effectiveBaseUrl],
  );

  useDefaultModel(chatConfig?.getAccessToken != undefined)
  useDefaultProviders(chatConfig?.defaultProvidersByType)

  useEffect(() => {
    setConfiguredChatEndpoint(chatConfig?.defaultChatEndpoint);
  }, [chatConfig?.defaultChatEndpoint, setConfiguredChatEndpoint]);

  useEffect(() => {
    setConfiguredBaseUrl(chatConfig?.baseUrl);
  }, [chatConfig?.baseUrl, setConfiguredBaseUrl]);

  useEffect(() => {
    if (authenticated && selectedBaseUrl) {
      setSelectedBaseUrl(undefined);
    }
    if (authenticated && selectedEndpointProfileId) {
      setSelectedEndpointProfileId(undefined);
    }
  }, [authenticated, selectedBaseUrl, selectedEndpointProfileId, setSelectedBaseUrl, setSelectedEndpointProfileId]);

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
      const configuredDefaultAgents = getConfiguredDefaultAgents();
      const indexedDbAgents = await localAgentStore.list();
      const legacyAgents = (appStore.getState() as any)
        .__legacyAgents as Agent[] | undefined;

      const { agents: resolvedAgents, source } = resolveLocalAgentHydration({
        defaults: configuredDefaultAgents,
        indexedDb: indexedDbAgents,
        legacy: legacyAgents,
      });

      const hydratedAgents = ensureDefaultAgents(resolvedAgents, configuredDefaultAgents);

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

  const modelsApi = effectiveChatConfig.baseUrl + effectiveChatConfig.endpoints.models;
  const remoteAgentModelsApi = effectiveChatConfig?.agentEndpoint
    ? effectiveChatConfig.agentEndpoint + effectiveChatConfig.endpoints.models
    : undefined;
  const skillsApi = effectiveChatConfig.baseUrl + effectiveChatConfig.endpoints.skills;

  useEffect(() => {
    resetModels();
  }, [modelsApi, resetModels]);

  useModels(
    modelsApi,
    effectiveChatConfig?.getAccessToken
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

    if (effectiveChatConfig?.agentEndpoint) {
      items.push(new URL(effectiveChatConfig?.agentEndpoint).host);
    }
    setSafeHosts(items);
  }, [chatAppMcp, effectiveChatConfig, setSafeHosts]);

  const ui = effectiveChatConfig ? (
    <ChatProvider config={effectiveChatConfig}>
      <Outlet />
    </ChatProvider>
  ) : (
    <Outlet />
  );

  const samplingEndpoint = effectiveChatConfig.baseUrl + effectiveChatConfig.endpoints.sampling;

  return (
    <I18nProvider>
      <ErrorLog />
      <DndProvider backend={HTML5Backend}>
        <McpServerBootstrap />
        <ChatAppConnector
            mcpUrl={chatAppMcp}
          clientName={effectiveChatConfig?.appName}
          clientVersion={effectiveChatConfig?.appVersion}
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
                          getAccessToken={effectiveChatConfig?.getAccessToken}
                          headers={effectiveChatConfig?.headers}
                          fetch={effectiveChatConfig?.fetch}
                        >
                          <JsonRenderCatalogProvider>
                            <JsonRenderRegistryProvider>
                              <JsonRenderAppsProvider>
                                <SpeechProvider storageKind={"indexeddb"}>
                                  <ConversationsProvider apiUrl={apiUrl!} scopes={conversationScopes ?? []}>
                                    <McpConnectionsProvider
                                      clientName={effectiveChatConfig?.appName}
                                      agentScopes={agentScopes ?? []}
                                      agentApi={effectiveChatConfig?.agentEndpoint!}
                                      authenticated={effectiveChatConfig?.getAccessToken != null}
                                      clientVersion={effectiveChatConfig?.appVersion}
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
