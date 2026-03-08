import type { Provider } from "aihappey-types";

export const answira: Provider = {
  name: "Answira",
  description: "AI inference API hosted in Czech Republic. OpenAI-compatible API with European data residency. Prompts and responses are not stored.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://www.answira.ai&size=128"
  }],
  urls: {
    homepage: "https://www.answira.ai",
    docs: "https://www.answira.ai/inference/docs",
    console: "https://www.answira.ai/portal",
    pricing: "https://www.answira.ai/inference/#pricing",
    privacyPolicy: "https://www.answira.ai/inference/privacy",
    termsOfService: "https://www.answira.ai/inference/tos"
  },
  providerCountry: "CZ",
  inferenceRegions: ["Europe"]

};

