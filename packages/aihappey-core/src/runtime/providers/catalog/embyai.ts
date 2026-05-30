import type { Provider } from "aihappey-types";

export const embyai: Provider = {
  name: "EmbyAI",
  description: "Use GPT-4, Claude, Gemini & more in one private, EU-hosted AI chat app. No tracking, GDPR-friendly, fast & secure.",
  icons: [{
    src: "https://api.emby.ai/favicon.ico"
  }],
  urls: {
    homepage: "https://emby.ai",
    docs: "https://api.emby.ai",
    pricing: "https://api.emby.ai/#pricing",
    privacyPolicy: "https://api.emby.ai/#"
  },
  providerCountry: "NL",
  category: "app_tools",
  inferenceRegions: ["Europe"]

};

