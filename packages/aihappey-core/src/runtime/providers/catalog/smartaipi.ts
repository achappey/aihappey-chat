import type { Provider } from "aihappey-types";

export const smartaipi: Provider = {
  name: "SmartAIPI",
  description: "Access OpenAI frontier models at a fraction of the cost. Drop-in OpenAI-compatible API with 75% savings on GPT-5, Codex, and more.",
  icons: [{
    src: "https://smartaipi.com/assets/smartaipi-favicon.png"
  }],
  urls: {
    homepage: "https://smartaipi.com",
    docs: "https://smartaipi.com/docs",
    pricing: "https://smartaipi.com/#pricing"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

