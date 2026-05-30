import type { Provider } from "aihappey-types";

export const glama: Provider = {
  name: "Glama",
  description: "Fast, Reliable AI Gateway",
  icons: [{
    src: "https://glama.ai/logo.png"
  }],
  urls: {
    homepage: "https://glama.ai",
    docs: "https://glama.ai/gateway/docs",
    pricing: "https://glama.ai/pricing",
    privacyPolicy: "https://glama.ai/policies/privacy-policy",
    termsOfService: "https://glama.ai/policies/terms-of-service"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

