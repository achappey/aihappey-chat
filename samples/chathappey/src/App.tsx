import CoreRoot from "aihappey-core";
import { ThemeProvider } from "aihappey-theme-fluent";
declare const __CHAT_API__: string;
declare const __AGENT_ENDPOINT__: string;
declare const __MODELS_API__: string;
declare const __SAMPLING_API__: string;
declare const __TRANSCRIPTION_API__: string;
declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;
declare const __CHAT_APP_MCP__: string;

const App = () => (
  <ThemeProvider>
    <CoreRoot
      appName={__APP_NAME__}
      agentEndpoint={__AGENT_ENDPOINT__}
      appVersion={__APP_VERSION__}
      chatAppMcp={__CHAT_APP_MCP__}
      chatConfig={{
        api: __CHAT_API__,
        modelsApi: __MODELS_API__,
        samplingApi: __SAMPLING_API__,
        transcriptionApi: __TRANSCRIPTION_API__
      }}
    />
  </ThemeProvider>
);

export default App;
