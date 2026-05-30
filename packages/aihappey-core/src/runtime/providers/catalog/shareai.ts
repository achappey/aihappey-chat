import type { Provider } from "aihappey-types";

export const shareai: Provider = {
  name: "ShareAI",
  description: "One API to 150+ AI models across many providers. Auto-routing and failover for speed and uptime. Pay per token; 70% goes to the GPUs serving requests.",
  icons: [{
    src: "https://shareai.now/wp-content/uploads/2025/09/shareai-faviconborders-300x300.png"
  }],
  urls: {
    homepage: "https://shareai.now",
    docs: "https://shareai.now/documentation",
    pricing: "https://shareai.now/models"
  },
  providerCountry: "RO",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

