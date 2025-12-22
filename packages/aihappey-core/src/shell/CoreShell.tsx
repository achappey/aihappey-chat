import React from "react";
import { Outlet, useParams, useSearchParams } from "react-router";
import { McpConnectionsProvider } from "../runtime/mcp/McpConnectionsProvider";
import { ChatAppConnector } from "./connectors/ChatAppConnector";
import { I18nProvider } from "aihappey-i18n";
import { ConversationsProvider } from "aihappey-conversations";
import { useEffect } from "react";
import { useRemoteStorageConnected, useAppStore } from "aihappey-state";
import { useAccessToken } from "aihappey-auth/src/msal/useAccessToken";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { McpServerBootstrap } from "./bootstrap/McpServerBootstrap";
import { useModels } from "../features/models/useModels";
import { ChatConfig, ChatProvider } from "../features/chat/context/ChatProvider";
import { useIsDesktop } from "./responsive/useIsDesktop";
import { useDefaultModel } from "./bootstrap/useDefaultModel";
import { useDefaultProviders } from "./bootstrap/useDefaultProviders";

type Props = {
  chatConfig?: ChatConfig;
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
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const setSafeHosts = useAppStore((s) => s.setSafeHosts);
  const setSelectedModel = useAppStore((s) => s.setSelectedModel);
  const isDesktop = useIsDesktop();
  const [] = useSearchParams()

  useDefaultModel(chatConfig?.getAccessToken != undefined)
  useDefaultProviders(chatConfig?.defaultProviders)
  const [searchParams, setSearchParams] = useSearchParams();

  // lezen
  const model = searchParams.get("model");

  useEffect(() => {
    if (model)
      setSelectedModel(model);
  }, [model]);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, []);

  useModels(
    chatConfig?.modelsApi!,
    chatConfig?.getAccessToken
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

  return (
    <I18nProvider>
      <DndProvider backend={HTML5Backend}>
        <McpServerBootstrap />
        <ChatAppConnector
          mcpUrl={chatAppMcp}
          clientName={chatConfig?.appName}
          clientVersion={chatConfig?.appVersion}
          samplingApi={chatConfig?.samplingApi}
        >
          <ConversationsProvider apiUrl={apiUrl!} scopes={conversationScopes ?? []}>
            <McpConnectionsProvider
              clientName={chatConfig?.appName}
              agentScopes={agentScopes ?? []}
              agentApi={chatConfig?.agentEndpoint!}
              authenticated={chatConfig?.getAccessToken != null}
              clientVersion={chatConfig?.appVersion}
              samplingApi={chatConfig?.samplingApi!}
            >
              {ui}
            </McpConnectionsProvider>
          </ConversationsProvider>
        </ChatAppConnector>
      </DndProvider>
    </I18nProvider>
  );
};
