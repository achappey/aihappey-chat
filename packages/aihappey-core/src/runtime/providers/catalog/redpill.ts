import type { Provider } from "aihappey-types";

export const redpill: Provider = {
  name: "RedPill",
  description: "Private ChatGPT alternative with 200+ AI models. End-to-end encryption, TEE security, zero data retention.",
  icons: [{
    src: "https://www.redpill.ai/android-chrome-512x512.png"
  }],
  urls: {
    homepage: "https://www.redpill.ai",
    docs: "https://docs.redpill.ai",
    pricing: "https://www.redpill.ai/pricing",
    privacyPolicy: "https://www.redpill.ai/privacy",
    termsOfService: "https://www.redpill.ai/terms"
  },
  providerCountry: "SG",
  inferenceRegions: ["World"]

};

