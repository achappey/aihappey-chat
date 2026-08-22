import type { Provider } from "aihappey-types";

export const xiaomimimo: Provider = {
  name: "XiaomiMIMO",
  description: "Experience the powerful capabilities of Xiaomi MiMo's large-scale model now and explore the infinite possibilities of AI.",
  urls: {
    homepage: "https://mimo.xiaomi.com",
    docs: "https://mimo.mi.com/docs",
    console: "https://platform.xiaomimimo.com",
    pricing: "https://mimo.mi.com/docs/en-US/price/pay-as-you-go",
    privacyPolicy: "https://privacy.mi.com/XiaomiMiMoPlatform/en_GB",
    termsOfService: "https://mimo.mi.com/docs/quick-start/terms/user-agreement"
  },
  providerCountry: "SG",
  category: "model_provider",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://api.xiaomimimo.com",
  chatEndpoints: ["/v1/chat/completions", "/v1/messages", "/v1/responses"],

};


