import type { Provider } from "aihappey-types";

export const cloudferro: Provider = {
  name: "CloudFerro",
  description:
    "A fully managed Generative AI service with OpenAI-compatible endpoints. Access high-performing models via a single API. Easily integrate AI capabilities into your apps without infrastructure management.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYcrPo-JrcTP0DgLEGOL6E9Lc3H5U9Xmnk4g&s"
    }
  ],
  urls: {
    homepage: "https://sherlock.cloudferro.com",
    docs: "https://docs.sherlock.cloudferro.com",
    pricing: "https://cloudferro.com/ai/sherlock-managed-generative-ai-service/#pricing",
    privacyPolicy: "https://cloudferro.com/privacy-policy"
  },
  providerCountry: "PL",
  category: "inference_compute",
  inferenceRegions: ["Europe"]

};

