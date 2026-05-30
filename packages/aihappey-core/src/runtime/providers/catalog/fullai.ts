import type { Provider } from "aihappey-types";

export const fullai: Provider = {
  name: "FullAI",
  description: "Build intelligent applications with FullAI. Drop-in replacement for OpenAI with better performance and lower costs.",
  icons: [{
    src: "https://www.fullai.com/icon.svg"
  }],
  urls: {
    homepage: "https://www.fullai.com",
    docs: "https://www.fullai.com/docs",
    pricing: "https://www.fullai.com/pricing",
    privacyPolicy: "https://www.fullai.com/privacy",
    termsOfService: "https://www.fullai.com/terms"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

