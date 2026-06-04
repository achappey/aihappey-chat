import type { Provider } from "aihappey-types";

export const rewindai: Provider = {
  name: "RewindAI",
  description: "he world's best free AI tools. Chat, generate images, create videos, write content, code, and more.",
  icons: [{
    src: "https://rewind.ai/favicon.svg"
  }],
  urls: {
    homepage: "https://rewind.ai",
    docs: "https://rewind.ai/api",
    pricing: "https://rewind.ai/pricing",
    privacyPolicy: "https://rewind.ai/privacy",
    termsOfService: "https://rewind.ai/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

