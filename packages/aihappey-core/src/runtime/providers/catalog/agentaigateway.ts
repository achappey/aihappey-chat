import type { Provider } from "aihappey-types";

export const agentaigateway: Provider = {
  name: "AgentAIGateway",
  description: "x402-backed AI gateway for autonomous agents.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.agentaigateway.com&size=128"
  }],
  urls: {
    homepage: "https://www.agentaigateway.com",
    docs: "https://www.agentaigateway.com/docs"
  },
  experimental: true,
  category: "gateway_router",
  inferenceRegions: ["World"]

};

