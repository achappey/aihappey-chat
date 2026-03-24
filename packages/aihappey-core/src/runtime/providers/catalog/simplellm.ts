import type { Provider } from "aihappey-types";

export const simplellm: Provider = {
  name: "SimpleLLM",
  description: "OpenAI-compatible LLM API, 100% hosted in the EU. GDPR/DSGVO-compliant. German company. No US data transfers.",
  icons: [{
    src: "https://simplellm.eu/favicon.svg"
  }],
  urls: {
    homepage: "https://simplellm.eu",
    docs: "https://simplellm.eu/docs",
    pricing: "https://simplellm.eu/#pricing",
    privacyPolicy: "https://simplellm.eu/datenschutz",
    termsOfService: "https://simplellm.eu/agb"
  },
  providerCountry: "DE",
  inferenceRegions: ["Europe"]

};

