import type { Provider } from "aihappey-types";
import { createProviderPricingGatewayMetadata } from "./providerPricing";

export const anthropic: Provider = {
  name: "Anthropic",
  description:
    "Anthropic is an AI safety and research company that's working to build reliable, interpretable, and steerable AI systems.",
  urls: {
    homepage: "https://www.anthropic.com",
    docs: "https://docs.claude.com",
    console: "https://platform.claude.com",
    pricing: "https://platform.claude.com/docs/en/about-claude/pricing",
    privacyPolicy: "https://privacy.claude.com",
    termsOfService: "https://www.anthropic.com/legal/commercial-terms"
  },
  providerCountry: "US",
  category: "model_provider",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://api.anthropic.com",
  chatEndpoints: ["/v1/messages"],
  createGatewayMetadata: createProviderPricingGatewayMetadata("anthropic")

};
