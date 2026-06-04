import type { Provider } from "aihappey-types";

export const humeai: Provider = {
  name: "HumeAI",
  description: "Providing the open source models, datasets, and evaluation APIs to embed emotional intelligence into your voice models.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://hume.ai&size=128"
  }],
  urls: {
    homepage: "https://www.hume.ai",
    docs: "https://dev.hume.ai",
    pricing: "https://www.hume.ai/pricing",
    privacyPolicy: "https://www.hume.ai/privacy-policy",
    termsOfService: "https://www.hume.ai/terms-of-use"
  },
  providerCountry: "US",
  category: "model_provider",
  inferenceRegions: ["World"]

};

