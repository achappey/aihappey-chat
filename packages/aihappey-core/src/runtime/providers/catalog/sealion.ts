import type { Provider } from "aihappey-types";

export const sealion: Provider = {
  name: "SEALION",
  description:
    "SEA-LION is a family of efficient, open-source, multilingual, multimodal language models designed to understand Southeast Asia’s diverse languages, cultures, and contexts.",
  icons: [
    {
      src: "https://asean.newsroom.ibm.com/image/purple_sealion2.jpg"
    }
  ],
  urls: {
    homepage: "https://sea-lion.ai",
    docs: "https://docs.sea-lion.ai",
    console: "https://playground.sea-lion.ai"
  },
  experimental: true,
  providerCountry: "SG",
  category: "gateway_router",
  inferenceRegions: ["World"]
};