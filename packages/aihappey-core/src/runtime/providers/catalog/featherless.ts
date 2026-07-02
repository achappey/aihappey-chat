import type { Provider } from "aihappey-types";

export const featherless: Provider = {
  name: "Featherless",
  description: "Instantly run any Llama model from HuggingFace without setting up any servers. Over 24,800+ models available.",
  icons: [
    {
      src: "https://featherless.ai/images/feather-icon.png"
    }
  ],
  urls: {
    homepage: "https://featherless.ai",
    docs: "https://featherless.ai/docs",
    pricing: "https://featherless.ai/#pricing",
    privacyPolicy: "https://featherless.ai/privacy",
    termsOfService: "https://featherless.ai/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://api.featherless.ai",
  chatEndpoints: ["/v1/chat/completions"],

};

