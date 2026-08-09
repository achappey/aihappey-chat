import { useMemo, type ReactElement } from "react";
import { DocsI18nProvider } from "aihappey-docs-i18n";
import { createBrowserRouter, RouterProvider, useLocation } from "react-router";
import { AgentsOverviewPage } from "./pages/AgentsOverviewPage";
import { AiSdkChatEndpointPage } from "./pages/AiSdkChatEndpointPage";
import { ChatCompletionsEndpointPage } from "./pages/ChatCompletionsEndpointPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { GatewayOverviewPage } from "./pages/GatewayOverviewPage";
import { HomePage } from "./pages/HomePage";
import { ModelsEndpointPage } from "./pages/ModelsEndpointPage";
import { MessagesEndpointPage } from "./pages/MessagesEndpointPage";
import { OpenAiImageEndpointPage } from "./pages/OpenAiImageEndpointPage";
import { RealtimeEndpointPage } from "./pages/RealtimeEndpointPage";
import { RerankEndpointPage } from "./pages/RerankEndpointPage";
import { ResponsesEndpointPage } from "./pages/ResponsesEndpointPage";
import { SpeechEndpointPage } from "./pages/SpeechEndpointPage";
import { TranscriptionsEndpointPage } from "./pages/TranscriptionsEndpointPage";
import { VideoEndpointPage } from "./pages/VideoEndpointPage";
import { AiSdkImageEndpointPage } from "./pages/AiSdkImageEndpointPage";
import { SkillEndpointPage } from "./pages/SkillEndpointPage";
import { UiEndpointPage } from "./pages/UiEndpointPage";

export type DocsRootProps = {
  appTitle?: string;
  apiBaseUrl?: string;
};

const withLocation = (render: (activePath: string) => ReactElement) => {
  const RouteElement = () => {
    const location = useLocation();
    return render(location.pathname);
  };

  return <RouteElement />;
};

export const DocsRoot = ({ appTitle = "aihappey Developers", apiBaseUrl }: DocsRootProps) => {
  const router = useMemo(
    () =>
      createBrowserRouter([
        { path: "/", element: withLocation((activePath) => <HomePage activePath={activePath} appTitle={appTitle} />) },
        { path: "/gateway", element: withLocation((activePath) => <GatewayOverviewPage activePath={activePath} appTitle={appTitle} />) },
        { path: "/agents", element: withLocation((activePath) => <AgentsOverviewPage activePath={activePath} appTitle={appTitle} />) },
        { path: "/gateway/openai/models", element: withLocation((activePath) => <ModelsEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} />) },
        { path: "/gateway/openai/chat-completions", element: withLocation((activePath) => <ChatCompletionsEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} />) },
        { path: "/gateway/openai/realtime", element: withLocation((activePath) => <RealtimeEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} />) },
        { path: "/gateway/openai/responses", element: withLocation((activePath) => <ResponsesEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} />) },
        { path: "/gateway/openai/speech", element: withLocation((activePath) => <SpeechEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} surface="openai" />) },
        { path: "/gateway/openai/transcriptions", element: withLocation((activePath) => <TranscriptionsEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} surface="openai" />) },
        { path: "/gateway/openai/create-image", element: withLocation((activePath) => <OpenAiImageEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} endpoint="generation" />) },
        { path: "/gateway/openai/edit-image", element: withLocation((activePath) => <OpenAiImageEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} endpoint="edit" />) },
        { path: "/gateway/openai/list-skills", element: withLocation((activePath) => <SkillEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} endpoint="list" />) },
        { path: "/gateway/openai/download-skill", element: withLocation((activePath) => <SkillEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} endpoint="download" />) },
        { path: "/gateway/openai/list-skill-versions", element: withLocation((activePath) => <SkillEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} endpoint="versions" />) },
        { path: "/gateway/openai/download-skill-version", element: withLocation((activePath) => <SkillEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} endpoint="download-version" />) },
        { path: "/gateway/anthropic/messages", element: withLocation((activePath) => <MessagesEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} />) },
        { path: "/gateway/ai/chat", element: withLocation((activePath) => <AiSdkChatEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} />) },
        { path: "/gateway/ai/images", element: withLocation((activePath) => <AiSdkImageEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} />) },
        { path: "/gateway/ai/ui", element: withLocation((activePath) => <UiEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} />) },
        { path: "/gateway/ai/rerank", element: withLocation((activePath) => <RerankEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} />) },
        { path: "/gateway/ai/speech", element: withLocation((activePath) => <SpeechEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} surface="ai-sdk" />) },
        { path: "/gateway/ai/transcriptions", element: withLocation((activePath) => <TranscriptionsEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} surface="ai-sdk" />) },
        { path: "/gateway/ai/videos/create", element: withLocation((activePath) => <VideoEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} endpoint="create" />) },
        { path: "/gateway/ai/videos/get", element: withLocation((activePath) => <VideoEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} endpoint="get" />) },
        { path: "*", element: withLocation((activePath) => <ComingSoonPage activePath={activePath} appTitle={appTitle} />) },
      ]),
    [apiBaseUrl, appTitle]
  );

  return (
    <DocsI18nProvider>
      <RouterProvider router={router} />
    </DocsI18nProvider>
  );
};

export default DocsRoot;

