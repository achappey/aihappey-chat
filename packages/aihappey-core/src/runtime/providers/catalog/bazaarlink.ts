import type { Provider } from "aihappey-types";

export const bazaarlink: Provider = {
  name: "BazaarLink",
  description: "BazaarLink is a Taiwan-focused AI API gateway with 300+ models, OpenAI-compatible endpoints, TWD billing, unified invoices, and Chinese-language support.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://bazaarlink.ai&size=128"
  }],
  urls: {
    homepage: "https://bazaarlink.ai",
    docs: "https://bazaarlink.ai/docs",
    privacyPolicy: "https://bazaarlink.ai/privacy",
    termsOfService: "https://bazaarlink.ai/terms"
  },
  providerCountry: "TW",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

