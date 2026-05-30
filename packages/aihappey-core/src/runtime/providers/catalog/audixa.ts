import type { Provider } from "aihappey-types";

export const audixa: Provider = {
  name: "Audixa",
  description:
    "Skip the overpriced APIs. Get blazing-fast, studio-quality speech for a fraction of the cost.",
  icons: [
    {
      src: "https://cdn.audixa.ai/brand.png",
    },
  ],
  urls: {
    homepage: "https://audixa.ai",
    docs: "https://docs.audixa.ai",
    pricing: "https://audixa.ai/pricing",
    privacyPolicy: "https://audixa.ai/privacy",
    termsOfService: "https://audixa.ai/tos"
  },
  providerCountry: "IN",
  category: "media_voice",
  inferenceRegions: ["World"]

};

