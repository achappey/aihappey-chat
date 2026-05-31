import type { Provider } from "aihappey-types";

export const alltoken: Provider = {
  name: "AllToken",
  description: "Route text, vision, and video models through one OpenAI-compatible API.",
  icons: [{
    src: "https://alltoken.ai/favicon-32x32.png"
  }],
  urls: {
    homepage: "https://alltoken.ai",
    docs: "https://alltoken.ai/docs",
    pricing: "https://alltoken.ai/pricing",
    privacyPolicy: "https://alltoken.ai/privacy",
    termsOfService: "https://alltoken.ai/terms"
  },
  providerCountry: "HK",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

