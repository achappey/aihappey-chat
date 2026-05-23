import type { Provider } from "aihappey-types";

export const cheapestinference: Provider = {
  name: "CheapestInference",
  description:
    "Access open-source AI models through a single OpenAI-compatible API. Flat-rate pricing with no per-token charges. Pay with card or USDC on Base.",
  icons: [
    {
      src: "https://cheapestinference.com/og.png",
    },
  ],
  urls: {
    homepage: "https://cheapestinference.com",
    pricing: "https://cheapestinference.com/pricing",
    docs: "https://docs.cheapestinference.com",
    terms: "https://cheapestinference.com/terms",
    privacy: "https://docs.cheapestinference.com/privacy"
  },
  inferenceRegions: ["World"]
};

