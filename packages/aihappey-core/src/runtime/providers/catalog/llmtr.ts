import type { Provider } from "aihappey-types";

export const llmtr: Provider = {
  name: "LLMTR",
  description: "Türkiye'de barındırılan ve global LLM modellerine tek API üzerinden erişim sağlayan gateway platformu. OpenAI, Anthropic, Google, Mistral ve daha fazlası.",
  icons: [{
    src: "https://llmtr.com/favicon.svg"
  }],
  urls: {
    homepage: "https://llmtr.com",
    docs: "https://llmtr.com/docs",
    pricing: "https://llmtr.com/pricing",
    privacyPolicy: "https://llmtr.com/en/privacy",
    termsOfService: "https://llmtr.com/en/terms"
  },
  providerCountry: "TR",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

