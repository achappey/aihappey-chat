import type { Provider } from "aihappey-types";

export const yougetai: Provider = {
  name: "YouGetAI",
  description: "One API, Every AI Model. Simple credit-based pricing. Any model. Switch freely. No per-token surprises.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://www.youget.ai&size=128"
  }],
  urls: {
    homepage: "https://www.youget.ai",
    pricing: "https://www.youget.ai/pricing"
  },
  inferenceRegions: ["World"]

};

