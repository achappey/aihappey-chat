import type { Provider } from "aihappey-types";

export const greenpt: Provider = {
  name: "GreenPT",
  description:
    "GreenPT is a privacy-friendly AI chat platform, hosted in Europe and powered by renewable energy. Get clear answers with full transparency and peace of mind.",
  icons: [
    {
      src: "https://greenpt.ai/content/uploads/2026/01/2993679_brand_brands_logo_logos_opera_icon@2x-800x800.webp",
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

