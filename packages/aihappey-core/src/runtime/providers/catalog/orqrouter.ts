import type { Provider } from "aihappey-types";

export const orqrouter: Provider = {
  name: "OrqRouter",
  description: "Route all your AI traffic through a single, production-ready gateway. Swap models without rewrites. Stay in control as you scale.",
  icons: [
    {
      src: "https://avatars.githubusercontent.com/u/92824965?s=280&v=4"
    }
  ],
  urls: {
    homepage: "https://router.orq.ai",
    docs: "https://docs.orq.ai/docs/router/overview",
    console: "https://my.orq.ai",
    pricing: "https://router.orq.ai/pricing",
    termsOfService: "https://orq.ai/legal/terms-of-service",
    privacyPolicy: "https://orq.ai/legal/privacy"
  },
  providerCountry: "NL",
  category: "gateway_router",
  inferenceRegions: ["World"]
};

