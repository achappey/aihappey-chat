import type { Provider } from "aihappey-types";

export const navyai: Provider = {
  name: "NavyAI",
  description: "A single API to access state-of-the-art models from OpenAI, Google, Mistral, and more.",
  icons: [
    {
      src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://api.navy&size=128"
    }
  ],
  urls: {
    homepage: "https://api.navy",
    docs: "https://api.navy/docs",
    pricing: "https://api.navy/pricing",
    termsOfService: "https://api.navy/terms",
    privacyPolicy: "https://api.navy/privacy"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]
};

