import type { Provider } from "aihappey-types";

export const novai: Provider = {
  name: "NovAI",
  description: "NovAI provides low-latency AI API access from Hong Kong. DeepSeek, Qwen, GLM, Doubao via OpenAI-compatible API. $0.50 free credits. Pay with PayPal or USDT.",
  urls: {
    homepage: "https://aiapi-pro.com",
    pricing: "https://aiapi-pro.com/pricing.html",
  },
  providerCountry: "HK",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

