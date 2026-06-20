import type { Provider } from "aihappey-types";

export const greenpt: Provider = {
  name: "GreenPT",
  description:
    "GreenPT is a privacy-friendly AI chat platform, hosted in Europe and powered by renewable energy. Get clear answers with full transparency and peace of mind.",
  icons: [
    {
      src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://greenpt.com&size=512",
    },
  ],
  urls: {
    homepage: "https://greenpt.ai",
    pricing: "https://docs.greenpt.ai/api/pricing",
    privacyPolicy: "https://docs.greenpt.ai/privacy/privacy-policy",
    termsOfService: "https://docs.greenpt.ai/privacy/terms"
  },
  providerCountry: "NL",
  category: "gateway_router",
  inferenceRegions: ["Europe"]

};

