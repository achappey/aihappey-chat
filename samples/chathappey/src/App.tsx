import CoreRoot, { MultiThemeProvider } from "aihappey-core";
import { useAppStore } from "aihappey-state";
import { ThemeProvider as BootstrapThemeProvider } from "aihappey-theme-bootstrap";
import { ThemeProvider as FluentThemeProvider } from "aihappey-theme-fluent";

declare const __AGENT_ENDPOINT__: string;
declare const __API_BASE_URL__: string;
declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;
declare const __CHAT_APP_MCP__: string;

const themes = [
  { id: "fluent", label: "Fluent", Provider: FluentThemeProvider },
  { id: "bootstrap", label: "Bootstrap", Provider: BootstrapThemeProvider },
];

const App = () => {
  const selectedThemeId = useAppStore((state) => state.selectedThemeId);
  const setSelectedThemeId = useAppStore((state) => state.setSelectedThemeId);

  return (
  <MultiThemeProvider
    themes={themes}
    defaultThemeId="fluent"
    selectedThemeId={selectedThemeId}
    onThemeChange={setSelectedThemeId}
  >
    <CoreRoot
      appName={__APP_NAME__}
      baseUrl={__API_BASE_URL__}
      agentEndpoint={__AGENT_ENDPOINT__}
      appVersion={__APP_VERSION__}
      chatAppMcp={__CHAT_APP_MCP__}
      chatConfig={{
        defaultProvidersByType: {
          language: ["Pollinations", "GTranslate", "Echo", "UncloseAI", "AndyAPI"],
          image: ["Pollinations"],
          transcription: [],
          speech: [],
          reranking: [],
          video: [],
        },
      }}

    />
  </MultiThemeProvider>
  );
};

export default App;
