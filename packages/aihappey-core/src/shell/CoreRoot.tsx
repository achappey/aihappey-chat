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
} from "aihappey-auth";
import { OAuthCallbackPage } from "./OAuthCallbackPage";
import { NewChatPage } from "../features/chat/NewChatPage";
import { ChatArenaPage } from "../features/chat/arena/ChatArenaPage";
import { ChatPage } from "../features/chat";
import { AgentsPage } from "../features/agents/AgentsPage";
import { ImagePage } from "../features/images/ImagePage";
import { VideoPage } from "../features/videos/VideoPage";
import { useTheme } from "aihappey-components";
import { ModelsPage } from "../features/models/ModelsPage";
import { ProvidersPage } from "../features/providers/ProvidersPage";
import { MeshPage } from "../features/providers/MeshPage";
import { UsagePage } from "../features/usage/UsagePage";
import { TranscriptionsPage } from "../features/transcriptions/TranscriptionsPage";
import { SpeechPage } from "../features/speech/SpeechPage";
import { JobsPage } from "../features/jobs/JobsPage";
import { ToolsPage } from "../features/tools/ToolsPage";
import { FilesPage } from "../features/files/FilesPage";
import { RerankingPage } from "../features/reranking/RerankingPage";
import { StructuredOutputsPage } from "../features/structured-outputs/StructuredOutputsPage";
import { SkillsPage } from "../features/skills/SkillsPage";
import { WebAppsPage, WebAppDetailPage } from "../features/web-apps";
import { CatalogsPage } from "../features/catalogs";
import { RegistriesPage } from "../features/registries";
import { PlaygroundPage } from "../features/playground/PlaygroundPage";
import { defaultEndpoints } from "aihappey-ai";
import { RealtimePage } from "../features/realtime";
import { normalizeChatEndpointId } from "aihappey-state";
import { StreamingTranscriptionsPage } from "../features/streaming/StreamingTranscriptionsPage";
import { StreamingSpeechPage } from "../features/streaming/StreamingSpeechPage";
import { StreamingImageGenerationPage } from "../features/streaming/StreamingImageGenerationPage";
import { StreamingImageEditPage } from "../features/streaming/StreamingImageEditPage";
import { PluginsPage } from "../features/plugins/PluginsPage";
import type { PluginsConfig } from "aihappey-plugins";
import { VectorStoresPage } from "../features/vector-stores";

type CoreRootProps = {
  appName: string;
  baseUrl?: string;
  appVersion?: string;
  agentEndpoint?: string
  conversationsApi?: string;
  conversationsScopes?: string[];
  agentScopes?: string[];
  allowCustomLists?: boolean;
  chatConfig?: any & { defaultChatEndpoint?: string };
  authConfig?: AuthConfig;
  pluginConfig?: PluginsConfig;
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
  authConfig,
  pluginConfig,
}: CoreRootProps) => {
  const { Skeleton } = useTheme(); // Throws if no provider

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
      defaultChatEndpoint: normalizeChatEndpointId(chatConfig?.defaultChatEndpoint),
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
          chatConfig={mergedChatConfig}
          pluginConfig={pluginConfig}
        />
      ),
      children: [
        {
          element: <SidebarLayout />,
          children: [
            { index: true, element: <NewChatPage /> },
            { path: "realtime", element: <RealtimePage /> },
            { path: "realtime/:conversationId", element: <RealtimePage /> },
            { path: ":conversationId", element: <ChatPage /> },
            { path: "model-context-catalog", element: <ServersPage /> },
            { path: "models", element: <ModelsPage /> },
            { path: "providers", element: <ProvidersPage /> },
            { path: "mesh", element: <MeshPage /> },
            { path: "usage", element: <UsagePage /> },
            { path: "playground", element: <PlaygroundPage /> },
            { path: "tools", element: <ToolsPage /> },
            { path: "arena", element: <ChatArenaPage /> },
            { path: "agents", element: <AgentsPage /> },
            { path: "images", element: <ImagePage /> },
            { path: "videos", element: <VideoPage /> },
            { path: "files", element: <FilesPage /> },
            { path: "skills", element: <SkillsPage /> },
            { path: "plugins", element: <PluginsPage /> },
            { path: "structured-outputs", element: <StructuredOutputsPage /> },
            { path: "transcriptions", element: <TranscriptionsPage /> },
            { path: "speech", element: <SpeechPage /> },
            { path: "streaming/images/create", element: <StreamingImageGenerationPage /> },
            { path: "streaming/images/edit", element: <StreamingImageEditPage /> },
            { path: "streaming/transcriptions", element: <StreamingTranscriptionsPage /> },
            { path: "streaming/speech", element: <StreamingSpeechPage /> },
            { path: "jobs", element: <JobsPage /> },
            { path: "reranking", element: <RerankingPage /> },
            { path: "file-search", element: <VectorStoresPage /> },
            { path: "apps", element: <WebAppsPage /> },
            { path: "apps/:appId", element: <WebAppDetailPage /> },
            { path: "catalogs", element: <CatalogsPage /> },
            { path: "registries", element: <RegistriesPage /> }
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
        authenticationRequest={{
          scopes: authConfig!.msal.scopes,
        }}
      >
        {routerUi}
      </MsalAuthenticationTemplate>
    </MsalAuthProvider>
  ) : (
    routerUi
  );
};

export default CoreRoot;
