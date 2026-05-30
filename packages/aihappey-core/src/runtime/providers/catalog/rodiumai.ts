import type { Provider } from "aihappey-types";

export const rodiumai: Provider = {
  name: "RodiumAI",
  description: "One API. Multiple models. Pay with Mobile Money. Recharge in RODI credits and use GPT, Claude, Llama, DeepSeek and more.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://rodiumai.io&size=128"
  }],
  urls: {
    homepage: "https://www.rodiumai.io",
    docs: "https://www.rodiumai.io/docs",
    pricing: "https://www.rodiumai.io/pricing",
    privacyPolicy: "https://www.rodiumai.io/privacy",
    termsOfService: "https://www.rodiumai.io/terms"
  },
  providerCountry: "NG",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

