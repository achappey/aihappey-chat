import { DocsRoot, MultiThemeProvider } from "aihappey-docs";
import { ThemeProvider as BootstrapThemeProvider } from "aihappey-theme-bootstrap";
import { ThemeProvider as FluentThemeProvider } from "aihappey-theme-fluent";
import { ThemeProvider as HtmlThemeProvider } from "aihappey-theme-html";
import { ThemeProvider as MantinetThemeProvider } from "aihappey-theme-mantine";
import { ThemeProvider as MaterialThemeProvider } from "aihappey-theme-material";
import { ThemeProvider as ChakraThemeProvider } from "aihappey-theme-chakra";
import {
  ThemeProvider as ShadcnThemeProvider
} from "aihappey-theme-shadcn";
import React, { useState } from "react";

declare const __AGENT_ENDPOINT__: string;
declare const __API_BASE_URL__: string;
declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;

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
  const [selectedThemeId, setSelectedThemeId] = useState("shadcn");
  
  return (
    <MultiThemeProvider
      themes={themes}
      defaultThemeId="shadcn"
      selectedThemeId={selectedThemeId}
      onThemeChange={setSelectedThemeId}
    >
      <DocsRoot
        appTitle={__APP_NAME__ || "aihappey Developers"}
        apiBaseUrl={__API_BASE_URL__}
        agentApiBaseUrl={__AGENT_ENDPOINT__}
        authMode="provider-key"
      />
    </MultiThemeProvider>
  );
};

export default App;
