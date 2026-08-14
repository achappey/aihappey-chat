import type { Provider } from "aihappey-types";

export const mistral: Provider = {
  name: "Mistral",
  description:
    "The most powerful AI platform for enterprises. Customize, fine-tune, and deploy AI assistants, autonomous agents, and multimodal AI with open models.",
  urls: {
    homepage: "https://mistral.ai",
    docs: "https://docs.mistral.ai",
    pricing: "https://mistral.ai/pricing/api/",
    privacyPolicy: "https://legal.mistral.ai/terms/privacy-policy",
    termsOfService: "https://legal.mistral.ai/terms",
    console: "https://console.mistral.ai"
  },
  providerCountry: "FR",
  category: "model_provider",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://api.mistral.ai",
  chatEndpoints: ["/v1/chat/completions", "/v1/conversations"],

};

