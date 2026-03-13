import type { Provider } from "aihappey-types";

export const novai: Provider = {
  name: "NovAI",
  description: "NovAI provides low-latency AI API access from Hong Kong. DeepSeek, Qwen, GLM, Doubao via OpenAI-compatible API. $0.50 free credits. Pay with PayPal or USDT.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://aiapi-pro.com&size=128"
  }],
  urls: {
    homepage: "https://aiapi-pro.com",
    pricing: "https://aiapi-pro.com/pricing.html",
  },
  providerCountry: "HK",
  inferenceRegions: ["World"]

};

