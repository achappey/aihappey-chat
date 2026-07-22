import type { Provider } from "aihappey-types";

export const akumi: Provider = {
  name: "Akumi",
  description: "Akumi is the EU-sovereign, drop-in OpenAI-compatible API. Your prompts, models, and data stay in the EU, governed and audited from the first token.",
  urls: {
    homepage: "https://akumi.cloud",
    docs: "https://akumi.cloud/docs",
    pricing: "https://akumi.cloud/pricing",
    privacyPolicy: "https://akumi.cloud/legal/privacy",
    termsOfService: "https://akumi.cloud/legal/terms"
  },
  providerCountry: "NL",
  category: "gateway_router",
  inferenceRegions: ["Europe"]

};

