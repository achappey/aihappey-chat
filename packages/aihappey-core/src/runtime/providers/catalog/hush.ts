import type { Provider } from "aihappey-types";

export const hush: Provider = {
  name: "Hush",
  description:
    "Infrastructure for AI agents: one gateway for models, isolated execution, hard spending controls and signed, verifiable compute records.",
  urls: {
    homepage: "https://www.hushcompute.xyz",
    docs: "https://www.hushcompute.xyz/docs"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]
};