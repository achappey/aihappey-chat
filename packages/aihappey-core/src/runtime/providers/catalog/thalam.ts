import type { Provider } from "aihappey-types";

export const thalam: Provider = {
  name: "Thalam",
  description: "OpenAI-compatible API gateway for GPT, Claude, Gemini, DeepSeek, Qwen, Kling and more — one key, one endpoint, one bill. Pay per token, no lock-in.",
  icons: [{
    src: "https://thalam.ai/apple-touch-icon.png"
  }],
  urls: {
    homepage: "https://thalam.ai",
    docs: "https://thalam.ai/docs/quickstart",
    pricing: "https://thalam.ai/pricing",
    privacyPolicy: "https://thalam.ai/privacy",
    termsOfService: "https://thalam.ai/terms"
  },
  providerCountry: "AE",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

