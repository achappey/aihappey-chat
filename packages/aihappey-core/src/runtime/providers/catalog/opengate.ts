import type { Provider } from "aihappey-types";

export const opengate: Provider = {
  name: "OpenGate",
  description: "OpenGate gives resellers, buyers, and builders a polished gateway for OpenAI-compatible chat, responses, image generation, managed API keys, usage visibility, and quota controls.",
  icons: [{
    src: "https://www.opengate.host/logo.svg"
  }],
  urls: {
    homepage: "https://www.opengate.host",
    pricing: "https://www.opengate.host/pricing",
    docs: "https://www.opengate.host/docs"
  },
  category: "gateway_router",
  providerCountry: "ID",
  inferenceRegions: ["World"]

};

