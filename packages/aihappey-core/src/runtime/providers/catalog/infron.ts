import type { Provider } from "aihappey-types";

export const infron: Provider = {
  name: "Infron",
  description: "Enterprise-grade platform for models and agents — unified API, unified billing, deploy in minutes, with dedicated throughput and SLA-backed performance.",
  urls: {
    homepage: "https://infron.ai",
    docs: "https://infron.ai/docs",
    pricing: "https://infron.ai/docs/overview/pricing-and-fee-structure",
    console: "https://infron.ai/dashboard",
    privacyPolicy: "https://infron.ai/privacy-policy",
    termsOfService: "https://infron.ai/terms-of-use"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://llm.onerouter.pro",
  chatEndpoints: ["/v1/chat/completions", "/v1/responses", "/v1/messages"]

};

