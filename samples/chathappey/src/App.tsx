import CoreRoot, { MultiThemeProvider } from "aihappey-core";
import { configureAppStore, useAppStore } from "aihappey-state";
import { ThemeProvider as BootstrapThemeProvider } from "aihappey-theme-bootstrap";
import { ThemeProvider as FluentThemeProvider } from "aihappey-theme-fluent";
import { ThemeProvider as HtmlThemeProvider } from "aihappey-theme-html";
import { ThemeProvider as MantinetThemeProvider } from "aihappey-theme-mantine";
import { ThemeProvider as MaterialThemeProvider } from "aihappey-theme-material";
import { ThemeProvider as ChakraThemeProvider } from "aihappey-theme-chakra";
import {
  ThemeProvider as ShadcnThemeProvider
} from "aihappey-theme-shadcn";
import { defaultAgents as sampleDefaultAgents } from "./defaultAgents";

declare const __AGENT_ENDPOINT__: string;
declare const __API_BASE_URL__: string;
declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;
declare const __CHATBOT_INSTRUCTIONS__: string;
declare const __MCP_CATALOG_URLS__: string[];
declare const __PLUGIN_EXTENSION_NAMESPACE__: string;

configureAppStore({ defaultAgents: sampleDefaultAgents });

const ConfiguredShadcnThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ShadcnThemeProvider
    defaultPresetId="tailwind:neutral"
  >
    {children}
  </ShadcnThemeProvider>
);

const themes = [
  { id: "bootstrap", label: "Bootstrap", Provider: BootstrapThemeProvider },
  { id: "chakra", label: "Chakra", Provider: ChakraThemeProvider },
  { id: "fluent", label: "Fluent", Provider: FluentThemeProvider },
  { id: "html", label: "HTML", Provider: HtmlThemeProvider },
  { id: "material", label: "Material", Provider: MaterialThemeProvider },
  { id: "mantine", label: "Mantine", Provider: MantinetThemeProvider },
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
        pluginConfig={{
          extensionNamespace: __PLUGIN_EXTENSION_NAMESPACE__
        }}
        chatConfig={{
          chatbotInstructions: __CHATBOT_INSTRUCTIONS__,

          mcpCatalogUrls: __MCP_CATALOG_URLS__,
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
