import type { Provider } from "aihappey-types";

export const gatemind: Provider = {
  name: "GateMind",
  description: "Unlock the Agentic Economy. GateMind provides a unified API and intelligent routing layer that allows autonomous AI agents to execute complex tasks, pay for compute dynamically via x402 Agentic Payments, and select specialized models on demand.",
  icons: [{
    src: "https://gatemind.ai/gatemind-icon.png"
  }],
  urls: {
    homepage: "https://gatemind.ai",
    pricing: "https://gatemind.ai/pricing",
    console: "https://gatemind.ai/app"
  },
  experimental: true,
  category: "inference_compute",
  inferenceRegions: ["World"]

};

