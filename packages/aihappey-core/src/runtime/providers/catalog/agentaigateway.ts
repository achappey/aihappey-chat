import type { Provider } from "aihappey-types";

export const agentaigateway: Provider = {
  name: "AgentAIGateway",
  description: "x402-backed AI gateway for autonomous agents.",
  urls: {
    homepage: "https://www.agentaigateway.com",
    docs: "https://www.agentaigateway.com/docs"
  },
  experimental: true,
  category: "gateway_router",
  inferenceRegions: ["World"]

};

