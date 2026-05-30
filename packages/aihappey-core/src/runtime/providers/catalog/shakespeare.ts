import type { Provider } from "aihappey-types";

export const shakespeare: Provider = {
  name: "Shakespeare",
  description: "Build custom apps with AI assistance using Shakespeare, an open-source development environment.",
  icons: [{
    src: "https://shakespeare.diy/shakespeare-192x192.png"
  }],
  urls: {
    homepage: "https://shakespeare.diy",
    docs: "https://ai.shakespeare.diy/docs",
    pricing: "https://ai.shakespeare.diy",
    termsOfService: "https://ai.shakespeare.diy/terms"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

