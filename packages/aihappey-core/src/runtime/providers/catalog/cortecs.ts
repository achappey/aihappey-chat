import type { Provider } from "aihappey-types";

export const cortecs: Provider = {
  name: "Cortecs",
  description: "Cortecs is Europe's LLM router for cost, speed, and compliance. Dynamically route AI workloads to the best models, all hosted within the EU, ensuring full GDPR compliance.",
  urls: {
    homepage: "https://cortecs.ai",
    docs: "https://docs.cortecs.ai",
    pricing: "https://cortecs.ai/pricing",
    privacyPolicy: "https://cortecs.ai/privacyPolicy",
    termsOfService: "https://cortecs.ai/termsOfUse"
  },
  providerCountry: "AT",
  category: "gateway_router",
  inferenceRegions: ["Europe"],
  apiBaseUrl: "https://api.cortecs.ai",
  chatEndpoints: ["/v1/chat/completions", "/v1/messages"],

};

