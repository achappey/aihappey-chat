import type { Provider } from "aihappey-types";

export const aether: Provider = {
  name: "Aether",
  description: "Access OpenAI, Anthropic, Google, and more through a single unified API. 30% cheaper with 99.95% uptime.",
  icons: [{
    src: "https://aetherapi.dev/logo-icon-black.png"
  }],
  urls: {
    homepage: "https://aetherapi.dev",
    docs: "https://aetherapi.dev/#/docs/quickstart",
    pricing: "https://aetherapi.dev/#/pricing",
    privacyPolicy: "https://aetherapi.dev/#/privacy",
    termsOfService: "https://aetherapi.dev/#/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://api.aetherapi.dev",
  // Chat Completions is shared by the chat catalogue; some models do not support Responses.
  chatEndpoints: ["/v1/chat/completions"]

};
