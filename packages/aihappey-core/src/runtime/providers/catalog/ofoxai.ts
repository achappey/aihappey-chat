import type { Provider } from "aihappey-types";

export const ofoxai: Provider = {
  name: "OfoxAI",
  description: "Unified LLM API gateway — access GPT-5.2, Claude Opus 4.5, Gemini 3, DeepSeek V3.2 and 100+ models through one API. OpenAI-compatible, 3-minute setup, pay-as-you-go. Low latency, 99.9% SLA. Built for developers who ship.",
  icons: [{
    src: "https://ofox.ai/favicon.ico"
  }],
  urls: {
    homepage: "https://ofox.ai",
    pricing: "https://ofox.ai/pricing",
    docs: "https://ofox.ai/docs",
    termsOfService: "https://ofox.ai/terms-of-service",
    privacyPolicy: "https://ofox.ai/privacy",
  },
  providerCountry: "SG",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

