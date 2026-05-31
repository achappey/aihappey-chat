import type { Provider } from "aihappey-types";

export const opengateway: Provider = {
  name: "OpenGateway",
  description: "OpenAI-compatible gateway connecting OpenAI, Anthropic, Google, and Azure with automatic failover, real-time logs, and cost tracking. One API key, one dashboard, one invoice.",
  icons: [{
    src: "https://opengateway.ai/icon.svg?07de003a1a421a3a"
  }],
  urls: {
    homepage: "https://opengateway.ai",
    pricing: "https://opengateway.ai/models",
    docs: "https://opengateway.ai/api-docs"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

