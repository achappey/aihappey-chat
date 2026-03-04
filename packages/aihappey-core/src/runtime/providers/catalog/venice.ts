import type { Provider } from "aihappey-types";

export const venice: Provider = {
  name: "Venice",
  description: "Venice is the easy app for private, uncensored AI conversations and image generation.",
  icons: [{
    src: "https://cryptoast.fr/wp-content/uploads/2025/03/venice-ai-logo.png"
  }],
  urls: {
    homepage: "https://venice.ai",
    docs: "https://docs.venice.ai",
    pricing: "https://docs.venice.ai/overview/pricing",
    privacyPolicy: "https://venice.ai/legal/privacy-policy",
    termsOfService: "https://venice.ai/legal/tos"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

