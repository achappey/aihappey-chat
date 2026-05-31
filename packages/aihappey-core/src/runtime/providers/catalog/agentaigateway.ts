import type { Provider } from "aihappey-types";

export const agentaigateway: Provider = {
  name: "AgentAIGateway",
  description: "x402-backed AI gateway for autonomous agents.",
  icons: [
    {
      src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
      theme: "dark",
    },
    {
      src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=",
      theme: "light",
    },
  ],
  urls: {
    homepage: "https://www.agentaigateway.com",
    docs: "https://www.agentaigateway.com/docs"
  },
  experimental: true,
  category: "gateway_router",
  inferenceRegions: ["World"]

};

