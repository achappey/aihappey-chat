import type { Provider } from "aihappey-types";

export const abliteration: Provider = {
  name: "Abliteration",
  description:
    "Developer-controlled, less-censored LLM API with OpenAI-compatible /v1/chat/completions plus a Policy Gateway for enterprise AI governance (policy-as-code, quotas, rollouts, audit logs). Zero prompt/output retention and usage-based pricing.",
  icons: [
    {
      src: "https://abliteration.ai/icon-512.png",
    },
  ],
  urls: {
    homepage: "https://abliteration.ai",
    pricing: "https://abliteration.ai/pricing",
    privacyPolicy: "https://abliteration.ai/privacy-policy",
    termsOfService: "https://abliteration.ai/terms-of-service",
    docs: "https://docs.abliteration.ai"
  },
  providerCountry: "US",
  category: "model_provider",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://api.abliteration.ai",
  chatEndpoints: ["/v1/chat/completions", "/v1/responses", "/v1/messages"]
};

