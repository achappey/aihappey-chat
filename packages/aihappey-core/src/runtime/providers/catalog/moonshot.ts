import type { Provider } from "aihappey-types";
import { createProviderPricingGatewayMetadata } from "./providerPricing";

export const moonshot: Provider = {
  name: "Moonshot",
  description:
    "Moonshot AI is committed to solving ambitious moonshot problems that will lead humanity to AGI.",
  icons: [
    {
      src: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light/moonshot.png",
      theme: "light"
    },
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/moonshot.png",
      theme: "dark"
    },
  ],
  urls: {
    homepage: "https://www.moonshot.ai",
    docs: "https://platform.moonshot.ai/docs/overview",
    pricing: "https://platform.moonshot.ai/docs/pricing/chat",
    console: "https://platform.moonshot.ai/console",
    privacyPolicy: "https://platform.moonshot.ai/docs/agreement/userprivacy",
    termsOfService: "https://platform.moonshot.ai/docs/agreement/modeluse"
  },
  providerCountry: "CN",
  category: "model_provider",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://api.moonshot.ai",
  chatEndpoints: ["/v1/chat/completions"],
  createGatewayMetadata: createProviderPricingGatewayMetadata("moonshot")

};
