import React, { useEffect, useMemo } from "react";
import { Outlet, useSearchParams } from "react-router";
import { McpConnectionsProvider } from "../runtime/mcp/McpConnectionsProvider";
import { I18nProvider } from "aihappey-i18n";
import { ConversationsProvider } from "aihappey-conversations";
import {
  defaultProviderMetadata,
  defaultProviderHeaders,
  ensureDefaultAgents,
  getConfiguredDefaultAgents,
  splitLegacyProviderHeadersFromMetadata,
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
import { useProviderRegistry } from "../runtime/providers/useProviderRegistry";
import { ImagesProvider } from "aihappey-images";
import { JobsProvider } from "aihappey-jobs";
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
import { PluginsProvider, type PluginsConfig } from "aihappey-plugins";
import {
  localAgentStore,
  resolveAgentHydration as resolveLocalAgentHydration,
} from "aihappey-agents";
import {
  chatProviderMetadataStore,
  resolveProviderMetadataHydration,
} from "aihappey-provider-metadata";
import type { Agent } from "aihappey-types";
import { ApiKeyUnlockHost } from "../features/provider-credentials/ApiKeyUnlockHost";
import { AgentPluginRuntimeBinding } from "../runtime/plugins/AgentPluginRuntimeBinding";
import { VectorStoresProvider } from "aihappey-embeddings";

const EMPTY_SKILL_NAMES: string[] = [];

type Props = {
  chatConfig: ChatConfig;
  apiUrl?: string;
  conversationScopes?: string[];
  agentScopes?: string[];
  pluginConfig?: PluginsConfig;
};

export const CoreShell: React.FC<Props> = ({
  chatConfig,
  apiUrl,
  conversationScopes,
  agentScopes,
  pluginConfig,
}) => {
  const remoteStorageConnected = useRemoteStorageConnected();
  const [, token, error, refresh] = useAccessToken(conversationScopes ?? []);
  const [, , , refreshAgentToken] = useAccessToken(agentScopes ?? []);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const setSafeHosts = useAppStore((s) => s.setSafeHosts);
  const setAgents = useAppStore((s) => s.setAgents);
  const setProviderMetadata = useAppStore((s) => s.setProviderMetadata);
  const setProviderHeaders = useAppStore((s) => s.setProviderHeaders);
  const setConfiguredChatEndpoint = useAppStore((s) => s.setConfiguredChatEndpoint);
  const enabledSkillIds = useAppStore((s) => s.enabledSkillIds);
  const enabledAgentPluginIds = useAppStore((s) => s.enabledAgentPluginIds);
  const setEnabledSkillIds = useAppStore((s) => s.setEnabledSkillIds);
  const legacyEnabledSkillNames = useAppStore((s: any) => (s.__legacyEnabledSkillNames as string[] | undefined) ?? EMPTY_SKILL_NAMES);
  const setConfiguredBaseUrl = useAppStore((s) => s.setConfiguredBaseUrl);
  const configuredChatEndpointMode = useAppStore((s) => s.configuredChatEndpointMode);
  const effectiveChatEndpointMode = useAppStore((s) => s.effectiveChatEndpointMode);
  const selectedChatEndpointMode = useAppStore((s) => s.selectedChatEndpointMode);
  const selectedChatEndpoint = useAppStore((s) => s.selectedChatEndpoint);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const gatewayEnabled = useAppStore((s) => s.gatewayEnabled);
  const setSelectedBaseUrl = useAppStore((s) => s.setSelectedBaseUrl);
  const setConfiguredChatEndpointMode = useAppStore((s) => s.setConfiguredChatEndpointMode);
  const setSelectedChatEndpointMode = useAppStore((s) => s.setSelectedChatEndpointMode);
  const setSelectedEndpointProfileId = useAppStore((s) => s.setSelectedEndpointProfileId);
  const resetModels = useAppStore((s) => s.resetModels);
  const storeEffectiveBaseUrl = useAppStore((s) => s.effectiveBaseUrl);
  const selectedBaseUrl = useAppStore((s) => s.selectedBaseUrl);
  const selectedEndpointProfileId = useAppStore((s) => s.selectedEndpointProfileId);
  const providers = useProviderRegistry();
  const isDesktop = useIsDesktop();
  const [] = useSearchParams()
  const authenticated = chatConfig?.getAccessToken != null;
  const configuredGatewayBaseUrl = typeof chatConfig?.baseUrl === "string" && chatConfig.baseUrl.trim().length > 0
    ? chatConfig.baseUrl
    : "";
  const effectiveBaseUrl = authenticated
    ? configuredGatewayBaseUrl
    : effectiveChatEndpointMode === "direct"
      ? configuredGatewayBaseUrl
    : configuredGatewayBaseUrl
      ? storeEffectiveBaseUrl || configuredGatewayBaseUrl
      : "";
  const hasGatewayBaseUrl = typeof effectiveBaseUrl === "string" && effectiveBaseUrl.trim().length > 0;
  const effectiveGatewayEnabled = hasGatewayBaseUrl
    && (authenticated || ((chatConfig as any)?.gatewayEnabled !== false && gatewayEnabled !== false));
  const effectiveChatConfig = useMemo(
    () => ({
      ...chatConfig,
      baseUrl: effectiveBaseUrl,
      gatewayEnabled: effectiveGatewayEnabled,
      getAgentAccessToken: agentScopes?.length
        ? async () => (await refreshAgentToken()) ?? ""
        : undefined,
    }),
    [agentScopes?.length, chatConfig, effectiveBaseUrl, effectiveGatewayEnabled, refreshAgentToken],
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
    if (authenticated && configuredChatEndpointMode !== "default") {
      setConfiguredChatEndpointMode("default");
    }
    if (authenticated && selectedChatEndpointMode) {
      setSelectedChatEndpointMode(undefined);
    }
    if (authenticated && selectedBaseUrl) {
      setSelectedBaseUrl(undefined);
    }
    if (authenticated && selectedEndpointProfileId) {
      setSelectedEndpointProfileId(undefined);
    }
  }, [authenticated, configuredChatEndpointMode, selectedBaseUrl, selectedChatEndpointMode, selectedEndpointProfileId, setConfiguredChatEndpointMode, setSelectedBaseUrl, setSelectedChatEndpointMode, setSelectedEndpointProfileId]);

  useEffect(() => {
    let cancelled = false;

    const hydrateProviderMetadata = async () => {
      const indexedDbProviderMetadata = await chatProviderMetadataStore.list();
      const legacyProviderMetadata = (appStore.getState() as any)
        .__legacyProviderMetadata as Record<string, any> | undefined;
      const currentProviderHeaders = (appStore.getState() as any)
        .providerHeaders as Record<string, any> | undefined;

      const { record: hydratedProviderMetadata, source } =
        resolveProviderMetadataHydration({
          defaults: defaultProviderMetadata,
          indexedDb: indexedDbProviderMetadata,
          legacy: legacyProviderMetadata,
        });
      const split = splitLegacyProviderHeadersFromMetadata({
        providerMetadata: hydratedProviderMetadata,
        providerHeaders: {
          ...defaultProviderHeaders,
          ...(currentProviderHeaders ?? {}),
        },
      });
      const cleanProviderMetadata = split.providerMetadata;
      const hydratedProviderHeaders = split.providerHeaders;

      const shouldWriteHydratedRecord =
        source !== "indexeddb"
        || JSON.stringify(indexedDbProviderMetadata) !== JSON.stringify(cleanProviderMetadata);

      if (shouldWriteHydratedRecord) {
        await chatProviderMetadataStore.replaceAll(cleanProviderMetadata);
      }

      if (cancelled) return;

      const unsubscribeProviderMetadataPersist = appStore.subscribe(
        (state, previousState) => {
          if (state.providerMetadata === previousState.providerMetadata) return;

          void chatProviderMetadataStore.replaceAll(state.providerMetadata ?? {});
        }
      );

      setProviderMetadata(cleanProviderMetadata);
      setProviderHeaders(hydratedProviderHeaders);

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
  }, [setProviderHeaders, setProviderMetadata]);

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

  const modelsApi = effectiveGatewayEnabled
    ? effectiveChatConfig.baseUrl + effectiveChatConfig.endpoints.models
    : "";
  const remoteAgentModelsApi = effectiveChatConfig?.agentEndpoint
    ? effectiveChatConfig.agentEndpoint + effectiveChatConfig.endpoints.models
    : undefined;
  const skillsApi = effectiveGatewayEnabled
    ? effectiveChatConfig.baseUrl + effectiveChatConfig.endpoints.skills
    : undefined;

  useEffect(() => {
    (resetModels as any)({ keepSelectedModel: true });
  }, [customHeaders, effectiveChatEndpointMode, effectiveGatewayEnabled, modelsApi, providers, resetModels, selectedChatEndpoint, selectedEndpointProfileId]);

  useModels(
    modelsApi,
    effectiveChatConfig?.getAccessToken,
    { gatewayEnabled: effectiveGatewayEnabled }
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
    if (effectiveChatConfig?.agentEndpoint) {
      items.push(new URL(effectiveChatConfig?.agentEndpoint).host);
    }
    setSafeHosts(items);
  }, [effectiveChatConfig, setSafeHosts]);

  const ui = effectiveChatConfig ? (
    <ChatProvider config={effectiveChatConfig}>
      <Outlet />
    </ChatProvider>
  ) : (
    <Outlet />
  );

  const inferenceApi = effectiveGatewayEnabled
    ? effectiveChatConfig.baseUrl
    : undefined;

  return (
    <I18nProvider>
      <ErrorLog />
      <ApiKeyUnlockHost />
      <DndProvider backend={HTML5Backend}>
        <McpServerBootstrap />
        <ImagesProvider storageKind={"indexeddb"}>
          <VectorStoresProvider>
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
                        enabledSkillIds={enabledSkillIds}
                        setEnabledSkillIds={setEnabledSkillIds}
                        legacyEnabledSkillNames={legacyEnabledSkillNames}
                        setLegacyEnabledSkillNames={(skillNames) => appStore.setState({ __legacyEnabledSkillNames: skillNames } as any)}
                      >
                        <PluginsProvider config={pluginConfig} enabledPluginIds={enabledAgentPluginIds}>
                        <AgentPluginRuntimeBinding />
                        <JsonRenderCatalogProvider>
                          <JsonRenderRegistryProvider>
                            <JsonRenderAppsProvider>
                              <SpeechProvider storageKind={"indexeddb"}>
                                <JobsProvider storageKind={"indexeddb"}>
                                  <ConversationsProvider apiUrl={apiUrl!} scopes={conversationScopes ?? []}>
                                    <McpConnectionsProvider
                                      clientName={effectiveChatConfig?.appName}
                                      agentScopes={agentScopes ?? []}
                                      agentApi={effectiveChatConfig?.agentEndpoint!}
                                      conversationsApi={apiUrl}
                                      conversationScopes={conversationScopes ?? []}
                                      authenticated={effectiveChatConfig?.getAccessToken != null}
                                      clientVersion={effectiveChatConfig?.appVersion}
                                      inferenceApi={inferenceApi}
                                    >
                                      {ui}
                                    </McpConnectionsProvider>
                                  </ConversationsProvider>
                                </JobsProvider>
                              </SpeechProvider>
                            </JsonRenderAppsProvider>
                          </JsonRenderRegistryProvider>
                        </JsonRenderCatalogProvider>
                        </PluginsProvider>
                      </SkillsProvider>
                    </VideosProvider>
                  </StructuredOutputsProvider>
                </TranscriptionsProvider>
              </RerankingProvider>
            </FilesProvider>
            </ToolsProvider>
          </VectorStoresProvider>
        </ImagesProvider>
      </DndProvider>
    </I18nProvider >
  );
};
