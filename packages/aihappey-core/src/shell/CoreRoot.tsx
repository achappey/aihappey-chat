// Root component for MCP Happey apps: loads server lists, manages state, renders server list UI.
// Requires a ThemeProvider (throws if missing).
import { useEffect, useMemo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { CoreShell } from "./CoreShell";
import { ServersPage } from "../features/mcp-catalog/ServersPage";
import { SidebarLayout } from "./navigation/SidebarLayout";
import {
  AuthConfig,
  initAuth,
  acquireAccessToken,
  MsalAuthenticationTemplate,
  InteractionType,
  MsalAuthProvider,
  OAuthCallbackPage,
} from "aihappey-auth";
import { NewChatPage } from "../features/chat/NewChatPage";
import { ChatArenaPage } from "../features/chat/arena/ChatArenaPage";
import { ChatPage } from "../features/chat";
import { AgentsPage } from "../features/agents/AgentsPage";
import { ImagePage } from "../features/images/ImagePage";
import { useTheme } from "aihappey-components";
import { ModelsPage } from "../features/models/ModelsPage";
import { ProvidersPage } from "../features/providers/ProvidersPage";
import { TranscriptionsPage } from "../features/transcriptions/TranscriptionsPage";
import { SpeechPage } from "../features/speech/SpeechPage";
import { ToolsPage } from "../features/tools/ToolsPage";
import { FilesPage } from "../features/files/FilesPage";
import { RerankingPage } from "../features/reranking/RerankingPage";
import { defaultEndpoints } from "aihappey-ai";

type CoreRootProps = {
  appName: string;
  baseUrl: string;
  appVersion?: string;
  agentEndpoint?: string
  conversationsApi?: string;
  chatAppMcp?: string;
  conversationsScopes?: string[];
  agentScopes?: string[];
  allowCustomLists?: boolean;
  chatConfig?: any;
  authConfig?: AuthConfig;
};

export const CoreRoot = ({
  chatConfig,
  conversationsApi,
  conversationsScopes,
  appName,
  baseUrl,
  agentScopes,
  agentEndpoint,
  appVersion,
  chatAppMcp,
  authConfig,
}: CoreRootProps) => {
  useTheme(); // Throws if no provider

  const msalInstance = useMemo(() => {
    if (!authConfig) return null;
    return initAuth(authConfig);
  }, [authConfig]);

  useEffect(() => {
    document.title = appName ?? "AIHappey";
  }, []);

  // 2. merge chatConfig with auth if msal present
  const mergedChatConfig = useMemo(() => {
    return {
      ...chatConfig,
      appName,
      appVersion,
      agentEndpoint,
      agentScopes,
      baseUrl: baseUrl,
      endpoints: defaultEndpoints,
      getAccessToken: authConfig != null ?
        () => acquireAccessToken(authConfig.msal.scopes) : undefined,
    };
  }, [chatConfig, authConfig, appName]);

  // Core routes for internal navigation
  const routes = [
    {
      path: "/oauth-callback",
      element: <OAuthCallbackPage />,
    },
    {
      path: "/*",
      element: (
        <CoreShell
          apiUrl={conversationsApi}
          conversationScopes={conversationsScopes}
          agentScopes={agentScopes}
          chatAppMcp={chatAppMcp}
          chatConfig={mergedChatConfig}
        />
      ),
      children: [
        {
          element: <SidebarLayout />,
          children: [
            { index: true, element: <NewChatPage /> },
            { path: ":conversationId", element: <ChatPage /> },
            { path: "model-context-catalog", element: <ServersPage /> },
            { path: "models", element: <ModelsPage /> },
            { path: "providers", element: <ProvidersPage /> },
            { path: "tools", element: <ToolsPage /> },
            { path: "arena", element: <ChatArenaPage /> },
            { path: "agents", element: <AgentsPage /> },
            { path: "images", element: <ImagePage /> },
            { path: "files", element: <FilesPage /> },
            { path: "transcriptions", element: <TranscriptionsPage /> },
            { path: "speech", element: <SpeechPage /> },
            { path: "reranking", element: <RerankingPage /> }
          ],
        },
      ],
    },
  ];

  const router = createBrowserRouter(routes);
  const routerUi = <RouterProvider router={router} />;

  return msalInstance ? (
    <MsalAuthProvider instance={msalInstance}>
      <MsalAuthenticationTemplate
        interactionType={InteractionType.Redirect}
        authenticationRequest={{ scopes: authConfig!.msal.scopes }}
      >
        {routerUi}
      </MsalAuthenticationTemplate>
    </MsalAuthProvider>
  ) : (
    <>{routerUi}</>
  );
};

export default CoreRoot;
