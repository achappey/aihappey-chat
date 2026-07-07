import type { Provider } from "aihappey-types";

export const hostyourai: Provider = {
  name: "HostYourAI",
  description:
    "Open LLMs on EU GPUs via an OpenAI- and Anthropic-compatible API. GDPR-compliant: your data never leaves the EU. Shared Router or dedicated instance.",
  urls: {
    homepage: "https://hostyourai.com",
    docs: "https://hostyourai.com/docs/management-api",
    pricing: "https://hostyourai.com/pricing",
    privacyPolicy: "https://hostyourai.com/nl/legal/privacy-policy",
    termsOfService: "https://hostyourai.com/nl/legal/terms-of-service"
  },
  providerCountry: "NL",
  category: "inference_compute",
  inferenceRegions: ["Europe"],
  apiBaseUrl: "https://hostyourai.com/api",
  chatEndpoints: ["/v1/chat/completions"],

};

