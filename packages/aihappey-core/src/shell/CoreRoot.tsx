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
import { LibraryPage } from "../features/library/LibraryPage";
import { useTheme } from "aihappey-components";
import { ModelsPage } from "../features/models/ModelsPage";

type CoreRootProps = {
  appName?: string;
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
    // if (!authConfig) return chatConfig;
    // Ensure api is always present (required by AiChatConfig)
    const api = chatConfig?.api ?? "/api/chat";
    return {
      ...chatConfig,
      appName,
      appVersion,
      agentEndpoint,
      api,
      agentScopes,
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
            { path: "arena", element: <ChatArenaPage /> },
            { path: "agents", element: <AgentsPage /> },
            { path: "library", element: <LibraryPage /> }
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
