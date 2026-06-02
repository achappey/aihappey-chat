import type { Provider } from "aihappey-types";

export const commandcode: Provider = {
  name: "CommandCode",
  description: "The first AI coding agent that learns your coding taste. Powered by taste-1, a meta neuro-symbolic model. A modern alternative to Claude Code, Cursor, OpenCode, and Copilot.",
  icons: [{
    src: "https://commandcode.ai/favicon/2024/favicon-32x32.png"
  }],
  urls: {
    homepage: "https://commandcode.ai",
    docs: "https://commandcode.ai/docs",
    pricing: "https://commandcode.ai/pricing",
    privacyPolicy: "https://commandcode.ai/privacy",
    termsOfService: "https://commandcode.ai/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

