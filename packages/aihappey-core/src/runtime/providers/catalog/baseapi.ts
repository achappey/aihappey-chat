import type { Provider } from "aihappey-types";

export const baseapi: Provider = {
  name: "BaseAPI",
  description: "Stable AI Proxy API with transparent pricing and 5-minute integration. AI infrastructure solution for MMO.",
  icons: [{
    src: "https://baseapi.dev/logo.png"
  }],
  urls: {
    homepage: "https://baseapi.dev",
    docs: "https://baseapi.dev/docs",
    pricing: "https://baseapi.dev/#pricing",
    privacyPolicy: "https://baseapi.dev/privacy",
    termsOfService: "https://baseapi.dev/terms"
  },
  inferenceRegions: ["World"]

};

