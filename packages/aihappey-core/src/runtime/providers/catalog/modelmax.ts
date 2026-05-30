import type { Provider } from "aihappey-types";

export const modelmax: Provider = {
  name: "ModelMax",
  description: "One API key to access 25+ frontier models from Google Gemini, DeepSeek, Qwen, Kimi, MiniMax, and Veo. OpenAI-compatible endpoint with zero markup on inference costs.",
  icons: [{
    src: "https://www.modelmax.io/resource/logo-400.png"
  }],
  urls: {
    homepage: "https://www.modelmax.io/",
    docs: "https://www.modelmax.io/docs",
    pricing: "https://www.modelmax.io/pricing",
    privacyPolicy: "https://www.modelmax.io/privacy",
    termsOfService: "https://www.modelmax.io/terms"
  },
  category: "inference_compute",
  inferenceRegions: ["World"]

};

