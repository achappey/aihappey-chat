import type { Provider } from "aihappey-types";

export const therouterai: Provider = {
  name: "TheRouterAI",
  description: "OpenAI-compatible API gateway with health-aware routing, automatic failover, and governance for multiple LLM providers.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://therouter.ai&size=128"
  }],
  urls: {
    homepage: "https://therouter.ai",
    docs: "https://therouter.ai/docs",
    privacyPolicy: "https://therouter.ai/docs/guides/privacy/data-collection"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

