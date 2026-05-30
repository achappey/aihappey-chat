import type { Provider } from "aihappey-types";

export const jiekouai: Provider = {
  name: "JiekouAI",
  description:
    "Large-model API aggregation platform, domestic direct connection to OpenAI, Claude, and Gemini, enterprise-grade 99.9% SLA. Pay-as-you-go permanently valid, global acceleration + intelligent cost reduction + 7×24 support, quickly integrate AI capabilities.",
  icons: [
    {
      src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://jiekou.ai&size=128"
    }
  ],
  urls: {
    homepage: "https://jiekou.ai",
    docs: "https://docs.jiekou.ai/docs",
    pricing: "https://jiekou.ai/pricing",
    termsOfService: "https://jiekou.ai/legal/terms-of-service"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

