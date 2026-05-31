import type { Provider } from "aihappey-types";

export const mycoai: Provider = {
  name: "MyCoAI",
  description: "A unified pay-per-token gateway for Claude, GPT, and every other frontier model.",
  icons: [{
    src: "https://mycoai.dev/icon.svg"
  }],
  urls: {
    homepage: "https://mycoai.dev",
    docs: "https://mycoai.dev/en/guides",
    pricing: "https://mycoai.dev/en/pricing",
    console: "https://mycoai.dev/en/dashboard"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

