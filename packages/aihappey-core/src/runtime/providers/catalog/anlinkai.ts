import type { Provider } from "aihappey-types";

export const anlinkai: Provider = {
  name: "AnLinkAI",
  description: "Access Chinese AI models through one OpenAI-compatible API with transparent routing, USDT support, request logs, and beta trial credit.",
  icons: [{
    src: "https://anlinkai.com/favicon.png"
  }],
  urls: {
    homepage: "https://anlinkai.com",
    docs: "https://anlinkai.com/quickstart",
    pricing: "https://anlinkai.com/pricing"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

