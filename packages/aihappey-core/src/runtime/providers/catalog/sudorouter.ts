import type { Provider } from "aihappey-types";

export const sudorouter: Provider = {
  name: "SudoRouter",
  description: "The Secured and Reliable GenAI Gateway for the Next Generation of AI Applications. A unified, privacy-preserving platform aggregating GenAI providers with seamless multi-model access.",
  icons: [{
    src: "https://sudorouter.ai/logo.svg"
  }],
  urls: {
    homepage: "https://sudorouter.ai",
    docs: "https://docs.sudorouter.ai",
    pricing: "https://sudorouter.ai/#pricing",
    privacyPolicy: "https://sudorouter.ai/#privacy",
    termsOfService: "https://sudorouter.ai/#terms"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

