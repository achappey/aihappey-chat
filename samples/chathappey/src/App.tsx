import CoreRoot, { MultiThemeProvider } from "aihappey-core";
import { configureAppStore, useAppStore } from "aihappey-state";
import { ThemeProvider as BootstrapThemeProvider } from "aihappey-theme-bootstrap";
import { ThemeProvider as FluentThemeProvider } from "aihappey-theme-fluent";
import {
  ThemeProvider as ShadcnThemeProvider,
  createSchemeFromBaseColor,
  type ShadcnThemeProviderProps,
} from "aihappey-theme-shadcn";
import { defaultAgents as sampleDefaultAgents } from "./defaultAgents";

declare const __AGENT_ENDPOINT__: string;
declare const __API_BASE_URL__: string;
declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;
declare const __CHAT_APP_MCP__: string;

const shadcnCustomSchemes: NonNullable<ShadcnThemeProviderProps["customSchemes"]> = {
  chathappey: {
    title: "chathappey",
    description: "App-configured shadcn scheme generated from a brand color.",
    ...createSchemeFromBaseColor("#4A72B4", "0.5rem"),
  },
};

configureAppStore({ defaultAgents: sampleDefaultAgents });

//    customSchemes={shadcnCustomSchemes}

const ConfiguredShadcnThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ShadcnThemeProvider
    defaultPresetId="tailwind:neutral"
  >
    {children}
  </ShadcnThemeProvider>
);

const themes = [
  { id: "bootstrap", label: "Bootstrap", Provider: BootstrapThemeProvider },
  { id: "fluent", label: "Fluent", Provider: FluentThemeProvider },
  { id: "shadcn", label: "Shadcn", Provider: ConfiguredShadcnThemeProvider },
];

const App = () => {
  const selectedThemeId = useAppStore((state) => state.selectedThemeId);
  const setSelectedThemeId = useAppStore((state) => state.setSelectedThemeId);

  return (
    <MultiThemeProvider
      themes={themes}
      defaultThemeId="shadcn"
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
