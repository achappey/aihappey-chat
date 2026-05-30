import type { Provider } from "aihappey-types";

export const swarms: Provider = {
  name: "Swarms",
  description: "Share, discover, and monetize autonomous agents, custom prompts, and specialized tools on the Swarms Marketplace.",
  icons: [{
    src: "https://swarms.world/swarms-logo.svg"
  }],
  urls: {
    homepage: "https://swarms.world",
    docs: "https://docs.swarms.world",
    pricing: "https://swarms.world/pricing",
    privacyPolicy: "https://swarms.world/pp",
    termsOfService: "https://swarms.world/tos"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

