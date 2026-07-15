import { useMemo, type ReactElement } from "react";
import { DocsI18nProvider } from "aihappey-docs-i18n";
import { createBrowserRouter, RouterProvider, useLocation } from "react-router";
import { AgentsOverviewPage } from "./pages/AgentsOverviewPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { GatewayOverviewPage } from "./pages/GatewayOverviewPage";
import { HomePage } from "./pages/HomePage";
import { SpeechEndpointPage } from "./pages/SpeechEndpointPage";

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
        { path: "/gateway/openai/speech", element: withLocation((activePath) => <SpeechEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} surface="openai" />) },
        { path: "/gateway/ai/speech", element: withLocation((activePath) => <SpeechEndpointPage activePath={activePath} appTitle={appTitle} apiBaseUrl={apiBaseUrl} surface="ai-sdk" />) },
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

