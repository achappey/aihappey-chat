import type { Provider } from "aihappey-types";

export const kimrel: Provider = {
  name: "Kimrel",
  description: "Kimrel is an independent AI workspace that gives you access to Kimi K2 models for coding, writing, analysis, and real-time web search.",
  icons: [{
    src: "https://kimrel.com/logo.svg"
  }],
  urls: {
    homepage: "https://kimrel.com",
    docs: "https://kimrel.com/api-docs",
    pricing: "https://kimrel.com/#pricing",
    privacyPolicy: "https://kimrel.com/privacy-policy",
    termsOfService: "https://kimrel.com/terms-of-service"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

