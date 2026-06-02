import type { Provider } from "aihappey-types";

export const llmstats: Provider = {
  name: "LLMStats",
  description: "The LLM Leaderboard — independent ranking of GPT, Claude, Gemini, Llama, DeepSeek and 300+ AI models by intelligence, speed and price. Composite LLM Stats Score updated continuously from public benchmarks and live API metrics.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://llm-stats.com&size=128"
  }],
  urls: {
    homepage: "https://llm-stats.com",
    docs: "https://llm-stats.com/router",
    privacyPolicy: "https://llm-stats.com/legal/privacy-policy",
    termsOfService: "https://llm-stats.com/legal/terms-of-service"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

