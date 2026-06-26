import CoreRoot from "aihappey-core";
import { configureAppStore } from "aihappey-state";
import { ThemeProvider } from "aihappey-theme-bootstrap";
import { loginRequest, msalConfig } from "./msalConfig";
import { defaultAgents as sampleDefaultAgents } from "./defaultAgents";
declare const __API_BASE_URL__: string;
declare const __APP_NAME__: string;
declare const __AGENT_ENDPOINT__: string;
declare const __AGENT_SCOPES__: string[];
declare const __APP_VERSION__: string;

configureAppStore({ defaultAgents: sampleDefaultAgents });

const App = () => (
  <ThemeProvider>
    <CoreRoot
      appName={__APP_NAME__}
      baseUrl={__API_BASE_URL__}
      appVersion={__APP_VERSION__}
      agentEndpoint={__AGENT_ENDPOINT__}
      agentScopes={__AGENT_SCOPES__}
      chatConfig={{
        defaultProvidersByType: {
          language: ["OpenAI", "Anthropic", "Google", "xAI"],
          image: ["OpenAI"],
          audio: ["OpenAI"],
          transcription: ["OpenAI", "Gladia"],
          speech: ["OpenAI"],
          reranking: ["Cohere"],
          video: ["OpenAI"],
        },
      }}
      authConfig={{
        msal: {
          clientId: msalConfig.auth.clientId,
          authority: msalConfig.auth.authority!,
          redirectUri: msalConfig.auth.redirectUri!,
          scopes: loginRequest.scopes!,
        },
      }}
    />
  </ThemeProvider>
);

export default App;
