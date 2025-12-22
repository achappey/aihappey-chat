import CoreRoot from "aihappey-core";
import { ThemeProvider } from "aihappey-theme-fluent";
import { loginRequest, msalConfig } from "./msalConfig";
declare const __CHAT_API__: string;
declare const __MODELS_API__: string;
declare const __SAMPLING_API__: string;
declare const __TRANSCRIPTION_API__: string;
declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;
declare const __CHAT_APP_MCP__: string;
declare const __CONVERSATIONS_API_URL__: string;
declare const __CONVERSATIONS_SCOPES__: string[];

const App = () => (
  <ThemeProvider>
    <CoreRoot
      appName={__APP_NAME__}
      appVersion={__APP_VERSION__}
      conversationsApi={__CONVERSATIONS_API_URL__}
      conversationsScopes={__CONVERSATIONS_SCOPES__}
      chatAppMcp={__CHAT_APP_MCP__}
      chatConfig={{
        api: __CHAT_API__,
        modelsApi: __MODELS_API__,
        samplingApi: __SAMPLING_API__,
        transcriptionApi: __TRANSCRIPTION_API__
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
