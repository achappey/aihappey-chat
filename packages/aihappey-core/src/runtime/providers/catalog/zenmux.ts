import type { Provider } from "aihappey-types";

export const zenmux: Provider = {
  name: "ZenMux",
  description: "The Enterprise LLM Platform. Get a Unified API for all models, intelligent routing, and AI Model Insurance to eliminate hallucination risk.",
  icons: [{
    src: "https://avatars.githubusercontent.com/u/234901775?s=200&v=4"
  }],
  urls: {
    homepage: "https://zenmux.ai",
    docs: "https://zenmux.ai/docs",
    pricing: "https://zenmux.ai/pricing/pay-as-you-go",
    console: "https://zenmux.ai/platform",
    privacyPolicy: "https://docs.zenmux.ai/privacy.html",
    termsOfService: "https://docs.zenmux.ai/terms-of-service.html"
  },
  providerCountry: "SG",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

