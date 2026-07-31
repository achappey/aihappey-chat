import type { Provider } from "aihappey-types";

export const foundry: Provider = {
  name: "Foundry",
  description: "Microsoft Foundry is a unified platform to build, ground, and govern AI apps and agents that understand your business context. It brings together the full agent lifecycle with open development, built-in intelligence, and consistent security, compliance, and policy controls across every agent.",
  icons: [{
    src: "https://devblogs.microsoft.com/foundry/wp-content/uploads/sites/89/2025/11/cropped-Microsoft-Foundry.2mb-scaled-1.webp"
  }],
  urls: {
    homepage: "https://azure.microsoft.com/en-us/products/ai-foundry",
    docs: "https://ai.azure.com/api-reference",
    console: "https://ai.azure.com",
    pricing: "https://azure.microsoft.com/en-us/pricing/details/microsoft-foundry",
    privacyPolicy: "https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/openai/data-privacy",
    termsOfService: "https://learn.microsoft.com/en-us/legal/microsoft-foundry/model-specific-terms"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["Europe", "Americas", "Asia", "Africa", "Oceania"]

};

