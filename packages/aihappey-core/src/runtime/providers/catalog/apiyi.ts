import type { Provider } from "aihappey-types";

export const apiyi: Provider = {
  name: "APIyi",
  description: "Enterprise-level professional and stable relay distribution of official same-source interfaces for all models such as OpenAI o1 / DeepSeek / Claude 3.7 / Gemini / Grok APIs, etc. No speed limits, no expiration, not afraid of account bans, usage-based billing, long-term reliable service.",
  icons: [{
    src: "https://docs.apiyi.com/logo/logo.webp"
  }],
  urls: {
    homepage: "https://apiyi.com",
    docs: "https://apiyi.com/quick-start.html",
    console: "https://api.apiyi.com",
    privacyPolicy: "https://apiyi.com/privacyPolicy.html",
    termsOfService: "https://apiyi.com/serviceAgreement.html"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

