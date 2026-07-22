import type { Provider } from "aihappey-types";

export const neuralring: Provider = {
  name: "NeuralRing",
  description: "One OpenAI-compatible API in front of Europe's sovereign AI endpoints. Every answer arrives with a signed, independently verifiable record of where it ran and under whose jurisdiction.",
  urls: {
    homepage: "https://neuralring.eu",
    docs: "https://neuralring.eu/docs"
  },
  category: "gateway_router",
  inferenceRegions: ["Europe"]

};

