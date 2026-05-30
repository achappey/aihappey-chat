import type { Provider } from "aihappey-types";

export const llmgateway: Provider = {
  name: "LLMGateway",
  description:
    "Route, manage, and analyze your LLM requests across multiple providers with a unified API interface. Access OpenAI, Anthropic, Google, and 19+ providers through one API.",
  icons: [
    {
      src: "https://ph-files.imgix.net/c2dfedf5-ce71-4f9f-97c4-b06c4940b6a8.png?auto=format"
    }
  ],
  urls: {
    homepage: "https://llmgateway.io",
    docs: "https://docs.llmgateway.io",
    pricing: "https://llmgateway.io/pricing",
    termsOfService: "https://llmgateway.io/legal/terms",
    privacyPolicy: "https://llmgateway.io/legal/privacy",
    console: "https://llmgateway.io/dashboard"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]
};