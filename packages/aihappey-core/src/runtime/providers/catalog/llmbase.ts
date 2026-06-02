import type { Provider } from "aihappey-types";

export const llmbase: Provider = {
  name: "LLMBase",
  description: "European ChatGPT alternative with 100+ AI models — GPT-5, Claude, Gemini, Grok, DeepSeek and open source models in one app. One subscription replaces ChatGPT, Claude and Gemini. GDPR compliant, hosted in Germany.",
  icons: [{
    src: "https://llmbase.ai/apple-touch-icon.png"
  }],
  urls: {
    homepage: "https://llmbase.ai",
    docs: "https://llmbase.ai/docs",
    pricing: "https://llmbase.ai/pricing",
    privacyPolicy: "https://llmbase.ai/legal/privacy",
    termsOfService: "https://llmbase.ai/legal/terms"
  },
  providerCountry: "DE",
  category: "gateway_router",
  inferenceRegions: ["Europe"]

};

