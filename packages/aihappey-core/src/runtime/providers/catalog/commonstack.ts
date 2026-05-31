import type { Provider } from "aihappey-types";

export const commonstack: Provider = {
  name: "Commonstack",
  description: "Connect to the world’s best closed source and open source LLMs through a single, reliable gateway, manage your integrations and usage efficiently, and reduce inference costs on all of the top models.",
  icons: [{
    src: "https://commonstack.ai/favicon.ico"
  }],
  urls: {
    homepage: "https://commonstack.ai",
    docs: "https://docs.commonstack.ai",
    privacyPolicy: "https://commonstack.ai/privacy-policy",
    termsOfService: "https://commonstack.ai/terms-of-service"
  },
  providerCountry: "SG",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

