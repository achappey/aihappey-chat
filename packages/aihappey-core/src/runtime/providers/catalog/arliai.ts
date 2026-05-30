import type { Provider } from "aihappey-types";

export const arliai: Provider = {
  name: "ArliAI",
  description:
    "Unrestricted AI Inference Platform for power users.",
  icons: [
    {
      src: "https://www.arliai.com/apple-touch-icon.png"
    }
  ],
  urls: {
    homepage: "https://www.arliai.com",
    docs: "https://www.arliai.com/docs/api",
    pricing: "https://www.arliai.com/pricing",
    privacyPolicy: "https://www.arliai.com/privacy",
    termsOfService: "https://www.arliai.com/terms"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]
};

