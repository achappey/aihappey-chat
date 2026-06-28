import type { Provider } from "aihappey-types";

export const sargalay: Provider = {
  name: "Sargalay",
  description: "OpenAI-compatible API for GPT-4o, Claude, Gemini & 100+ AI models. Pay in MMK with KBZPay, WavePay, AYA Pay — no USD card needed. Built for Myanmar developers.",
  icons: [{
    src: "https://www.sargalay.com/favicon.ico?favicon.0b3bf435.ico",
    theme: "light"
  }, {
    src: "https://www.sargalay.com/favicon-dark.svg",
    theme: "dark"
  }],
  urls: {
    homepage: "https://www.sargalay.com",
    console: "https://www.sargalay.com/console",
    privacyPolicy: "https://www.sargalay.com/privacy",
    termsOfService: "https://www.sargalay.com/terms"
  },
  providerCountry: "MM",
  category: "gateway_router",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://api.sargalay.com",
  chatEndpoints: ["/v1/chat/completions"],

};

