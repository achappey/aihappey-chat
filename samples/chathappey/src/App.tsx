import CoreRoot from "aihappey-core";
import { ThemeProvider } from "aihappey-theme-fluent";

declare const __AGENT_ENDPOINT__: string;
declare const __API_BASE_URL__: string;
declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;
declare const __CHAT_APP_MCP__: string;

const App = () => (
  <ThemeProvider>
    <CoreRoot
      appName={__APP_NAME__}
      baseUrl={__API_BASE_URL__}
      agentEndpoint={__AGENT_ENDPOINT__}
      appVersion={__APP_VERSION__}
      chatAppMcp={__CHAT_APP_MCP__}
    />
  </ThemeProvider>
);

export default App;
