import CoreRoot from "aihappey-core";
import { configureAppStore } from "aihappey-state";
import { ThemeProvider } from "aihappey-theme-fluent";
import { loginRequest, msalConfig } from "./msalConfig";
import { defaultAgents as sampleDefaultAgents } from "./defaultAgents";
declare const __CHAT_API__: string;
declare const __API_BASE_URL__: string;
declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;
declare const __CONVERSATIONS_API_URL__: string;
declare const __CONVERSATIONS_SCOPES__: string[];

configureAppStore({ defaultAgents: sampleDefaultAgents });

const App = () => (
  <ThemeProvider>
    <CoreRoot
      appName={__APP_NAME__}
      baseUrl={__API_BASE_URL__}
      appVersion={__APP_VERSION__}
      conversationsApi={__CONVERSATIONS_API_URL__}
      conversationsScopes={__CONVERSATIONS_SCOPES__}
      chatConfig={{
        api: __CHAT_API__,
        defaultProvidersByType: {
          language: ["OpenAI", "Anthropic", "Google", "xAI", "Pollinations"],
          image: ["OpenAI", "Pollinations"],
          transcription: ["OpenAI", "ElevenLabs"],
          speech: ["OpenAI", "ElevenLabs"],
          reranking: ["Cohere"],
          video: ["Runway"],
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
